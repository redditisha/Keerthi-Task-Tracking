'use client'

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { LogEntry } from '@/lib/sheets/logs'

const ACTION_STYLES: Record<string, string> = {
  created: 'bg-green-50 text-green-700',
  completed: 'bg-blue-50 text-blue-700',
  updated: 'bg-yellow-50 text-yellow-700',
  deleted: 'bg-red-50 text-red-700',
  member_created: 'bg-green-50 text-green-700',
  member_updated: 'bg-yellow-50 text-yellow-700',
  member_deleted: 'bg-red-50 text-red-700',
}

function fmtTs(iso: string) {
  try { return format(parseISO(iso), 'MMM d, yyyy h:mm a') } catch { return iso }
}

function ChangesCell({ raw }: { raw: string }) {
  if (!raw) return <span className="text-gray-300">—</span>

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const entries = Object.entries(parsed)
    return (
      <div className="space-y-0.5">
        {entries.map(([key, val]) => {
          if (Array.isArray(val) && val.length === 2) {
            return (
              <div key={key} className="text-xs">
                <span className="font-medium text-gray-600">{key}:</span>{' '}
                <span className="text-gray-400 line-through">{String(val[0])}</span>
                {' → '}
                <span className="text-gray-800">{String(val[1])}</span>
              </div>
            )
          }
          return (
            <div key={key} className="text-xs">
              <span className="font-medium text-gray-600">{key}:</span>{' '}
              <span className="text-gray-800">{String(val)}</span>
            </div>
          )
        })}
      </div>
    )
  } catch {
    return <span className="text-xs text-gray-500">{raw}</span>
  }
}

export default function LogsViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetch('/api/logs')
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error)
        setLogs(json.data ?? [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const displayed = filter
    ? logs.filter(
        (l) =>
          l.actor_email.includes(filter) ||
          l.entity_name.toLowerCase().includes(filter.toLowerCase()) ||
          l.action.includes(filter)
      )
    : logs

  if (loading) return <p className="text-sm text-gray-400">Loading logs…</p>
  if (error) return <p className="text-sm text-red-500">{error}</p>

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by email, task name, or action…"
          className="flex-1 border border-gray-200 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
        />
        <span className="text-xs text-gray-400">{displayed.length} entries</span>
      </div>

      {displayed.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">No logs yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Time</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actor</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entity</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Changes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {displayed.map((log) => (
                <tr key={log.log_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                    {fmtTs(log.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-gray-800">{log.actor_email}</div>
                    <div className="text-xs text-gray-400">{log.actor_role}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ACTION_STYLES[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-medium text-gray-800">{log.entity_name}</div>
                    <div className="text-xs text-gray-400">{log.entity_type} · {log.entity_id}</div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <ChangesCell raw={log.changes} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
