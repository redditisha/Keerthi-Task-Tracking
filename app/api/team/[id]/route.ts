import { NextRequest, NextResponse } from 'next/server'
import { getAppSession } from '@/lib/auth/session'
import { canEdit } from '@/lib/auth/roles'
import { getMemberById, updateMember, deleteMember } from '@/lib/sheets/team'
import { createLog } from '@/lib/sheets/logs'
import { CreateTeamMemberInput } from '@/types'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const member = await getMemberById(id)
    if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: member })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch member' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { role, email } = await getAppSession()
  if (!canEdit(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const patch: Partial<CreateTeamMemberInput> = await req.json()
    const oldMember = await getMemberById(id)

    const member = await updateMember(id, patch)
    if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Compute field-level diff
    const changes: Record<string, [unknown, unknown]> = {}
    if (oldMember) {
      for (const key of Object.keys(patch)) {
        const oldVal = (oldMember as Record<string, unknown>)[key]
        const newVal = (patch as Record<string, unknown>)[key]
        if (String(oldVal) !== String(newVal)) {
          changes[key] = [oldVal, newVal]
        }
      }
    }

    createLog({
      actor_email: email ?? 'unknown',
      actor_role: role,
      action: 'member_updated',
      entity_type: 'team_member',
      entity_id: id,
      entity_name: member.name,
      changes,
    }).catch(console.error)

    return NextResponse.json({ data: member })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const { role, email } = await getAppSession()
  if (!canEdit(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const member = await getMemberById(id)
    const deleted = await deleteMember(id)
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    createLog({
      actor_email: email ?? 'unknown',
      actor_role: role,
      action: 'member_deleted',
      entity_type: 'team_member',
      entity_id: id,
      entity_name: member?.name ?? id,
    }).catch(console.error)

    return NextResponse.json({ data: { deleted: true } })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 })
  }
}
