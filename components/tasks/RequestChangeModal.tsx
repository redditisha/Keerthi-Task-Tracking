'use client'

import { useState } from 'react'
import { TaskView } from '@/types'

const CHANGEABLE_FIELDS = [
  { key: 'deadline', label: 'Deadline', type: 'datetime' },
  { key: 'started_at', label: 'Started Date', type: 'datetime' },
  { key: 'completed_at', label: 'Completed Date', type: 'datetime' },
  { key: 'notes', label: 'Notes / Description', type: 'text' },
  { key: 'delete', label: 'Delete Task (Scrap)', type: 'delete' },
]

function isoToInput(iso: string) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch { return '' }
}

interface Props {
  task: TaskView
  onClose: () => void
  onSubmitted: () => void
}

export default function RequestChangeModal({ task, onClose, onSubmitted }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [values, setValues] = useState<Record<string, string>>({
    deadline: isoToInput(task.deadline),
    started_at: isoToInput(task.started_at),
    completed_at: isoToInput(task.completed_at),
    notes: task.notes ?? '',
  })
  const [generalNotes, setGeneralNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selected.size === 0) { setError('Select at least one change to request.'); return }

    setSaving(true)
    setError('')
    try {
      const changes = Array.from(selected).map((field) => ({
        field,
        new_value: field === 'delete' ? '' : (field === 'deadline' || field === 'started_at' || field === 'completed_at')
          ? (values[field] ? new Date(values[field]).toISOString() : '')
          : values[field] ?? '',
      }))

      const res = await fetch('/api/change-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: task.task_id,
          task_name: task.task_name,
          changes,
          notes: generalNotes,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to submit')
      onSubmitted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const isDelete = selected.has('delete')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Request Change</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-sm">{task.task_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none mt-0.5">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}

          {/* Field selection */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">What needs to change?</p>

            {CHANGEABLE_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selected.has(f.key)}
                    onChange={() => toggle(f.key)}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  />
                  <span className={`text-sm font-medium ${f.type === 'delete' ? 'text-red-600' : 'text-gray-700'}`}>
                    {f.label}
                  </span>
                </label>

                {/* Value input for selected fields */}
                {selected.has(f.key) && f.type !== 'delete' && (
                  <div className="mt-2 ml-7">
                    {f.type === 'datetime' ? (
                      <input
                        type="datetime-local"
                        value={values[f.key] ?? ''}
                        onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                        className="border border-gray-200 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    ) : (
                      <textarea
                        value={values[f.key] ?? ''}
                        onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                        rows={3}
                        placeholder="New description..."
                        className="border border-gray-200 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
                      />
                    )}
                  </div>
                )}

                {selected.has(f.key) && f.type === 'delete' && (
                  <div className="mt-2 ml-7 bg-red-50 border border-red-200 rounded px-3 py-2">
                    <p className="text-xs text-red-700 font-medium">This will permanently delete the task if accepted by an admin.</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* General notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Notes / Reason
            </label>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              rows={3}
              placeholder="Explain why this change is needed..."
              className="border border-gray-200 rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className={`text-sm font-medium px-4 py-2 rounded transition-colors disabled:opacity-50 ${
                isDelete
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {saving ? 'Submitting…' : 'Submit Request'}
            </button>
            <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
