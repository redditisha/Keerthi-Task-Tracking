'use client'

import { useEffect, useState } from 'react'
import Input from '@/components/ui/Input'

export default function AdminEmailManager() {
  const [emails, setEmails] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/admin')
      .then((r) => r.json())
      .then((json) => {
        setEmails(json.data?.admin_emails ?? [])
        setLoading(false)
      })
  }, [])

  const save = async (updated: string[]) => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_emails: updated }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setEmails(updated)
      setMessage('Saved.')
    } catch {
      setMessage('Error saving.')
    } finally {
      setSaving(false)
    }
  }

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = newEmail.trim().toLowerCase()
    if (!email || emails.includes(email)) return
    setNewEmail('')
    await save([...emails, email])
  }

  const remove = async (email: string) => {
    await save(emails.filter((e) => e !== email))
  }

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {emails.length === 0 && (
          <p className="text-sm text-gray-400 px-4 py-3">No admins assigned yet.</p>
        )}
        {emails.map((email) => (
          <div key={email} className="px-4 py-3 flex items-center justify-between gap-4">
            <span className="text-sm text-gray-700">{email}</span>
            <button
              onClick={() => remove(email)}
              disabled={saving}
              className="text-xs text-red-500 hover:underline disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={add} className="flex items-end gap-3">
        <div className="flex-1">
          <Input
            label="Add admin by email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="name@example.com"
          />
        </div>
        <button
          type="submit"
          disabled={saving || !newEmail}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors mb-0.5"
        >
          Add
        </button>
      </form>

      {message && <p className="text-xs text-gray-500">{message}</p>}
    </div>
  )
}
