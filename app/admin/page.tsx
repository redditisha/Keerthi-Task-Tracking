import { auth } from '@/auth'
import { AppRole } from '@/types'
import { redirect } from 'next/navigation'
import AdminEmailManager from '@/components/admin/AdminEmailManager'

export default async function AdminPage() {
  const session = await auth()
  const role = (session?.user as { app_role?: AppRole })?.app_role ?? 'viewer'
  if (role !== 'super_admin') redirect('/')

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Admin Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage who has admin access to the tool.</p>
      </div>
      <AdminEmailManager />
    </div>
  )
}
