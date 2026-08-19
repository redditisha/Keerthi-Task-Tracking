'use client'

import { useState } from 'react'
import { TeamMember, USER_ROLES, UserRole } from '@/types'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

interface Props {
  onAdded?: (member: TeamMember) => void
}

export default function AddMemberForm({ onAdded }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('Editor')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, active: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      setName('')
      setEmail('')
      onAdded?.(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 flex-wrap">
      {error && <p className="text-xs text-red-600 w-full">{error}</p>}
      <div className="flex-1 min-w-40">
        <Input
          label="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
        />
      </div>
      <div className="flex-1 min-w-48">
        <Input
          label="Google Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@gmail.com"
        />
      </div>
      <Select
        label="Role"
        value={role}
        onChange={(e) => setRole(e.target.value as UserRole)}
        options={USER_ROLES.map((r) => ({ value: r, label: r }))}
      />
      <button
        type="submit"
        disabled={saving}
        className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors mb-0.5"
      >
        {saving ? 'Adding…' : 'Add'}
      </button>
    </form>
  )
}
