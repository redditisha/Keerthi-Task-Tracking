import { AppRole, UserRole } from '@/types'
import { getAdminEmails } from '@/lib/sheets/config'
import { getMemberByEmail } from '@/lib/sheets/team'

export interface RoleResult {
  role: AppRole
  person_id?: string
  person_role?: UserRole
}

async function lookupMember(email: string): Promise<Pick<RoleResult, 'person_id' | 'person_role'>> {
  try {
    const member = await getMemberByEmail(email)
    if (member && member.active) {
      return { person_id: member.person_id, person_role: member.role }
    }
  } catch {
    // Team sheet not set up yet
  }
  return {}
}

export async function resolveRole(email: string | null | undefined): Promise<RoleResult> {
  if (!email) return { role: 'viewer' }

  const superAdmin = process.env.SUPER_ADMIN_EMAIL?.toLowerCase()
  if (superAdmin && email.toLowerCase() === superAdmin) {
    const memberInfo = await lookupMember(email)
    return { role: 'super_admin', ...memberInfo }
  }

  try {
    const admins = await getAdminEmails()
    if (admins.includes(email.toLowerCase())) {
      const memberInfo = await lookupMember(email)
      return { role: 'admin', ...memberInfo }
    }
  } catch {
    // Config sheet not set up yet
  }

  try {
    const member = await getMemberByEmail(email)
    if (member && member.active) {
      return { role: 'member', person_id: member.person_id, person_role: member.role }
    }
  } catch {
    // Team sheet not set up yet
  }

  return { role: 'viewer' }
}

export function isAdmin(role: AppRole): boolean {
  return role === 'admin' || role === 'super_admin'
}

export function canEdit(role: AppRole): boolean {
  return role === 'admin' || role === 'super_admin'
}

export function isSuperAdmin(role: AppRole): boolean {
  return role === 'super_admin'
}
