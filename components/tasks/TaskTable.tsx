'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { TaskView, AppRole, TaskStatus, TASK_STATUSES } from '@/types'
import { StatusBadge, PriorityBadge, EffortBadge, DeadlineBadge } from '@/components/ui/Badge'
import { format, parseISO } from 'date-fns'
import RequestChangeModal from './RequestChangeModal'
import { ChangeRequest } from '@/lib/sheets/change-requests'

function fmtDatetime(iso: string) {
  if (!iso) return ''
  try { return format(parseISO(iso), 'MMM d, h:mm a') } catch { return iso }
}

function fmtDeadline(iso: string) {
  if (!iso) return '—'
  try { return format(parseISO(iso), 'MMM d') } catch { return iso }
}

// Convert ISO → datetime-local input value and back
function isoToInput(iso: string) {
  if (!iso) return ''
  try { return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm") } catch { return '' }
}

// ── Inline date cell ────────────────────────────────────────────────────────
function DateCell({
  value,
  onSave,
  canEdit,
}: {
  value: string
  onSave: (iso: string) => void
  canEdit: boolean
}) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  if (!canEdit) return <span className="text-xs text-gray-500">{fmtDatetime(value) || '—'}</span>

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="datetime-local"
        defaultValue={isoToInput(value)}
        autoFocus
        className="border border-blue-400 rounded px-1.5 py-0.5 text-xs w-40 focus:outline-none"
        onBlur={(e) => {
          setEditing(false)
          const v = e.target.value
          onSave(v ? new Date(v).toISOString() : '')
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setEditing(false)
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-xs text-gray-500 hover:text-blue-600 hover:underline text-left min-w-[80px]"
      title="Click to edit"
    >
      {fmtDatetime(value) || <span className="text-gray-300">— set date</span>}
    </button>
  )
}

// ── Inline status cell ──────────────────────────────────────────────────────
function StatusCell({
  value,
  onSave,
  canEdit,
}: {
  value: TaskStatus
  onSave: (s: TaskStatus) => void
  canEdit: boolean
}) {
  const [editing, setEditing] = useState(false)

  if (!canEdit) return <StatusBadge status={value} />

  if (editing) {
    return (
      <select
        autoFocus
        defaultValue={value}
        className="border border-blue-400 rounded px-1.5 py-0.5 text-xs focus:outline-none bg-white"
        onChange={(e) => {
          onSave(e.target.value as TaskStatus)
          setEditing(false)
        }}
        onBlur={() => setEditing(false)}
      >
        {TASK_STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    )
  }

  return (
    <button onClick={() => setEditing(true)} title="Click to change status">
      <StatusBadge status={value} />
    </button>
  )
}

// ── Row ─────────────────────────────────────────────────────────────────────
interface RowProps {
  task: TaskView
  role: AppRole
  onPatch: (taskId: string, patch: Record<string, unknown>) => Promise<void>
  onComplete: (task: TaskView) => Promise<void>
  onDelete: (taskId: string) => void
  onRequestChange: () => void
  hasPendingRequest: boolean
  readonly?: boolean
}

function TaskRow({ task, role, onPatch, onComplete, onDelete, onRequestChange, hasPendingRequest, readonly = false }: RowProps) {
  const canEdit = (role === 'admin' || role === 'super_admin') && !readonly
  const isMember = role === 'member' && !readonly
  const isCompleted = task.status === 'Completed'
  const isDeleted = task.status === 'Deleted'

  return (
    <tr className={`group border-b border-gray-100 hover:bg-gray-50 text-sm ${isCompleted ? 'opacity-70' : ''} ${isDeleted ? 'opacity-50 line-through-[task]' : ''}`}>
      {/* Task name */}
      <td className="px-2 py-2 min-w-40 max-w-56">
        <div className="flex items-start gap-1">
          <span className="font-medium text-gray-900 text-xs leading-tight line-clamp-2">
            {task.task_name}
          </span>
          {(task.video_quantity ?? 1) > 1 && (
            <span className="shrink-0 text-xs bg-gray-100 text-gray-500 px-1 py-0.5 rounded-full font-medium">
              ×{task.video_quantity}
            </span>
          )}
          {hasPendingRequest && (
            <span className="shrink-0 text-xs bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded-full font-medium" title="Change request pending">
              !
            </span>
          )}
        </div>
        {task.notes && (
          <p className="text-xs text-gray-400 truncate mt-0.5" title={task.notes}>{task.notes}</p>
        )}
      </td>

      {/* Person — hidden for members (they only see their own) */}
      {!isMember && (
        <td className="px-2 py-2 whitespace-nowrap">
          <span className="text-xs text-gray-600">{task.person_name}</span>
        </td>
      )}

      {/* Type / Format */}
      <td className="px-2 py-2">
        <div className="text-xs text-gray-500 whitespace-nowrap">{task.content_type}</div>
        <div className="text-xs text-gray-400 whitespace-nowrap">{task.format}</div>
      </td>

      {/* Effort / Status merged */}
      <td className="px-2 py-2">
        <div className="flex flex-col gap-1">
          <EffortBadge effort={task.effort} />
          <StatusCell
            value={task.status}
            canEdit={canEdit}
            onSave={(s) => onPatch(task.task_id, { status: s })}
          />
        </div>
      </td>

      {/* Deadline */}
      <td className="px-2 py-2 whitespace-nowrap">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-gray-500">{fmtDeadline(task.deadline)}</span>
          {task.deadline_performance && <DeadlineBadge performance={task.deadline_performance} />}
        </div>
      </td>

      {/* Started At */}
      <td className="px-2 py-2">
        <DateCell
          value={task.started_at}
          canEdit={canEdit}
          onSave={(v) => onPatch(task.task_id, { started_at: v })}
        />
      </td>

      {/* Completed At */}
      <td className="px-2 py-2">
        <DateCell
          value={task.completed_at}
          canEdit={canEdit}
          onSave={(v) => onPatch(task.task_id, { completed_at: v })}
        />
      </td>

      {/* Turnaround */}
      <td className="px-2 py-2 whitespace-nowrap">
        <span className="text-xs text-gray-400">{task.turnaround_time ?? '—'}</span>
        {task.delay_duration && (
          <span className="text-xs text-red-500 block">{task.delay_duration} late</span>
        )}
      </td>

      {/* Published — inline toggle */}
      <td className="px-2 py-2">
        {canEdit ? (
          <input
            type="checkbox"
            checked={task.published}
            onChange={(e) => onPatch(task.task_id, { published: e.target.checked })}
            className="w-3.5 h-3.5 rounded border-gray-300 cursor-pointer"
          />
        ) : (
          <span className="text-xs text-gray-400">{task.published ? 'Yes' : 'No'}</span>
        )}
      </td>

      {/* Actions */}
      {canEdit && (
        <td className="px-2 py-2 whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            {!isCompleted && (
              <button
                onClick={() => onComplete(task)}
                className="text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded hover:bg-green-100 transition-colors"
                title="Mark as completed"
              >
                ✓
              </button>
            )}
            <Link
              href={`/tasks/${task.task_id}/edit`}
              className="text-xs text-blue-600 hover:underline"
            >
              Edit
            </Link>
            <button
              onClick={() => onDelete(task.task_id)}
              className="text-xs text-red-400 hover:text-red-600"
            >
              Del
            </button>
          </div>
        </td>
      )}
      {isMember && (
        <td className="px-2 py-2 whitespace-nowrap">
          <div>
            <button
              onClick={onRequestChange}
              className="text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded hover:bg-yellow-100 transition-colors"
            >
              Request Change
            </button>
          </div>
        </td>
      )}
    </tr>
  )
}

