import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { canEdit } from '@/lib/auth/roles'
import { getAllTasks, createTask } from '@/lib/sheets/tasks'
import { getAllMembers } from '@/lib/sheets/team'
import { enrichTasks } from '@/lib/utils/calculations'
import { AppRole, CreateTaskInput } from '@/types'

export async function GET() {
  try {
    const [tasks, members] = await Promise.all([getAllTasks(), getAllMembers()])
    const enriched = enrichTasks(tasks, members)
    return NextResponse.json({ data: enriched })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as { app_role?: AppRole })?.app_role ?? 'viewer'
  if (!canEdit(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const input: CreateTaskInput = await req.json()
    const task = await createTask(input)
    return NextResponse.json({ data: task }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
