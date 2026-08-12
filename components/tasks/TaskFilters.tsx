'use client'

import { ContentType, Effort, Priority, TaskStatus, TeamMember, CONTENT_TYPES, EFFORT_LEVELS, PRIORITIES, TASK_STATUSES } from '@/types'

export interface Filters {
  search: string
  person_id: string
  status: string
  content_type: string
  effort: string
  priority: string
  published: string
}

export const DEFAULT_FILTERS: Filters = {
  search: '',
  person_id: '',
  status: '',
  content_type: '',
  effort: '',
  priority: '',
  published: '',
}

interface Props {
  filters: Filters
  members: TeamMember[]
  onChange: (f: Filters) => void
  onReset: () => void
}

export default function TaskFilters({ filters, members, onChange, onReset }: Props) {
  const set = (key: keyof Filters, value: string) =>
    onChange({ ...filters, [key]: value })

  const active = Object.values(filters).some((v) => v !== '')

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filters</span>
        {active && (
          <button onClick={onReset} className="text-xs text-blue-600 hover:underline">
            Clear all
          </button>
        )}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search tasks..."
        value={filters.search}
        onChange={(e) => set('search', e.target.value)}
        className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {/* Person */}
        <select
          value={filters.person_id}
          onChange={(e) => set('person_id', e.target.value)}
          className="border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All people</option>
          {members.filter((m) => m.active).map((m) => (
            <option key={m.person_id} value={m.person_id}>{m.name}</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) => set('status', e.target.value)}
          className="border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none"
        >
          <option value="">All statuses</option>
          {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Content type */}
        <select
          value={filters.content_type}
          onChange={(e) => set('content_type', e.target.value)}
          className="border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none"
        >
          <option value="">All types</option>
          {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Effort */}
        <select
          value={filters.effort}
          onChange={(e) => set('effort', e.target.value)}
          className="border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none"
        >
          <option value="">All effort</option>
          {EFFORT_LEVELS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>

        {/* Priority */}
        <select
          value={filters.priority}
          onChange={(e) => set('priority', e.target.value)}
          className="border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none"
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        {/* Published */}
        <select
          value={filters.published}
          onChange={(e) => set('published', e.target.value)}
          className="border border-gray-200 rounded px-2 py-1.5 text-sm bg-white focus:outline-none"
        >
          <option value="">Published?</option>
          <option value="yes">Published</option>
          <option value="no">Not published</option>
        </select>
      </div>
    </div>
  )
}