// ── Table ────────────────────────────────────────────────────────────────────
interface Props {
  tasks: TaskView[]
  role: AppRole
  onUpdate: (updated: TaskView) => void
  onRemove: (taskId: string) => void
  emptyMessage?: string
  pendingRequests?: ChangeRequest[]
  readonly?: boolean
}

export default function TaskTable({ tasks, role, onUpdate, onRemove, emptyMessage, pendingRequests = [], readonly = false }: Props) {
  const canEdit = role === 'admin' || role === 'super_admin'
  const isMember = role === 'member'
  const [changeRequestTask, setChangeRequestTask] = useState<TaskView | null>(null)

  const handlePatch = async (taskId: string, patch: Record<string, unknown>) => {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      const json = await res.json()
      onUpdate(json.data)
    }
  }

  const handleComplete = async (task: TaskView) => {
    const now = new Date().toISOString()
    await handlePatch(task.task_id, {
      status: 'Completed',
      completed_at: task.completed_at || now,
    })
  }

  const handleDelete = async (taskId: string) => {
    if (!confirm('Delete this task?')) return
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    onRemove(taskId)
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-gray-400">
        {emptyMessage ?? 'No tasks here.'}
      </div>
    )
  }

  return (
    <>
      {changeRequestTask && (
        <RequestChangeModal
          task={changeRequestTask}
          onClose={() => setChangeRequestTask(null)}
          onSubmitted={() => {
            setChangeRequestTask(null)
          }}
        />
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Task</th>
              {!isMember && <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Person</th>}
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Effort / Status</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Deadline</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Started</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
              <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Pub</th>
              {(canEdit || isMember) && !readonly && <th className="px-2 py-2"></th>}
            </tr>
          </thead>
          <tbody className="bg-white">
            {tasks.map((t) => {
              const hasPendingRequest = pendingRequests.some((r) => r.task_id === t.task_id)
              return (
                <TaskRow
                  key={t.task_id}
                  task={t}
                  role={role}
                  onPatch={handlePatch}
                  onComplete={handleComplete}
                  onDelete={handleDelete}
                  onRequestChange={() => setChangeRequestTask(t)}
                  hasPendingRequest={hasPendingRequest}
                  readonly={readonly}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
