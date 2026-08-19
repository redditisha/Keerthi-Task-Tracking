import { getAllTasks } from '@/lib/sheets/tasks'
import { getAllMembers } from '@/lib/sheets/team'
import { getAllChangeRequests } from '@/lib/sheets/change-requests'
import { enrichTasks } from '@/lib/utils/calculations'
import { getAppSession } from '@/lib/auth/session'
import { TaskView, TeamMember } from '@/types'
import { ChangeRequest } from '@/lib/sheets/change-requests'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const { role, person_id, person_role } = await getAppSession()

  let tasks: TaskView[] = []
  let members: TeamMember[] = []
  let pendingRequests: ChangeRequest[] = []

  try {
    const [rawTasks, rawMembers, allRequests] = await Promise.all([
      getAllTasks(),
      getAllMembers(),
      getAllChangeRequests(),
    ])
    members = rawMembers
    tasks = enrichTasks(rawTasks, rawMembers)
    pendingRequests = allRequests.filter((r) => r.status === 'pending')
  } catch {
    // Sheets not configured yet
  }

  return (
    <DashboardClient
      tasks={tasks}
      members={members}
      role={role}
      viewerRole={person_role}
      pendingRequests={pendingRequests}
    />
  )
}
