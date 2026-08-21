'use client'

import { useState, useMemo } from 'react'
import { TaskView, TeamMember, UserRole, AppRole, USER_ROLES } from '@/types'
import { ChangeRequest } from '@/lib/sheets/change-requests'
import { Goal } from '@/lib/sheets/goals'
import PersonCard from './PersonCard'
import GoalsSection from './GoalsSection'

interface Props {
  tasks: TaskView[]
  members: TeamMember[]
  role: AppRole
  person_id?: string
  viewerRole?: UserRole
  pendingRequests?: ChangeRequest[]
  goals?: Goal[]
}

type DashTab = 'team' | 'mine'

export default function DashboardClient({
  tasks, members, role, person_id, viewerRole, pendingRequests = [], goals = [],
}: Props) {
  const isAdmin = role === 'admin' || role === 'super_admin'
  const isMember = role === 'member'
  const isAdminMember = isAdmin && !!person_id   // admin who is also a team member

  const [dashTab, setDashTab] = useState<DashTab>('team')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'All'>('All')
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [inReviewOnly, setInReviewOnly] = useState(false)

  const activeTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'Completed' && t.status !== 'Deleted' && t.status !== 'In Review'),
    [tasks]
  )
  const inReviewTasks = useMemo(
    () => tasks.filter((t) => t.status === 'In Review'),
    [tasks]
  )

  // ── "My Dashboard" data ───────────────────────────────────────────────────
  const myMember = useMemo(
    () => members.find((m) => m.person_id === person_id) ?? null,
    [members, person_id]
  )
  const myTasks = useMemo(
    () => activeTasks.filter((t) => t.person_id.split(',').map(id => id.trim()).includes(person_id ?? '')),
    [activeTasks, person_id]
  )
  const myUrgent = myTasks.filter((t) => t.priority === 'Urgent').length
  const myOverdue = myTasks.filter((t) => t.deadline_performance === 'Overdue').length

  // ── Team dashboard data ───────────────────────────────────────────────────
  const visibleMembers = useMemo(() => {
    let list = members.filter((m) => m.active)
    if (isMember && viewerRole) list = list.filter((m) => m.role === viewerRole)
    if (isAdmin && roleFilter !== 'All') list = list.filter((m) => m.role === roleFilter)
    return list
  }, [members, isMember, viewerRole, isAdmin, roleFilter])

  const personTaskMap = useMemo(() => {
    const map: Record<string, TaskView[]> = {}
    for (const m of visibleMembers) {
      let personTasks = inReviewOnly
        ? inReviewTasks.filter((t) => t.person_id.split(',').map(id => id.trim()).includes(m.person_id))
        : activeTasks.filter((t) => t.person_id.split(',').map(id => id.trim()).includes(m.person_id))
      if (urgentOnly) personTasks = personTasks.filter((t) => t.priority === 'Urgent')
      if (overdueOnly) personTasks = personTasks.filter((t) => t.deadline_performance === 'Overdue')
      map[m.person_id] = personTasks
    }
    return map
  }, [visibleMembers, activeTasks, inReviewTasks, urgentOnly, overdueOnly, inReviewOnly])

  const totalActive = Object.values(personTaskMap).flat().length
  const totalUrgent = activeTasks.filter((t) => t.priority === 'Urgent').length
  const totalOverdue = activeTasks.filter((t) => t.deadline_performance === 'Overdue').length
  const totalInReview = inReviewTasks.length

  const anyFilterActive = urgentOnly || overdueOnly || inReviewOnly
  const peopleToShow = anyFilterActive
    ? visibleMembers.filter((m) => (personTaskMap[m.person_id]?.length ?? 0) > 0)
    : visibleMembers

  const defaultOpen = !(isAdmin && roleFilter === 'All')
  const forceOpen = urgentOnly || overdueOnly || inReviewOnly

  function handleRoleFilter(r: UserRole | 'All') {
    setRoleFilter(r)
    setUrgentOnly(false)
    setOverdueOnly(false)
    setInReviewOnly(false)
  }

  // ── Tab bar (only shown for admin-members) ────────────────────────────────
  const tabClass = (t: DashTab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      dashTab === t
        ? 'border-gray-900 text-gray-900'
        : 'border-transparent text-gray-400 hover:text-gray-600'
    }`

  return (
    <div className="space-y-5">

      {/* Top-level tab switcher — only for admins who are also members */}
      {isAdminMember && (
        <div className="flex items-center border-b border-gray-200 gap-1 mb-4">
          <button className={tabClass('team')} onClick={() => setDashTab('team')}>
            Team Dashboard
          </button>
          <button className={tabClass('mine')} onClick={() => setDashTab('mine')}>
            My Dashboard
            {myTasks.length > 0 && (
              <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {myTasks.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── MY DASHBOARD ─────────────────────────────────────────────────── */}
      {dashTab === 'mine' && isAdminMember && (
        <>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">My Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {myTasks.length} active · {myUrgent} urgent · {myOverdue} overdue
            </p>
          </div>

          {myMember ? (
            <PersonCard
              key="mine"
              member={myMember}
              tasks={myTasks}
              defaultOpen={true}
              forceOpen={false}
            />
          ) : (
            <p className="text-sm text-gray-400 py-10 text-center">
              Your account is not linked to a team member profile yet.
            </p>
          )}
        </>
      )}

      {/* ── TEAM DASHBOARD ───────────────────────────────────────────────── */}
      {dashTab === 'team' && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isMember && viewerRole ? `${viewerRole} Team` : 'Dashboard'}
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {totalActive} active · {totalUrgent} urgent · {totalOverdue} overdue
              </p>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Role filter pills */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => handleRoleFilter('All')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      roleFilter === 'All' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    All
                  </button>
                  {USER_ROLES.map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleFilter(r)}
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
                  onClick={() => { setUrgentOnly((v) => !v); setOverdueOnly(false); setInReviewOnly(false) }}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                    urgentOnly
                      ? 'bg-red-600 text-white border-red-600'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                  }`}
                >
                  Urgent{totalUrgent > 0 && ` · ${totalUrgent}`}
                </button>

                {/* Overdue toggle */}
                <button
                  onClick={() => { setOverdueOnly((v) => !v); setUrgentOnly(false); setInReviewOnly(false) }}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                    overdueOnly
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                  }`}
                >
                  Overdue{totalOverdue > 0 && ` · ${totalOverdue}`}
                </button>

                {/* In Review toggle */}
                <button
                  onClick={() => { setInReviewOnly((v) => !v); setUrgentOnly(false); setOverdueOnly(false) }}
                  className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                    inReviewOnly
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                  }`}
                >
                  In Review{totalInReview > 0 && ` · ${totalInReview}`}
                </button>
              </div>
            )}
          </div>

          {/* Pending disputes */}
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
                          {r.notes && <p className="text-xs text-gray-500 mt-1 italic">"{r.notes}"</p>}
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
              {urgentOnly ? 'No urgent tasks right now.' : overdueOnly ? 'No overdue tasks right now.' : inReviewOnly ? 'No tasks in review right now.' : 'No active tasks.'}
            </div>
          ) : (
            <div className="space-y-3">
              {peopleToShow.map((m) => (
                <PersonCard
                  key={`${m.person_id}-${roleFilter}`}
                  member={m}
                  tasks={personTaskMap[m.person_id] ?? []}
                  defaultOpen={defaultOpen}
                  forceOpen={forceOpen}
                />
              ))}
            </div>
          )}

          {/* Goals */}
          {isAdmin && <GoalsSection initialGoals={goals} />}
        </>
      )}
    </div>
  )
}
