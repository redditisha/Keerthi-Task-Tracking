'use client'

import { useState, useMemo } from 'react'
import { TaskView, TeamMember, UserRole, AppRole, USER_ROLES } from '@/types'
import { ChangeRequest } from '@/lib/sheets/change-requests'
import PersonCard from './PersonCard'

interface Props {
  tasks: TaskView[]
  members: TeamMember[]
  role: AppRole
  viewerRole?: UserRole
  pendingRequests?: ChangeRequest[]
}

export default function DashboardClient({ tasks, members, role, viewerRole, pendingRequests = [] }: Props) {
  const isAdmin = role === 'admin' || role === 'super_admin'
  const isMember = role === 'member'

  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All')
  const [urgentOnly, setUrgentOnly] = useState(false)

  // Active tasks only
  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'Completed'),
    [tasks]
  )

  // Which members to show
  const visibleMembers = useMemo(() => {
    let list = members.filter((m) => m.active)

    // Members see their own role's people only
    if (isMember && viewerRole) {
      list = list.filter((m) => m.role === viewerRole)
    }

    // Admin role filter
    if (isAdmin && roleFilter !== 'All') {
      list = list.filter((m) => m.role === roleFilter)
    }

    return list
  }, [members, isMember, viewerRole, isAdmin, roleFilter])

  // Tasks per visible member
  const personTaskMap = useMemo(() => {
    const map: Record<string, TaskView[]> = {}
    for (const m of visibleMembers) {
      let personTasks = activeTasks.filter((t) => t.person_id === m.person_id)
      if (urgentOnly) personTasks = personTasks.filter((t) => t.priority === 'Urgent')
      map[m.person_id] = personTasks
    }
    return map
  }, [visibleMembers, activeTasks, urgentOnly])

  const totalActive = Object.values(personTaskMap).flat().length
  const totalUrgent = Object.values(personTaskMap).flat().filter((t) => t.priority === 'Urgent').length

  // Only show people who have tasks (or all if no filter is active)
  const peopleToShow = urgentOnly
    ? visibleMembers.filter((m) => (personTaskMap[m.person_id]?.length ?? 0) > 0)
    : visibleMembers

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {isMember && viewerRole ? `${viewerRole} Team` : 'Dashboard'}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalActive} active · {totalUrgent} urgent
          </p>
        </div>

        {/* Filters — admin/super_admin only */}
        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Role filter buttons */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setRoleFilter('All')}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  roleFilter === 'All' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All
              </button>
              {USER_ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    roleFilter === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Urgent toggle */}
            <button
              onClick={() => setUrgentOnly((v) => !v)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                urgentOnly
                  ? 'bg-red-600 text-white border-red-600'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
              }`}
            >
              Urgent only
            </button>
          </div>
        )}
      </div>

      {/* Pending disputes — visible to all */}
      {pendingRequests.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
          <p className="text-sm font-semibold text-yellow-800">
            {pendingRequests.length} Pending Change Request{pendingRequests.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {pendingRequests.map((r) => {
              const fields: { field: string; new_value: string }[] = JSON.parse(r.changes ?? '[]')
              const fieldLabels: Record<string, string> = {
                deadline: 'Deadline', started_at: 'Started Date',
                completed_at: 'Completed Date', notes: 'Notes', delete: 'Delete Task',
              }
              return (
                <div key={r.request_id} className="bg-white border border-yellow-100 rounded-lg px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.task_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Requested by {members.find((m) => m.person_id === r.requested_by_id)?.name ?? 'a team member'} ·{' '}
                        {fields.map((f) => fieldLabels[f.field] ?? f.field).join(', ')}
                      </p>
                      {r.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">"{r.notes}"</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                      pending
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Person cards */}
      {peopleToShow.length === 0 ? (
        <div className="text-center py-16 text-sm text-gray-400">
          {urgentOnly ? 'No urgent tasks right now.' : 'No active tasks.'}
        </div>
      ) : (
        <div className="space-y-3">
          {peopleToShow.map((m) => (
            <PersonCard
              key={m.person_id}
              member={m}
              tasks={personTaskMap[m.person_id] ?? []}
              defaultOpen={peopleToShow.length <= 4}
            />
          ))}
        </div>
      )}
    </div>
  )
}
