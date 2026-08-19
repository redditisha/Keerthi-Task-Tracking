import { NextResponse } from 'next/server'
import { getAppSession } from '@/lib/auth/session'
import { getAllLogs } from '@/lib/sheets/logs'

export async function GET() {
  const { role } = await getAppSession()
  if (role !== 'super_admin' && role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const logs = await getAllLogs()
    return NextResponse.json({ data: logs })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}
