'use client'

import { useEffect, useState } from 'react'
import { WeeklyReport } from '@/types'
import { format, parseISO } from 'date-fns'

function Bar({ value, max, color = 'bg-blue-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600 w-6 text-right">{value}</span>
    </div>
  )
}

function minutesToHuman(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function WeekCard({ report }: { report: WeeklyReport }) {
  const maxPerson = Math.max(...report.by_person.map((p) => p.count), 1)
  const maxType = Math.max(...report.by_content_type.map((t) => t.count), 1)
  const maxFormat = Math.max(...report.by_format.map((f) => f.count), 1)
  const maxEffort = Math.max(...report.by_effort.map((e) => e.count), 1)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">{report.week_label}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {format(parseISO(report.week_start), 'MMM d')} – {format(parseISO(report.week_end), 'MMM d')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-gray-900">{report.total_completed}</p>
          <p className="text-xs text-gray-400">completed</p>
        </div>
      </div>

      {report.total_completed === 0 ? (
        <p className="text-sm text-gray-400">No tasks completed this week.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* By person */}
          {report.by_person.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">By Person</p>
              <div className="space-y-1.5">
                {report.by_person.sort((a, b) => b.count - a.count).map((p) => (
                  <div key={p.name}>
                    <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                      <span>{p.name}</span>
                    </div>
                    <Bar value={p.count} max={maxPerson} color="bg-blue-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By content type */}
          {report.by_content_type.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">By Content Type</p>
              <div className="space-y-1.5">
                {report.by_content_type.sort((a, b) => b.count - a.count).map((t) => (
                  <div key={t.type}>
                    <div className="text-xs text-gray-600 mb-0.5">{t.type}</div>
                    <Bar value={t.count} max={maxType} color="bg-purple-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* By effort */}
          {report.by_effort.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">By Effort</p>
              <div className="space-y-1.5">
                {['High', 'Medium', 'Low'].map((level) => {
                  const item = report.by_effort.find((e) => e.effort === level)
                  if (!item) return null
                  const colors: Record<string, string> = { High: 'bg-red-400', Medium: 'bg-amber-400', Low: 'bg-green-400' }
                  return (
                    <div key={level}>
                      <div className="text-xs text-gray-600 mb-0.5">{level}</div>
                      <Bar value={item.count} max={maxEffort} color={colors[level]} />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Summary stats */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Summary</p>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Urgent</span><span className="font-medium">{report.urgent_count}</span>
              </div>
              <div className="flex justify-between">
                <span>On time</span><span className="font-medium text-green-600">{report.on_time_count}</span>
              </div>
              <div className="flex justify-between">
                <span>Late</span><span className="font-medium text-red-600">{report.late_count}</span>
              </div>
              <div className="flex justify-between">
                <span>Published</span><span className="font-medium">{report.published_count}</span>
              </div>
              {report.avg_turnaround_minutes !== null && (
                <div className="flex justify-between">
                  <span>Avg turnaround</span>
                  <span className="font-medium">{minutesToHuman(report.avg_turnaround_minutes)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PastWorkPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [weeks, setWeeks] = useState(8)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/reports?weeks=${weeks}`)
      .then((r) => r.json())
      .then((json) => {
        setReports(json.data ?? [])
        setLoading(false)
      })
  }, [weeks])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Past Work</h1>
          <p className="text-sm text-gray-500 mt-0.5">Weekly output reports</p>
        </div>
        <select
          value={weeks}
          onChange={(e) => setWeeks(Number(e.target.value))}
          className="border border-gray-200 rounded px-3 py-1.5 text-sm bg-white focus:outline-none"
        >
          <option value={4}>Last 4 weeks</option>
          <option value={8}>Last 8 weeks</option>
          <option value={12}>Last 12 weeks</option>
          <option value={24}>Last 24 weeks</option>
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 py-10 text-center">Loading reports…</div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <WeekCard key={r.week_start} report={r} />
          ))}
        </div>
      )}
    </div>
  )
}
