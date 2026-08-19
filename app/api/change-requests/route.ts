import { NextRequest, NextResponse } from 'next/server'
import { getAppSession } from '@/lib/auth/session'
import { getAllChangeRequests, createChangeRequest } from '@/lib/sheets/change-requests'

export async function GET() {
  const { role, person_id } = await getAppSession()
  if (role === 'viewer') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const all = await getAllChangeRequests()
    // Members only see their own requests
    const data = role === 'member'
      ? all.filter((r) => r.requested_by_id === person_id)
      : all
    return NextResponse.json({ data })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch change requests' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { role, person_id, email } = await getAppSession()
  if (role === 'viewer') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const body = await req.json()
    const request = await createChangeRequest({
      task_id: body.task_id,
      task_name: body.task_name,
      requested_by_id: person_id ?? '',
      requested_by_email: email ?? '',
      changes: body.changes,
      notes: body.notes ?? '',
    })
    return NextResponse.json({ data: request }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to submit change request' }, { status: 500 })
  }
}
