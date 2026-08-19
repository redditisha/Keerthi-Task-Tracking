import { getMemberById } from '@/lib/sheets/team'
import { getAllTasks } from '@/lib/sheets/tasks'
import { getAllMembers } from '@/lib/sheets/team'
import { enrichTasks } from '@/lib/utils/calculations'
import { getAppSession } from '@/lib/auth/session'
import { TaskView } from '@/types'
import { notFound, redirect } from 'next/navigation'
import { StatusBadge, PriorityBadge, DeadlineBadge } from '@/components/ui/Badge'
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  isWithinInterval, parseISO, format,
} from 'date-fns'
import Link from 'next/link'

function countInInterval(tasks: TaskView[], start: Date, end: Date) {
  return tasks.filter((t) => {
    if (t.status !== 'Completed' || !t.completed_at) return false
    try { return isWithinInterval(parseISO(t.completed_at), { start, end }) }
    catch { return false }
  }).length
}

type Params = { params: Promise<{ id: string }> }

export default async function PersonPage({ params }: Params) {
  const { id } = await params
  const { role, person_id } = await getAppSession()

  // Viewers can't access individual profiles
  if (role === 'viewer') redirect('/')

  // Members can only view their own profile
  if (role === 'member' && person_id !== id) redirect(`/team/${person_id}`)

  const canEdit = role === 'admin' || role === 'super_admin'

  let member, tasks: TaskView[] = []

  try {
    const [m, rawTasks, members] = await Promise.all([
      getMemberById(id),
      getAllTasks(),
      getAllMembers(),
    ])
    member = m
    tasks = enrichTasks(rawTasks, members).filter((t) => t.person_id === id)
  } catch {}

  if (!member) notFound()

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const activeTasks = tasks.filter((t) => t.status !== 'Completed')
  const completedTasks = tasks.filter((t) => t.status === 'Completed')
  const weekCount = countInInterval(tasks, weekStart, weekEnd)
  const monthCount = countInInterval(tasks, monthStart, monthEnd)

  const recentCompleted = completedTasks
    .filter((t) => t.completed_at)
    .sort((a, b) => b.completed_at.localeCompare(a.completed_at))
    .slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/team" className="text-sm text-gray-400 hover:text-gray-600">← Team</Link>
      </div>
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{member.name}</h1>
        <p className="text-sm text-gray-400">{member.role}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Active</p>
          <p className="text-2xl font-semibold text-gray-900">{activeTasks.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Urgent</p>
          <p className="text-2xl font-semibold text-gray-900">{activeTasks.filter((t) => t.priority === 'Urgent').length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Completed This Week</p>
          <p className="text-2xl font-semibold text-gray-900">{weekCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Completed This Month</p>
          <p className="text-2xl font-semibold text-gray-900">{monthCount}</p>
        </div>
      </div>

      {/* Active tasks */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Current Tasks</h2>
        {activeTasks.length === 0 ? (
          <p className="text-sm text-gray-400">No active tasks.</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {activeTasks.map((t) => (
              <div key={t.task_id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.task_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.content_type} · {t.format} · {t.effort}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {t.priority === 'Urgent' && <PriorityBadge priority={t.priority} />}
                  <StatusBadge status={t.status} />
                  {t.deadline_performance && <DeadlineBadge performance={t.deadline_performance} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent completed */}
      {recentCompleted.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recent Completed</h2>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {recentCompleted.map((t) => (
              <div key={t.task_id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-900">{t.task_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.format}
                    {t.completed_at && ` · ${format(parseISO(t.completed_at), 'MMM d')}`}
                    {t.turnaround_time && ` · ${t.turnaround_time}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <DeadlineBadge performance={t.deadline_performance} />
                  {t.delay_duration && <span className="text-xs text-red-500">{t.delay_duration} late</span>}
                  <span className="text-xs text-gray-400">{t.published ? 'Published' : 'Unpublished'}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {canEdit && (
        <Link
          href={`/tasks/new`}
          className="inline-block text-sm text-blue-600 hover:underline"
        >
          + Add task for {member.name}
        </Link>
      )}
    </div>
  )
}
