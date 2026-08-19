import { auth } from '@/auth'
import { AppRole, UserRole } from '@/types'

export interface AppSession {
  role: AppRole
  person_id?: string
  person_role?: UserRole
  email?: string
}

export async function getAppSession(): Promise<AppSession> {
  const session = await auth()
  const u = session?.user as {
    app_role?: AppRole
    person_id?: string
    person_role?: UserRole
    email?: string
  } | undefined
  return {
    role: u?.app_role ?? 'viewer',
    person_id: u?.person_id,
    person_role: u?.person_role,
    email: u?.email,
  }
}
