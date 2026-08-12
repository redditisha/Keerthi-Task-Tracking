'use client'

import Link from 'next/link'
import { TaskView, AppRole } from '@/types'
import { StatusBadge, PriorityBadge, EffortBadge, DeadlineBadge } from '@/components/ui/Badge'
import { format, parseISO } from 'date-fns'

function fmtDate(iso: string) {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), 'MMM d, h:mm a')
  } catch {
    return iso
  }
}

interface Props {
  task: TaskView
  role: AppRole
  onDelete?: (id: string) => void
}

export default function TaskRow({ task, role, onDelete }: Props) {
  const canEdit = role === 'admin' || role === 'super_admin'

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Left: main info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <PriorityBadge priority={task.priority} />
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">{task.content_type} · {task.format}</span>
            <EffortBadge effort={task.effort} />
          </div>
          <h3 className="font-medium text-gray-900 text-sm truncate">{task.task_name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {task.person_name} · {task.request_source}
          </p>
        </div>

        {/* Right: status + deadline */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusBadge status={task.status} />
          {task.deadline_performance && <DeadlineBadge performance={task.deadline_performance} />}
        </div>
      </div>

      {/* Timeline row */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 flex-wrap">
        {task.deadline && (
          <span>Deadline: <span className="text-gray-600">{fmtDate(task.deadline)}</span></span>
        )}
        {task.turnaround_time && (
          <span>Turnaround: <span className="text-gray-600">{task.turnaround_time}</span></span>
        )}
        {task.delay_duration && (
          <span className="text-red-500">Delay: {task.delay_duration}</span>
        )}
        <span>Published: <span className="text-gray-600">{task.published ? 'Yes' : 'No'}</span></span>
      </div>

      {/* Actions */}
      {canEdit && (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
          <Link
            href={`/tasks/${task.task_id}/edit`}
            className="text-xs text-blue-600 hover:underline"
          >
            Edit
          </Link>
          <button
            onClick={() => onDelete?.(task.task_id)}
            className="text-xs text-red-500 hover:underline"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
