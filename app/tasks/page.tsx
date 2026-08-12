'use client'

import { useEffect, useState, useMemo } from 'react'
import { TaskView, TeamMember, AppRole } from '@/types'
import { useSession, signIn } from 'next-auth/react'
import TaskTable from '@/components/tasks/TaskTable'
import TaskFilters, { Filters, DEFAULT_FILTERS } from '@/components/tasks/TaskFilters'
import Link from 'next/link'

type Tab = 'active' | 'completed'

function applyFilters(tasks: TaskView[], filters: Filters): TaskView[] {
  return tasks.filter((t) => {
    if (filters.search && !t.task_name.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.person_id && t.person_id !== filters.person_id) return false
    if (filters.status && t.status !== filters.status) return false
    if (filters.content_type && t.content_type !== filters.content_type) return false
    if (filters.effort && t.effort !== filters.effort) return false
    if (filters.priority && t.priority !== filters.priority) return false
    if (filters.published === 'yes' && !t.published) return false
    if (filters.published === 'no' && t.published) return false
    return true
  })
}

export default function TasksPage() {
  const { data: session } = useSession()
  const role = ((session?.user as { app_role?: AppRole })?.app_role ?? 'viewer') as AppRole
  const canEdit = role === 'admin' || role === 'super_admin'

  const { status: sessionStatus } = useSession()
  const [tasks, setTasks] = useState<TaskView[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [tab, setTab] = useState<Tab>('active')

  useEffect(() => {
    Promise.all([
      fetch('/api/tasks').then((r) => r.json()),
      fetch('/api/team').then((r) => r.json()),
    ]).then(([tasksRes, teamRes]) => {
      setTasks(tasksRes.data ?? [])
      setMembers(teamRes.data ?? [])
      setLoading(false)
    })
  }, [])

  const activeTasks = useMemo(() => applyFilters(tasks.filter((t) => t.status !== 'Completed'), filters), [tasks, filters])
  const completedTasks = useMemo(() => applyFilters(tasks.filter((t) => t.status === 'Completed'), filters), [tasks, filters])
  const displayed = tab === 'active' ? activeTasks : completedTasks

  // When a task is updated (inline edit or complete), re-enrich and replace in state
  const handleUpdate = (updated: TaskView) => {
    setTasks((prev) => prev.map((t) => (t.task_id === updated.task_id ? updated : t)))
    // If the task just became completed, switch to the right tab
    if (updated.status === 'Completed' && tab === 'active') {
      // keep on active tab — they'll see it disappear, which confirms it moved
    }
  }

  const handleRemove = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.task_id !== taskId))
  }

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      tab === t
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700'
    }`

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Tasks</h1>
        {canEdit && (
          <Link
            href="/tasks/new"
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            + Add Task
          </Link>
        )}
      </div>

      {/* Auth banner — shown when not logged in or viewer */}
      {sessionStatus !== 'loading' && !canEdit && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
          <span className="text-amber-800">
            {sessionStatus === 'unauthenticated'
              ? 'You are viewing in read-only mode.'
              : 'You are logged in but do not have edit access.'}
          </span>
          {sessionStatus === 'unauthenticated' && (
            <button
              onClick={() => signIn('google')}
              className="text-sm font-medium text-amber-900 underline hover:no-underline"
            >
              Sign in to edit
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <TaskFilters
        filters={filters}
        members={members}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      {/* Tabs */}
      <div className="flex items-center border-b border-gray-200 gap-1">
        <button className={tabClass('active')} onClick={() => setTab('active')}>
          Active
          {!loading && (
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
              {activeTasks.length}
            </span>
          )}
        </button>
        <button className={tabClass('completed')} onClick={() => setTab('completed')}>
          Completed
          {!loading && (
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
              {completedTasks.length}
            </span>
          )}
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-gray-400 py-10 text-center">Loading tasks…</div>
      ) : (
        <TaskTable
          tasks={displayed}
          role={role}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
          emptyMessage={
            tab === 'active'
              ? 'No active tasks. Everything is done!'
              : 'No completed tasks yet.'
          }
        />
      )}
    </div>
  )
}
