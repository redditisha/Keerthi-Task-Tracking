import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { canEdit } from '@/lib/auth/roles'
import { getAllMembers, createMember } from '@/lib/sheets/team'
import { AppRole, CreateTeamMemberInput } from '@/types'

export async function GET() {
  try {
    const members = await getAllMembers()
    return NextResponse.json({ data: members })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as { app_role?: AppRole })?.app_role ?? 'viewer'
  if (!canEdit(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const input: CreateTeamMemberInput = await req.json()
    const member = await createMember(input)
    return NextResponse.json({ data: member }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
  }
}
