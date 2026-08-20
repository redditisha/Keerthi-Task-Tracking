'use client'

import { useState, useRef } from 'react'
import { Goal } from '@/lib/sheets/goals'

interface Props {
  initialGoals: Goal[]
}

export default function GoalsSection({ initialGoals }: Props) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [newGoal, setNewGoal] = useState('')
  const [newDeadline, setNewDeadline] = useState('')
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState<string | null>(null)
  const [editDeadlineVal, setEditDeadlineVal] = useState('')

  // Drag state
  const dragIdx = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  // ── Add ─────────────────────────────────────────────────────────────────────
  async function handleAdd() {
    if (!newGoal.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: newGoal.trim(), deadline: newDeadline }),
      })
      const json = await res.json()
      if (json.data) {
        setGoals((prev) => [...prev, json.data])
        setNewGoal('')
        setNewDeadline('')
        setAdding(false)
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function handleDelete(goal_id: string) {
    setGoals((prev) => prev.filter((g) => g.goal_id !== goal_id))
    await fetch(`/api/goals/${goal_id}`, { method: 'DELETE' })
  }

  // ── Edit deadline ────────────────────────────────────────────────────────────
  function startEditDeadline(g: Goal) {
    setEditingDeadline(g.goal_id)
    setEditDeadlineVal(g.deadline)
  }

  async function saveDeadline(goal_id: string) {
    setGoals((prev) =>
      prev.map((g) => (g.goal_id === goal_id ? { ...g, deadline: editDeadlineVal } : g))
    )
    setEditingDeadline(null)
    await fetch(`/api/goals/${goal_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deadline: editDeadlineVal }),
    })
  }

  // ── Drag to reorder ──────────────────────────────────────────────────────────
  function onDragStart(idx: number) {
    dragIdx.current = idx
  }

  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    setDragOver(idx)
  }

  async function onDrop(idx: number) {
    if (dragIdx.current === null || dragIdx.current === idx) {
      setDragOver(null)
      return
    }
    const reordered = [...goals]
    const [moved] = reordered.splice(dragIdx.current, 1)
    reordered.splice(idx, 0, moved)
    dragIdx.current = null
    setDragOver(null)
    setGoals(reordered)
    // Persist new order
    await fetch('/api/goals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goals: reordered }),
    })
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function formatDate(iso: string) {
    if (!iso) return '—'
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  function deadlineChip(iso: string) {
    if (!iso) return <span className="text-gray-400 text-sm">—</span>
    const d = new Date(iso)
    if (isNaN(d.getTime())) return <span className="text-gray-400 text-sm">{iso}</span>
    const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    let cls = 'inline-block text-xs font-medium px-2.5 py-0.5 rounded-full border '
    if (diff < 0)       cls += 'bg-red-50 text-red-600 border-red-200'
    else if (diff <= 7) cls += 'bg-orange-50 text-orange-600 border-orange-200'
    else                cls += 'bg-gray-100 text-gray-600 border-gray-200'
    return <span className={cls}>{formatDate(iso)}</span>
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-indigo-500" />
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Goals</h2>
            <p className="text-xs text-gray-400 mt-0.5">Key priorities — drag to reorder</p>
          </div>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-xs px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            + Add Goal
          </button>
        )}
      </div>

      {/* Add row */}
      {adding && (
        <div className="flex items-center gap-2 px-5 py-3 bg-indigo-50 border-b border-indigo-100">
          <input
            type="text"
            placeholder="Goal description..."
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          />
          <input
            type="date"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            onClick={handleAdd}
            disabled={saving || !newGoal.trim()}
            className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => { setAdding(false); setNewGoal(''); setNewDeadline('') }}
            className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Table */}
      {goals.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-10">
          No goals yet. Add one to stay focused.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="w-8" />
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Goal
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-44">
                Deadline
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {goals.map((g, idx) => (
              <tr
                key={g.goal_id}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDrop={() => onDrop(idx)}
                onDragEnd={() => setDragOver(null)}
                className={`group border-b border-gray-50 last:border-0 transition-colors ${
                  dragOver === idx ? 'bg-indigo-50' : 'hover:bg-gray-50'
                }`}
              >
                {/* Drag handle */}
                <td className="pl-3 pr-1 py-3 text-gray-300 cursor-grab active:cursor-grabbing select-none">
                  <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
                    <circle cx="3" cy="3" r="1.5"/>
                    <circle cx="9" cy="3" r="1.5"/>
                    <circle cx="3" cy="8" r="1.5"/>
                    <circle cx="9" cy="8" r="1.5"/>
                    <circle cx="3" cy="13" r="1.5"/>
                    <circle cx="9" cy="13" r="1.5"/>
                  </svg>
                </td>

                {/* Goal text */}
                <td className="px-4 py-3 font-medium text-gray-800">{g.goal}</td>

                {/* Deadline — click to edit */}
                <td className="px-4 py-3">
                  {editingDeadline === g.goal_id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        value={editDeadlineVal}
                        onChange={(e) => setEditDeadlineVal(e.target.value)}
                        className="text-xs border border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveDeadline(g.goal_id)
                          if (e.key === 'Escape') setEditingDeadline(null)
                        }}
                      />
                      <button
                        onClick={() => saveDeadline(g.goal_id)}
                        className="text-xs text-indigo-600 font-medium hover:text-indigo-800"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingDeadline(null)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditDeadline(g)}
                      className="text-left hover:opacity-70 transition-opacity"
                      title="Click to edit deadline"
                    >
                      {deadlineChip(g.deadline)}
                    </button>
                  )}
                </td>

                {/* Delete */}
                <td className="px-2 py-3 text-right">
                  <button
                    onClick={() => handleDelete(g.goal_id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-lg leading-none"
                    title="Delete"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
