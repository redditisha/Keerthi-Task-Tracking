import { getAllMembers } from '@/lib/sheets/team'
import { getAllTasks } from '@/lib/sheets/tasks'
import { auth } from '@/auth'
import { AppRole, TeamMember, Task } from '@/types'
import Link from 'next/link'
import { startOfWeek, isWithinInterval, endOfWeek, parseISO } from 'date-fns'
import AddMemberForm from '@/components/team/AddMemberForm'

function completedThisWeek(tasks: Task[], personId: string): number {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
  return tasks.filter((t) => {
    if (t.person_id !== personId || t.status !== 'Completed' || !t.completed_at) return false
    try {
      return isWithinInterval(parseISO(t.completed_at), { start: weekStart, end: weekEnd })
    } catch { return false }
  }).length
}

export default async function TeamPage() {
  const session = await auth()
  const role = (session?.user as { app_role?: AppRole })?.app_role ?? 'viewer'
  const canEdit = role === 'admin' || role === 'super_admin'

  let members: TeamMember[] = []
  let tasks: Task[] = []

  try {
    ;[members, tasks] = await Promise.all([getAllMembers(), getAllTasks()])
  } catch {}

  const activeMembers = members.filter((m) => m.active)
  const inactiveMembers = members.filter((m) => !m.active)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Team</h1>
      </div>

      {/* Team table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Person</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Tasks</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed This Week</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activeMembers.map((m) => {
              const activeTasks = tasks.filter((t) => t.person_id === m.person_id && t.status !== 'Completed').length
              const weekCompleted = completedThisWeek(tasks, m.person_id)
              return (
                <tr key={m.person_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/team/${m.person_id}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {m.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{m.role}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{activeTasks}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{weekCompleted}</td>
                  <td className="px-4 py-3 text-right">
                    {canEdit && (
                      <Link href={`/team/${m.person_id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {activeMembers.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-10">No team members yet.</p>
        )}
      </div>

      {/* Inactive members */}
      {inactiveMembers.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 mb-2">Inactive</h2>
          <div className="space-y-1">
            {inactiveMembers.map((m) => (
              <div key={m.person_id} className="text-sm text-gray-400 px-2">{m.name} — {m.role}</div>
            ))}
          </div>
        </div>
      )}

      {/* Add member */}
      {canEdit && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Add Team Member</h2>
          <AddMemberForm />
        </div>
      )}
    </div>
  )
}
