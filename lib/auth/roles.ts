import { AppRole } from '@/types'
import { getAdminEmails } from '@/lib/sheets/config'

export async function resolveRole(email: string | null | undefined): Promise<AppRole> {
  if (!email) return 'viewer'

  const superAdmin = process.env.SUPER_ADMIN_EMAIL?.toLowerCase()
  if (superAdmin && email.toLowerCase() === superAdmin) return 'super_admin'

  try {
    const admins = await getAdminEmails()
    if (admins.includes(email.toLowerCase())) return 'admin'
  } catch {
    // Config sheet not set up yet — fine, just not an admin
  }

  return 'viewer'
}

export function canEdit(role: AppRole): boolean {
  return role === 'admin' || role === 'super_admin'
}

export function isSuperAdmin(role: AppRole): boolean {
  return role === 'super_admin'
}
