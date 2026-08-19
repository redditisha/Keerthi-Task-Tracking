import { NextRequest, NextResponse } from 'next/server'
import { getAppSession } from '@/lib/auth/session'
import { canEdit } from '@/lib/auth/roles'
import { resolveChangeRequest, getAllChangeRequests, ChangeField } from '@/lib/sheets/change-requests'
import { updateTask, deleteTask, getTaskById } from '@/lib/sheets/tasks'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { role, email } = await getAppSession()
  if (!canEdit(role)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const { action, admin_notes } = await req.json()
    if (action !== 'accepted' && action !== 'rejected') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // If accepted, apply the changes to the task
    if (action === 'accepted') {
      const all = await getAllChangeRequests()
      const cr = all.find((r) => r.request_id === id)
      if (cr) {
        const changes: ChangeField[] = JSON.parse(cr.changes ?? '[]')
        const isDelete = changes.some((c) => c.field === 'delete')

        if (isDelete) {
          await deleteTask(cr.task_id)
        } else {
          const fieldChanges = changes.reduce<Record<string, string>>((acc, c) => {
            acc[c.field] = c.new_value
            return acc
          }, {})

          const task = await getTaskById(cr.task_id)
          if (task) {
            await updateTask({ task_id: cr.task_id, ...fieldChanges })
          }
        }
      }
    }

    const resolved = await resolveChangeRequest(id, action, email ?? 'unknown', admin_notes ?? '')
    if (!resolved) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({ data: resolved })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to resolve change request' }, { status: 500 })
  }
}
