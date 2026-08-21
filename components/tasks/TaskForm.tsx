'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import {
  CreateTaskInput, ContentType, TaskFormat, TaskStatus, TeamMember,
  CONTENT_TYPES, FORMATS_BY_TYPE, EFFORT_LEVELS, PRIORITIES, TASK_STATUSES,
} from '@/types'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'

// Convert ISO UTC string → datetime-local input value (local time)
function isoToInput(iso: string) {
  if (!iso) return ''
  try { return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm") } catch { return '' }
}

// Convert datetime-local input value → ISO UTC string
function inputToIso(v: string) {
  if (!v) return ''
  return new Date(v).toISOString()
}

interface Props {
  members: TeamMember[]
  initialValues?: Partial<CreateTaskInput>
  taskId?: string   // if set, we're editing
  onSuccess?: () => void
}

const DEFAULT: CreateTaskInput = {
  task_name: '',
  person_id: '',
  content_type: 'Video',
  format: 'Short-form',
  effort: 'Medium',
  priority: 'Normal',
  request_source: 'Internal',
  deadline: '',
  started_at: '',
  completed_at: '',
  status: 'Not Started',
  published: false,
  notes: '',
  video_quantity: 1,
}

export default function TaskForm({ members, initialValues, taskId, onSuccess }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<CreateTaskInput>({ ...DEFAULT, ...initialValues })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [channels, setChannels] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/channels')
      .then((r) => r.json())
      .then((json) => {
        const names: string[] = (json.data ?? []).map((c: { name: string }) => c.name)
        setChannels(names)
        // Pre-select first channel if no initial value set
        if (!initialValues?.request_source && names.length > 0) {
          setForm((prev) => ({ ...prev, request_source: names[0] }))
        }
      })
  }, [])

  const set = (key: keyof CreateTaskInput, value: string | boolean | number) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      // Reset format when content type changes
      if (key === 'content_type') {
        const formats = FORMATS_BY_TYPE[value as ContentType]
        next.format = formats[0]
      }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.person_id) {
      setError('Please assign the task to at least one person.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(taskId ? `/api/tasks/${taskId}` : '/api/tasks', {
        method: taskId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Save failed')
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/tasks')
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const formats = FORMATS_BY_TYPE[form.content_type]
  const activeMembers = members.filter((m) => m.active)

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Task name */}
      <Input
        label="Task Name *"
        required
        value={form.task_name}
        onChange={(e) => set('task_name', e.target.value)}
        placeholder="e.g. BSNL Independence Day Reel"
      />

      {/* Person(s) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Assign To <span className="text-gray-400 font-normal text-xs">(select one or more)</span>
        </label>
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
          {activeMembers.map((m) => {
            const selected = form.person_id.split(',').map((id) => id.trim()).includes(m.person_id)
            return (
              <label key={m.person_id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => {
                    const current = form.person_id.split(',').map((id) => id.trim()).filter(Boolean)
                    const next = e.target.checked
                      ? [...current, m.person_id]
                      : current.filter((id) => id !== m.person_id)
                    set('person_id', next.join(','))
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">{m.name}</span>
                <span className="text-xs text-gray-400 ml-auto">{m.role}</span>
              </label>
            )
          })}
          {activeMembers.length === 0 && (
            <p className="px-3 py-3 text-sm text-gray-400">No active team members.</p>
          )}
        </div>
        {!form.person_id && (
          <p className="text-xs text-red-500 mt-1">Please select at least one person.</p>
        )}
      </div>

      {/* Content type + format */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Content Type *"
          value={form.content_type}
          onChange={(e) => set('content_type', e.target.value as ContentType)}
          options={CONTENT_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <Select
          label="Format *"
          value={form.format}
          onChange={(e) => set('format', e.target.value as TaskFormat)}
          options={formats.map((f) => ({ value: f, label: f }))}
        />
      </div>

      {/* Effort + Priority + Quantity */}
      <div className="grid grid-cols-3 gap-4">
        <Select
          label="Effort *"
          value={form.effort}
          onChange={(e) => set('effort', e.target.value as 'Low' | 'Medium' | 'High')}
          options={EFFORT_LEVELS.map((e) => ({ value: e, label: e }))}
        />
        <Select
          label="Priority *"
          value={form.priority}
          onChange={(e) => set('priority', e.target.value as 'Urgent' | 'Normal')}
          options={PRIORITIES.map((p) => ({ value: p, label: p }))}
        />
        <Input
          label="Quantity"
          type="number"
          min={1}
          value={String(form.video_quantity ?? 1)}
          onChange={(e) => set('video_quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
        />
      </div>

      {/* Request source + Status */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Channel / Request Source *"
          value={form.request_source}
          onChange={(e) => set('request_source', e.target.value)}
          options={
            channels.length > 0
              ? channels.map((s) => ({ value: s, label: s }))
              : [{ value: form.request_source || 'Other', label: form.request_source || 'Other' }]
          }
        />
        <Select
          label="Status *"
          value={form.status}
          onChange={(e) => set('status', e.target.value as TaskStatus)}
          options={TASK_STATUSES.map((s) => ({ value: s, label: s }))}
        />
      </div>

      {/* Deadline */}
      <Input
        label="Deadline"
        type="datetime-local"
        value={isoToInput(form.deadline ?? '')}
        onChange={(e) => set('deadline', inputToIso(e.target.value))}
      />

      {/* Timeline */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Started At"
          type="datetime-local"
          value={isoToInput(form.started_at ?? '')}
          onChange={(e) => set('started_at', inputToIso(e.target.value))}
        />
        <Input
          label="Completed At"
          type="datetime-local"
          value={isoToInput(form.completed_at ?? '')}
          onChange={(e) => set('completed_at', inputToIso(e.target.value))}
        />
      </div>

      {/* Published */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.published}
          onChange={(e) => set('published', e.target.checked)}
          className="w-4 h-4 rounded border-gray-300"
        />
        <span className="text-sm text-gray-700">Published</span>
      </label>

      {/* Notes */}
      <Textarea
        label="Notes"
        rows={3}
        value={form.notes}
        onChange={(e) => set('notes', e.target.value)}
        placeholder="Context, Details, and References..."
      />

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : taskId ? 'Save Changes' : 'Create Task'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
