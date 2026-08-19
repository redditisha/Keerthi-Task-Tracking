import { redirect } from 'next/navigation'
import { getAppSession } from '@/lib/auth/session'
import TasksPageClient from '@/components/tasks/TasksPageClient'

export default async function TasksPage() {
  const { role } = await getAppSession()
  if (role === 'viewer') redirect('/')
  return <TasksPageClient role={role} />
}
