import { NextRequest, NextResponse } from 'next/server'
import { getAppSession } from '@/lib/auth/session'
import { canEdit } from '@/lib/auth/roles'
import { getAllChannels, createChannel } from '@/lib/sheets/channels'

export async function GET() {
  try {
    const channels = await getAllChannels()
    return NextResponse.json({ data: channels })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { role } = await getAppSession()
  if (!canEdit(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const { name } = await req.json()
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    const channel = await createChannel(name.trim())
    return NextResponse.json({ data: channel }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 })
  }
}
