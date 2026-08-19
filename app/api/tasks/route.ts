import { NextRequest, NextResponse } from 'next/server'
import { getAppSession } from '@/lib/auth/session'
import { canEdit } from '@/lib/auth/roles'
import { getAllTasks, createTask } from '@/lib/sheets/tasks'
import { getAllMembers } from '@/lib/sheets/team'
import { enrichTasks } from '@/lib/utils/calculations'
import { createLog } from '@/lib/sheets/logs'
import { CreateTaskInput, TaskView } from '@/types'

export async function GET() {
  try {
    const { role, person_id } = await getAppSession()
    const [rawTasks, members] = await Promise.all([getAllTasks(), getAllMembers()])
    let tasks: TaskView[] = enrichTasks(rawTasks, members)

    // Members only see their own tasks
    if (role === 'member' && person_id) {
      tasks = tasks.filter((t) => t.person_id === person_id)
    }

    return NextResponse.json({ data: tasks })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { role, email } = await getAppSession()
  if (!canEdit(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const input: CreateTaskInput = await req.json()
    const task = await createTask(input)

    createLog({
      actor_email: email ?? 'unknown',
      actor_role: role,
      action: 'created',
      entity_type: 'task',
      entity_id: task.task_id,
      entity_name: task.task_name,
      changes: { status: task.status, person_id: task.person_id },
    }).catch(console.error)

    return NextResponse.json({ data: task }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
