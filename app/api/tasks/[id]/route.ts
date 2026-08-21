import { NextRequest, NextResponse } from 'next/server'
import { getAppSession } from '@/lib/auth/session'
import { canEdit } from '@/lib/auth/roles'
import { getTaskById, updateTask, deleteTask } from '@/lib/sheets/tasks'
import { getAllMembers } from '@/lib/sheets/team'
import { enrichTask } from '@/lib/utils/calculations'
import { createLog } from '@/lib/sheets/logs'
import { UpdateTaskInput } from '@/types'

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
  const { role, email, person_id } = await getAppSession()

  const patch = await req.json()

  // Members may only set their own tasks to 'In Review'
  const isMemberSubmit =
    role === 'member' &&
    patch.status === 'In Review' &&
    Object.keys(patch).length === 1

  if (!canEdit(role) && !isMemberSubmit) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const oldTask = await getTaskById(id)

    // Extra guard: member can only submit their own task
    if (isMemberSubmit && !oldTask?.person_id.split(',').map(id => id.trim()).includes(person_id ?? '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // If status is moving away from Completed, clear completed_at
    if (patch.status && patch.status !== 'Completed' && oldTask?.status === 'Completed') {
      patch.completed_at = ''
    }

    const input: UpdateTaskInput = { ...patch, task_id: id }
    const task = await updateTask(input)
    if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Compute field-level diff
    const changes: Record<string, [unknown, unknown]> = {}
    if (oldTask) {
      for (const key of Object.keys(patch)) {
        const oldVal = (oldTask as unknown as Record<string, unknown>)[key]
        const newVal = patch[key]
        if (String(oldVal) !== String(newVal)) {
          changes[key] = [oldVal, newVal]
        }
      }
    }

    createLog({
      actor_email: email ?? 'unknown',
      actor_role: role,
      action: patch.status === 'Completed' && oldTask?.status !== 'Completed' ? 'completed' : 'updated',
      entity_type: 'task',
      entity_id: id,
      entity_name: task.task_name,
      changes,
    }).catch(console.error)

    const members = await getAllMembers()
    return NextResponse.json({ data: enrichTask(task, members) })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const { role, email } = await getAppSession()
  if (!canEdit(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const task = await getTaskById(id)
    const deleted = await deleteTask(id)
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    createLog({
      actor_email: email ?? 'unknown',
      actor_role: role,
      action: 'deleted',
      entity_type: 'task',
      entity_id: id,
      entity_name: task?.task_name ?? id,
    }).catch(console.error)

    return NextResponse.json({ data: { deleted: true } })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
