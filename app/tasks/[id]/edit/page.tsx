import { getTaskById } from '@/lib/sheets/tasks'
import { getAllMembers } from '@/lib/sheets/team'
import { auth } from '@/auth'
import { AppRole } from '@/types'
import { redirect, notFound } from 'next/navigation'
import TaskForm from '@/components/tasks/TaskForm'

type Params = { params: Promise<{ id: string }> }

export default async function EditTaskPage({ params }: Params) {
  const { id } = await params
  const session = await auth()
  const role = (session?.user as { app_role?: AppRole })?.app_role ?? 'viewer'
  if (role !== 'admin' && role !== 'super_admin') redirect('/')

  let task, members
  try {
    ;[task, members] = await Promise.all([getTaskById(id), getAllMembers()])
  } catch {
    notFound()
  }

  if (!task) notFound()

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Edit Task</h1>
      <p className="text-xs text-gray-400 mb-4">{task.task_id}</p>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <TaskForm members={members ?? []} taskId={id} initialValues={task} />
      </div>
    </div>
  )
}
