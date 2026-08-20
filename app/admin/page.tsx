import { auth } from '@/auth'
import { AppRole } from '@/types'
import { redirect } from 'next/navigation'
import AdminEmailManager from '@/components/admin/AdminEmailManager'
import LogsViewer from '@/components/admin/LogsViewer'
import ChannelsManager from '@/components/admin/ChannelsManager'

export default async function AdminPage() {
  const session = await auth()
  const role = (session?.user as { app_role?: AppRole })?.app_role ?? 'viewer'
  if (role !== 'super_admin' && role !== 'admin') redirect('/')

  return (
    <div className="space-y-10">
      {role === 'super_admin' && (
        <div className="max-w-lg space-y-8">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Admin Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage who has admin access to the tool.</p>
          </div>
          <AdminEmailManager />
        </div>
      )}

      <div className="max-w-lg">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Channels</h2>
        <ChannelsManager />
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Audit Log</h2>
        <LogsViewer />
      </div>
    </div>
  )
}
