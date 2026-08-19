import { NextRequest, NextResponse } from 'next/server'
import { getAppSession } from '@/lib/auth/session'
import { canEdit } from '@/lib/auth/roles'
import { getAllMembers, createMember } from '@/lib/sheets/team'
import { createLog } from '@/lib/sheets/logs'
import { CreateTeamMemberInput } from '@/types'

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
  const { role, email } = await getAppSession()
  if (!canEdit(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const input: CreateTeamMemberInput = await req.json()
    const member = await createMember(input)

    createLog({
      actor_email: email ?? 'unknown',
      actor_role: role,
      action: 'member_created',
      entity_type: 'team_member',
      entity_id: member.person_id,
      entity_name: member.name,
      changes: { role: member.role, email: member.email },
    }).catch(console.error)

    return NextResponse.json({ data: member }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
  }
}
