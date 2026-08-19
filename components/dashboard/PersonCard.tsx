'use client'

import { useState } from 'react'
import { TaskView, TeamMember } from '@/types'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { format, parseISO } from 'date-fns'

function fmtDeadline(iso: string) {
  if (!iso) return null
  try { return format(parseISO(iso), 'MMM d') } catch { return null }
}

interface Props {
  member: TeamMember
  tasks: TaskView[]
  defaultOpen?: boolean
}

export default function PersonCard({ member, tasks, defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  const urgent = tasks.filter((t) => t.priority === 'Urgent').length
  const overdue = tasks.filter((t) => t.deadline_performance === 'Overdue').length

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header — always visible, click to toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {/* Avatar initial */}
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold flex items-center justify-center shrink-0">
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm text-gray-900">{member.name}</p>
            <p className="text-xs text-gray-400">{member.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {urgent > 0 && (
            <span className="text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              {urgent} urgent
            </span>
          )}
          {overdue > 0 && (
            <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              {overdue} overdue
            </span>
          )}
          <span className="text-xs text-gray-400">
            {tasks.length} active
          </span>
          <span className="text-gray-300 text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Task list */}
      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {tasks.length === 0 ? (
            <p className="px-4 py-3 text-xs text-gray-400">No active tasks.</p>
          ) : (
            tasks.map((t) => {
              const deadline = fmtDeadline(t.deadline)
              return (
                <div key={t.task_id} className="px-4 py-2.5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{t.task_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.content_type} · {t.format}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                    {t.priority === 'Urgent' && <PriorityBadge priority="Urgent" />}
                    <StatusBadge status={t.status} />
                    {deadline && (
                      <span className={`text-xs ${t.deadline_performance === 'Overdue' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        {t.deadline_performance === 'Overdue' ? 'Overdue · ' : 'Due '}{deadline}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
