import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isSuperAdmin } from '@/lib/auth/roles'
import { getAdminEmails, setAdminEmails } from '@/lib/sheets/config'
import { AppRole } from '@/types'

export async function GET() {
  const session = await auth()
  const role = (session?.user as { app_role?: AppRole })?.app_role ?? 'viewer'
  if (!isSuperAdmin(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const emails = await getAdminEmails()
  return NextResponse.json({ data: { admin_emails: emails } })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as { app_role?: AppRole })?.app_role ?? 'viewer'
  if (!isSuperAdmin(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { admin_emails }: { admin_emails: string[] } = await req.json()
  await setAdminEmails(admin_emails)
  return NextResponse.json({ data: { admin_emails } })
}
