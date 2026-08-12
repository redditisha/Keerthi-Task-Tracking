'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CreateTaskInput, ContentType, TaskFormat, TaskStatus, TeamMember,
  CONTENT_TYPES, FORMATS_BY_TYPE, EFFORT_LEVELS, PRIORITIES,
  REQUEST_SOURCES, TASK_STATUSES,
} from '@/types'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'

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
}

export default function TaskForm({ members, initialValues, taskId, onSuccess }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<CreateTaskInput>({ ...DEFAULT, ...initialValues })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (key: keyof CreateTaskInput, value: string | boolean) => {
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

      {/* Person */}
      <Select
        label="Person *"
        required
        value={form.person_id}
        onChange={(e) => set('person_id', e.target.value)}
        options={[
          { value: '', label: '— Select person —' },
          ...activeMembers.map((m) => ({ value: m.person_id, label: `${m.name} (${m.role})` })),
        ]}
      />

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

      {/* Effort + Priority */}
      <div className="grid grid-cols-2 gap-4">
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
      </div>

      {/* Request source + Status */}
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Request Source *"
          value={form.request_source}
          onChange={(e) => set('request_source', e.target.value as typeof form.request_source)}
          options={REQUEST_SOURCES.map((s) => ({ value: s, label: s }))}
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
        value={form.deadline ? form.deadline.slice(0, 16) : ''}
        onChange={(e) => set('deadline', e.target.value ? new Date(e.target.value).toISOString() : '')}
      />

      {/* Timeline */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Started At"
          type="datetime-local"
          value={form.started_at ? form.started_at.slice(0, 16) : ''}
          onChange={(e) => set('started_at', e.target.value ? new Date(e.target.value).toISOString() : '')}
        />
        <Input
          label="Completed At"
          type="datetime-local"
          value={form.completed_at ? form.completed_at.slice(0, 16) : ''}
          onChange={(e) => set('completed_at', e.target.value ? new Date(e.target.value).toISOString() : '')}
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
        placeholder="What went well or poorly, dependencies, context..."
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
