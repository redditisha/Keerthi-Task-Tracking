'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { TeamMember, UserRole, USER_ROLES } from '@/types'

// ── Inline text cell ─────────────────────────────────────────────────────────
function TextCell({
  value,
  onSave,
  placeholder = '—',
  type = 'text',
}: {
  value: string
  onSave: (v: string) => void
  placeholder?: string
  type?: 'text' | 'email'
}) {
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        defaultValue={value}
        autoFocus
        className="border border-blue-400 rounded px-2 py-1 text-sm w-full focus:outline-none"
        onBlur={(e) => {
          setEditing(false)
          if (e.target.value.trim() !== value) onSave(e.target.value.trim())
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
      className="text-left w-full hover:text-blue-600 transition-colors"
      title="Click to edit"
    >
      {value || <span className="text-gray-300 italic">{placeholder}</span>}
    </button>
  )
}

// ── Inline role cell ──────────────────────────────────────────────────────────
function RoleCell({ value, onSave }: { value: UserRole; onSave: (v: UserRole) => void }) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <select
        autoFocus
        defaultValue={value}
        className="border border-blue-400 rounded px-2 py-1 text-sm bg-white focus:outline-none"
        onChange={(e) => {
          onSave(e.target.value as UserRole)
          setEditing(false)
        }}
        onBlur={() => setEditing(false)}
      >
        {USER_ROLES.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-left text-gray-600 hover:text-blue-600 transition-colors"
      title="Click to change role"
    >
      {value}
    </button>
  )
}

// ── Row ───────────────────────────────────────────────────────────────────────
interface RowProps {
  member: TeamMember
  activeTasks: number
  weekCompleted: number
  onPatch: (id: string, patch: Partial<TeamMember>) => Promise<void>
  saving: boolean
}

function MemberRow({ member, activeTasks, weekCompleted, onPatch, saving }: RowProps) {
  return (
    <tr className={`group border-b border-gray-100 hover:bg-gray-50 ${saving ? 'opacity-60' : ''}`}>
      {/* Name */}
      <td className="px-4 py-3 min-w-36">
        <TextCell
          value={member.name}
          onSave={(v) => onPatch(member.person_id, { name: v })}
          placeholder="Enter name"
        />
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <RoleCell
          value={member.role}
          onSave={(v) => onPatch(member.person_id, { role: v })}
        />
      </td>

      {/* Email */}
      <td className="px-4 py-3 min-w-48">
        <TextCell
          value={member.email}
          onSave={(v) => onPatch(member.person_id, { email: v })}
          placeholder="add email"
          type="email"
        />
      </td>

      {/* Active toggle */}
      <td className="px-4 py-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={member.active}
            onChange={(e) => onPatch(member.person_id, { active: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 cursor-pointer"
          />
          <span className="text-xs text-gray-500">{member.active ? 'Active' : 'Inactive'}</span>
        </label>
      </td>

      {/* Stats */}
      <td className="px-4 py-3 text-right text-sm text-gray-600">{activeTasks}</td>
      <td className="px-4 py-3 text-right text-sm text-gray-600">{weekCompleted}</td>

      {/* View link */}
      <td className="px-4 py-3 text-right">
        <Link
          href={`/team/${member.person_id}`}
          className="text-xs text-blue-600 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
        >
          View profile →
        </Link>
      </td>
    </tr>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────
interface TaskCount {
  person_id: string
  active: number
  weekCompleted: number
}

interface Props {
  members: TeamMember[]
  counts: TaskCount[]
  onUpdate: (updated: TeamMember) => void
}

export default function TeamTable({ members, counts, onUpdate }: Props) {
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const countFor = (person_id: string) =>
    counts.find((c) => c.person_id === person_id) ?? { active: 0, weekCompleted: 0, person_id }

  const handlePatch = async (id: string, patch: Partial<TeamMember>) => {
    setSavingId(id)
    setError('')
    try {
      const res = await fetch(`/api/team/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to save')
      onUpdate(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSavingId(null)
    }
  }

  const active = members.filter((m) => m.active)
  const inactive = members.filter((m) => !m.active)

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded">
          {error}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Tasks</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Done This Week</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {active.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                  No team members yet.
                </td>
              </tr>
            )}
            {active.map((m) => {
              const c = countFor(m.person_id)
              return (
                <MemberRow
                  key={m.person_id}
                  member={m}
                  activeTasks={c.active}
                  weekCompleted={c.weekCompleted}
                  onPatch={handlePatch}
                  saving={savingId === m.person_id}
                />
              )
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* Inactive members — also editable */}
      {inactive.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Inactive</h2>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <tbody>
                {inactive.map((m) => {
                  const c = countFor(m.person_id)
                  return (
                    <MemberRow
                      key={m.person_id}
                      member={m}
                      activeTasks={c.active}
                      weekCompleted={c.weekCompleted}
                      onPatch={handlePatch}
                      saving={savingId === m.person_id}
                    />
                  )
                })}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Click any name, role, or email to edit. Changes save automatically.
      </p>
    </div>
  )
}
