import { Task, TaskView, DeadlinePerformance, TeamMember, UserRole } from '@/types'

function minutesToHuman(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function diffMinutes(from: string, to: string): number | null {
  if (!from || !to) return null
  const ms = new Date(to).getTime() - new Date(from).getTime()
  if (isNaN(ms) || ms < 0) return null
  return ms / 60000
}

export function calcTurnaround(task: Task): string | null {
  const mins = diffMinutes(task.added_at, task.completed_at)
  return mins !== null ? minutesToHuman(mins) : null
}

export function calcWorkingDuration(task: Task): string | null {
  const mins = diffMinutes(task.started_at, task.completed_at)
  return mins !== null ? minutesToHuman(mins) : null
}

export function calcDeadlinePerformance(task: Task): DeadlinePerformance | null {
  if (!task.deadline) return null
  const deadline = new Date(task.deadline)
  const now = new Date()

  if (task.status === 'Completed' && task.completed_at) {
    const completed = new Date(task.completed_at)
    return completed <= deadline ? 'On time' : 'Late'
  }

  // Not yet completed
  if (now > deadline) return 'Overdue'
  return 'Not yet due'
}

export function calcDelayDuration(task: Task): string | null {
  if (!task.deadline || !task.completed_at) return null
  const deadline = new Date(task.deadline)
  const completed = new Date(task.completed_at)
  if (completed <= deadline) return null
  const mins = (completed.getTime() - deadline.getTime()) / 60000
  return minutesToHuman(mins)
}

export function enrichTask(task: Task, members: TeamMember[]): TaskView {
  const member = members.find((m) => m.person_id === task.person_id)
  return {
    ...task,
    person_name: member?.name ?? 'Unknown',
    person_role: (member?.role ?? 'Other') as UserRole,
    turnaround_time: calcTurnaround(task),
    working_duration: calcWorkingDuration(task),
    deadline_performance: calcDeadlinePerformance(task),
    delay_duration: calcDelayDuration(task),
  }
}

export function enrichTasks(tasks: Task[], members: TeamMember[]): TaskView[] {
  return tasks.map((t) => enrichTask(t, members))
}
