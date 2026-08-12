import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { canEdit } from '@/lib/auth/roles'
import { getTaskById, updateTask, deleteTask } from '@/lib/sheets/tasks'
import { getAllMembers } from '@/lib/sheets/team'
import { enrichTask } from '@/lib/utils/calculations'
import { AppRole, UpdateTaskInput } from '@/types'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const [task, members] = await Promise.all([getTaskById(id), getAllMembers()])
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: enrichTask(task, members) })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await auth()
  const role = (session?.user as { app_role?: AppRole })?.app_role ?? 'viewer'
  if (!canEdit(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const input: UpdateTaskInput = { ...(await req.json()), task_id: id }
    const task = await updateTask(input)
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const members = await getAllMembers()
    return NextResponse.json({ data: enrichTask(task, members) })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await auth()
  const role = (session?.user as { app_role?: AppRole })?.app_role ?? 'viewer'
  if (!canEdit(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const deleted = await deleteTask(id)
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ data: { deleted: true } })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
