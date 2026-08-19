'use client'

import { useState } from 'react'

export default function SeedButton() {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const run = async () => {
    if (!confirm('This will create historical tasks from July 13–21. Continue?')) return
    setStatus('running')
    setResult(null)
    setErrorMsg('')
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Seed failed')
      setResult(json.data)
      setStatus('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        One-time import of historical tasks (July 13–21, 2026). Safe to run only when the Tasks
        sheet is empty — running again will create duplicates.
      </p>

      <button
        onClick={run}
        disabled={status === 'running' || status === 'done'}
        className="bg-amber-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-amber-700 disabled:opacity-50 transition-colors"
      >
        {status === 'running' ? 'Seeding…' : status === 'done' ? 'Done' : 'Run Historical Seed'}
      </button>

      {status === 'done' && result && (
        <p className="text-sm text-green-700">
          Created {result.created} tasks{result.skipped > 0 ? `, skipped ${result.skipped}` : ''}.
        </p>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}
    </div>
  )
}
