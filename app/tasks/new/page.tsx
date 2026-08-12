import { getAllMembers } from '@/lib/sheets/team'
import { auth } from '@/auth'
import { AppRole } from '@/types'
import { redirect } from 'next/navigation'
import TaskForm from '@/components/tasks/TaskForm'

export default async function NewTaskPage() {
  const session = await auth()
  const role = (session?.user as { app_role?: AppRole })?.app_role ?? 'viewer'
  if (role !== 'admin' && role !== 'super_admin') redirect('/')

  let members: Awaited<ReturnType<typeof getAllMembers>> = []
  try {
    members = await getAllMembers()
  } catch {}

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">New Task</h1>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <TaskForm members={members} />
      </div>
    </div>
  )
}
