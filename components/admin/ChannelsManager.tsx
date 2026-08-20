'use client'

import { useEffect, useState } from 'react'

interface Channel {
  channel_id: string
  name: string
}

export default function ChannelsManager() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/channels')
      .then((r) => r.json())
      .then((json) => {
        setChannels(json.data ?? [])
        setLoading(false)
      })
  }, [])

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const json = await res.json()
      if (json.data) {
        setChannels((prev) => [...prev, json.data])
        setNewName('')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(channel_id: string) {
    await fetch(`/api/channels/${channel_id}`, { method: 'DELETE' })
    setChannels((prev) => prev.filter((c) => c.channel_id !== channel_id))
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">Channels / Request Sources</h3>
        <p className="text-xs text-gray-400 mt-0.5">These appear in the "Request Source" dropdown when creating tasks.</p>
      </div>

      {/* Add */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-gray-100">
        <input
          type="text"
          placeholder="Channel name…"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !newName.trim()}
          className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Adding…' : '+ Add'}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-gray-400 px-5 py-4">Loading…</p>
      ) : channels.length === 0 ? (
        <p className="text-sm text-gray-400 px-5 py-4">No channels yet. Add one above.</p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {channels.map((c) => (
            <li key={c.channel_id} className="flex items-center justify-between px-5 py-2.5 group hover:bg-gray-50">
              <span className="text-sm text-gray-800">{c.name}</span>
              <button
                onClick={() => handleDelete(c.channel_id)}
                className="text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
