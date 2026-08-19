import { getAllMembers } from '@/lib/sheets/team'
import { getAllTasks } from '@/lib/sheets/tasks'
import { getAppSession } from '@/lib/auth/session'
import { isAdmin } from '@/lib/auth/roles'
import { TeamMember, Task } from '@/types'
import { redirect } from 'next/navigation'
import { startOfWeek, isWithinInterval, endOfWeek, parseISO } from 'date-fns'
import TeamPageClient from '@/components/team/TeamPageClient'

function buildCounts(tasks: Task[], members: TeamMember[]) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })

  return members.map((m) => {
    const active = tasks.filter(
      (t) => t.person_id === m.person_id && t.status !== 'Completed'
    ).length

    const weekCompleted = tasks.filter((t) => {
      if (t.person_id !== m.person_id || t.status !== 'Completed' || !t.completed_at) return false
      try { return isWithinInterval(parseISO(t.completed_at), { start: weekStart, end: weekEnd }) }
      catch { return false }
    }).length

    return { person_id: m.person_id, active, weekCompleted }
  })
}

export default async function TeamPage() {
  const { role, person_id } = await getAppSession()

  if (role === 'viewer') redirect('/')
  if (role === 'member' && person_id) redirect(`/team/${person_id}`)

  let members: TeamMember[] = []
  let tasks: Task[] = []

  try {
    ;[members, tasks] = await Promise.all([getAllMembers(), getAllTasks()])
  } catch {}

  const counts = buildCounts(tasks, members)

  return (
    <TeamPageClient
      initialMembers={members}
      counts={counts}
      canEdit={isAdmin(role)}
    />
  )
}
