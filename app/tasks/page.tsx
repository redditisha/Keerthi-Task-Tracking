import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getAppSession } from '@/lib/auth/session'
import TasksPageClient from '@/components/tasks/TasksPageClient'

export default async function TasksPage() {
  const { role } = await getAppSession()
  if (role === 'viewer') redirect('/')
  return (
    <Suspense fallback={<div className="text-sm text-gray-400 py-10 text-center">Loading…</div>}>
      <TasksPageClient role={role} />
    </Suspense>
  )
}
