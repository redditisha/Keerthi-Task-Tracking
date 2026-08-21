'use client'

import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { TaskView, TeamMember, AppRole } from '@/types'
import TaskTable from '@/components/tasks/TaskTable'
import TaskFilters, { Filters, DEFAULT_FILTERS } from '@/components/tasks/TaskFilters'
import ChangeRequestsPanel from '@/components/admin/ChangeRequestsPanel'
import { ChangeRequest } from '@/lib/sheets/change-requests'
import Link from 'next/link'

type Tab = 'active' | 'in_review' | 'completed' | 'deleted' | 'change_requests'

function applyFilters(tasks: TaskView[], filters: Filters): TaskView[] {
  return tasks.filter((t) => {
    if (filters.search && !t.task_name.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.person_id && !t.person_id.split(',').map(id => id.trim()).includes(filters.person_id)) return false
    if (filters.status && t.status !== filters.status) return false
    if (filters.content_type && t.content_type !== filters.content_type) return false
    if (filters.effort && t.effort !== filters.effort) return false
    if (filters.priority && t.priority !== filters.priority) return false
    if (filters.published === 'yes' && !t.published) return false
    if (filters.published === 'no' && t.published) return false
    return true
  })
}

interface Props {
  role: AppRole
}

export default function TasksPageClient({ role }: Props) {
  const canEdit = role === 'admin' || role === 'super_admin'
  const searchParams = useSearchParams()

  const [tasks, setTasks] = useState<TaskView[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])
  const [pendingRequests, setPendingRequests] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>(() => ({
    ...DEFAULT_FILTERS,
    search: searchParams.get('search') ?? '',
    person_id: searchParams.get('person_id') ?? '',
  }))
  const [tab, setTab] = useState<Tab>('active')

  useEffect(() => {
    Promise.all([
      fetch('/api/tasks').then((r) => r.json()),
      fetch('/api/team').then((r) => r.json()),
      fetch('/api/change-requests').then((r) => r.json()),
    ]).then(([tasksRes, teamRes, crRes]) => {
      setTasks(tasksRes.data ?? [])
      setMembers(teamRes.data ?? [])
      setPendingRequests((crRes.data ?? []).filter((r: ChangeRequest) => r.status === 'pending'))
      setLoading(false)
    })
  }, [])

  const activeTasks = useMemo(
    () => applyFilters(tasks.filter((t) => t.status !== 'Completed' && t.status !== 'Deleted' && t.status !== 'In Review'), filters),
    [tasks, filters]
  )
  const inReviewTasks = useMemo(
    () => applyFilters(tasks.filter((t) => t.status === 'In Review'), filters),
    [tasks, filters]
  )
  const completedTasks = useMemo(
    () => applyFilters(tasks.filter((t) => t.status === 'Completed'), filters),
    [tasks, filters]
  )
  const deletedTasks = useMemo(
    () => tasks.filter((t) => t.status === 'Deleted'),
    [tasks]
  )
  const displayed =
    tab === 'active' ? activeTasks :
    tab === 'in_review' ? inReviewTasks :
    tab === 'completed' ? completedTasks :
    deletedTasks

  const pendingChangeRequests = pendingRequests.length

  const handleUpdate = (updated: TaskView) => {
    setTasks((prev) => prev.map((t) => (t.task_id === updated.task_id ? updated : t)))
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">
          Tasks {role === 'member' ? '— My Tasks' : ''}
        </h1>
        {canEdit && (
          <Link
            href="/tasks/new"
            className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            + Add Task
          </Link>
        )}
      </div>

      {tab !== 'deleted' && tab !== 'in_review' && tab !== 'change_requests' && (
        <TaskFilters
          filters={filters}
          members={members}
          onChange={setFilters}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />
      )}

      <div className="flex items-center border-b border-gray-200 gap-1">
        <button className={tabClass('active')} onClick={() => setTab('active')}>
          Active
          {!loading && (
            <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
              {activeTasks.length}
            </span>
          )}
        </button>
        <button className={tabClass('in_review')} onClick={() => setTab('in_review')}>
          In Review
          {!loading && inReviewTasks.length > 0 && (
            <span className="ml-1.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
              {inReviewTasks.length}
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
        {canEdit && (
          <button className={tabClass('deleted')} onClick={() => setTab('deleted')}>
            Deleted
            {!loading && deletedTasks.length > 0 && (
              <span className="ml-1.5 text-xs bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">
                {deletedTasks.length}
              </span>
            )}
          </button>
        )}
        {canEdit && (
          <button className={tabClass('change_requests')} onClick={() => setTab('change_requests')}>
            Change Requests
            {pendingChangeRequests > 0 && (
              <span className="ml-1.5 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                {pendingChangeRequests}
              </span>
            )}
          </button>
        )}
      </div>

      {tab === 'change_requests' ? (
        <ChangeRequestsPanel />
      ) : loading ? (
        <div className="text-sm text-gray-400 py-10 text-center">Loading tasks…</div>
      ) : (
        <TaskTable
          tasks={displayed}
          role={role}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
          pendingRequests={pendingRequests}
          emptyMessage={
            tab === 'active' ? 'No active tasks.' :
            tab === 'in_review' ? 'No tasks pending review.' :
            tab === 'completed' ? 'No completed tasks yet.' :
            'No deleted tasks.'
          }
          readonly={tab === 'deleted'}
        />
      )}
    </div>
  )
}
