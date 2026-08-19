'use client'

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { ChangeRequest, ChangeField } from '@/lib/sheets/change-requests'

const FIELD_LABELS: Record<string, string> = {
  deadline: 'Deadline',
  started_at: 'Started Date',
  completed_at: 'Completed Date',
  notes: 'Notes',
  delete: 'Delete Task',
}

function fmtValue(field: string, value: string) {
  if (field === 'delete') return <span className="text-red-600 font-medium">Scrap / Delete task</span>
  if ((field === 'deadline' || field === 'started_at' || field === 'completed_at') && value) {
    try { return format(parseISO(value), 'MMM d, yyyy h:mm a') } catch { return value }
  }
  return value || '—'
}

function fmtTs(iso: string) {
  try { return format(parseISO(iso), 'MMM d, h:mm a') } catch { return iso }
}

function RequestCard({ request, onResolved }: { request: ChangeRequest; onResolved: (r: ChangeRequest) => void }) {
  const [adminNotes, setAdminNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const changes: ChangeField[] = JSON.parse(request.changes ?? '[]')
  const isDelete = changes.some((c) => c.field === 'delete')

  const resolve = async (action: 'accepted' | 'rejected') => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/change-requests/${request.request_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, admin_notes: adminNotes }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      onResolved(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`bg-white border rounded-lg p-4 space-y-3 ${isDelete ? 'border-red-200' : 'border-yellow-200'}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">{request.task_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {request.requested_by_email} · {fmtTs(request.requested_at)} · {request.task_id}
          </p>
        </div>
        {isDelete && (
          <span className="shrink-0 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Delete request</span>
        )}
      </div>

      {/* Requested changes */}
      <div className="space-y-1.5">
        {changes.map((c, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="font-medium text-gray-600 w-28 shrink-0">{FIELD_LABELS[c.field] ?? c.field}</span>
            <span className="text-gray-800">{fmtValue(c.field, c.new_value)}</span>
          </div>
        ))}
      </div>

      {/* Requester notes */}
      {request.notes && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2 italic">"{request.notes}"</p>
      )}

      {/* Admin notes input */}
      <input
        type="text"
        value={adminNotes}
        onChange={(e) => setAdminNotes(e.target.value)}
        placeholder="Add a note (optional)..."
        className="w-full border border-gray-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          onClick={() => resolve('accepted')}
          disabled={loading}
          className={`text-xs font-medium px-3 py-1.5 rounded transition-colors disabled:opacity-50 ${
            isDelete ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isDelete ? 'Accept & Delete' : 'Accept & Apply'}
        </button>
        <button
          onClick={() => resolve('rejected')}
          disabled={loading}
          className="text-xs font-medium px-3 py-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  )
}

export default function ChangeRequestsPanel() {
  const [requests, setRequests] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pending' | 'resolved'>('pending')

  useEffect(() => {
    fetch('/api/change-requests')
      .then((r) => r.json())
      .then((json) => { setRequests(json.data ?? []); setLoading(false) })
  }, [])

  const handleResolved = (updated: ChangeRequest) => {
    setRequests((prev) => prev.map((r) => (r.request_id === updated.request_id ? updated : r)))
  }

  const pending = requests.filter((r) => r.status === 'pending')
  const resolved = requests.filter((r) => r.status !== 'pending')

  const tabClass = (t: typeof tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
    }`

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>

  return (
    <div className="space-y-4">
      <div className="flex items-center border-b border-gray-200 gap-1">
        <button className={tabClass('pending')} onClick={() => setTab('pending')}>
          Pending
          {pending.length > 0 && (
            <span className="ml-1.5 text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">{pending.length}</span>
          )}
        </button>
        <button className={tabClass('resolved')} onClick={() => setTab('resolved')}>
          Resolved
          <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{resolved.length}</span>
        </button>
      </div>

      {tab === 'pending' && (
        pending.length === 0
          ? <p className="text-sm text-gray-400 py-6 text-center">No pending change requests.</p>
          : <div className="space-y-3">
              {pending.map((r) => <RequestCard key={r.request_id} request={r} onResolved={handleResolved} />)}
            </div>
      )}

      {tab === 'resolved' && (
        resolved.length === 0
          ? <p className="text-sm text-gray-400 py-6 text-center">No resolved requests yet.</p>
          : <div className="space-y-2">
              {resolved.map((r) => (
                <div key={r.request_id} className="bg-white border border-gray-100 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.task_name}</p>
                    <p className="text-xs text-gray-400">{r.requested_by_email} · {fmtTs(r.requested_at)}</p>
                    {r.admin_notes && <p className="text-xs text-gray-500 mt-0.5 italic">"{r.admin_notes}"</p>}
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                    r.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
      )}
    </div>
  )
}
