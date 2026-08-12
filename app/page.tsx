import { getAllTasks } from '@/lib/sheets/tasks'
import { getAllMembers } from '@/lib/sheets/team'
import { enrichTasks } from '@/lib/utils/calculations'
import { TaskView, TeamMember, AppRole } from '@/types'
import { auth } from '@/auth'
import { StatusBadge, PriorityBadge, DeadlineBadge } from '@/components/ui/Badge'
import Link from 'next/link'
import { format, parseISO, isAfter, addDays } from 'date-fns'

function fmtDate(iso: string) {
  if (!iso) return '—'
  try { return format(parseISO(iso), 'MMM d') } catch { return iso }
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}

export default async function DashboardPage() {
  const session = await auth()
  const role = (session?.user as { app_role?: AppRole })?.app_role ?? 'viewer'
  const canEdit = role === 'admin' || role === 'super_admin'

  let tasks: TaskView[] = []
  let members: TeamMember[] = []

  try {
    const [rawTasks, rawMembers] = await Promise.all([getAllTasks(), getAllMembers()])
    members = rawMembers
    tasks = enrichTasks(rawTasks, rawMembers)
  } catch {
    // Sheets not configured yet
  }

  const active = tasks.filter((t) => t.status !== 'Completed')
  const urgent = active.filter((t) => t.priority === 'Urgent')
  const blocked = active.filter((t) => t.status === 'On Hold / Blocked')
  const inProgress = active.filter((t) => t.status === 'In Progress' || t.status === 'Started')

  const now = new Date()
  const upcoming = tasks
    .filter((t) => t.status !== 'Completed' && t.deadline)
    .filter((t) => {
      try {
        const d = parseISO(t.deadline)
        return isAfter(d, now) && !isAfter(d, addDays(now, 7))
      } catch { return false }
    })
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 8)

  const byPerson: Record<string, { member: TeamMember; tasks: TaskView[] }> = {}
  for (const m of members.filter((m) => m.active)) {
    const personTasks = active.filter((t) => t.person_id === m.person_id)
    if (personTasks.length > 0) byPerson[m.person_id] = { member: m, tasks: personTasks }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Content operations overview</p>
        </div>
        {canEdit && (
          <Link href="/tasks/new" className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-blue-700 transition-colors">
            + Add Task
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Tasks" value={active.length} />
        <StatCard label="Urgent" value={urgent.length} />
        <StatCard label="In Progress" value={inProgress.length} />
        <StatCard label="Blocked" value={blocked.length} />
      </div>

      {urgent.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3">Urgent — Needs Attention</h2>
          <div className="space-y-2">
            {urgent.map((t) => (
              <div key={t.task_id} className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm text-gray-900">{t.task_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{t.person_name} · {t.content_type} · {t.format}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={t.status} />
                  {t.deadline_performance && <DeadlineBadge performance={t.deadline_performance} />}
                  {t.deadline && <span className="text-xs text-gray-400">Due {fmtDate(t.deadline)}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {Object.keys(byPerson).length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Current Work by Person</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(byPerson).map(({ member, tasks: personTasks }) => (
              <div key={member.person_id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Link href={`/team/${member.person_id}`} className="font-medium text-sm text-gray-900 hover:text-blue-600">
                      {member.name}
                    </Link>
                    <p className="text-xs text-gray-400">{member.role}</p>
                  </div>
                  <span className="text-xs text-gray-400">{personTasks.length} task{personTasks.length !== 1 ? 's' : ''}</span>
                </div>
                <ul className="space-y-1.5">
                  {personTasks.slice(0, 4).map((t) => (
                    <li key={t.task_id} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-700 truncate">{t.task_name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {t.priority === 'Urgent' && <PriorityBadge priority={t.priority} />}
                        <StatusBadge status={t.status} />
                      </div>
                    </li>
                  ))}
                  {personTasks.length > 4 && (
                    <li className="text-xs text-gray-400">+{personTasks.length - 4} more</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Coming Next — Next 7 Days</h2>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {upcoming.map((t) => (
              <div key={t.task_id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-900">{t.task_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.person_name} · {t.format}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={t.status} />
                  <span className="text-xs text-gray-500">Due {fmtDate(t.deadline)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-sm">No tasks yet.</p>
          {canEdit && (
            <Link href="/tasks/new" className="text-sm text-blue-600 hover:underline mt-2 inline-block">Add the first task</Link>
          )}
        </div>
      )}
    </div>
  )
}
