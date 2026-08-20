'use client'

import { useEffect, useState } from 'react'
import { WeeklyReport, MonthlyReport } from '@/types'
import { format, parseISO } from 'date-fns'

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Bar({ value, max, color = 'bg-blue-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-5 text-right">{value}</span>
    </div>
  )
}

function minutesToHuman(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ─── Weekly card ─────────────────────────────────────────────────────────────

function WeekCard({ report }: { report: WeeklyReport }) {
  const maxPerson = Math.max(...report.by_person.map((p) => p.output), 1)
  const maxType = Math.max(...report.by_content_type.map((t) => t.output), 1)
  const maxEffort = Math.max(...report.by_effort.map((e) => e.count), 1)
  const hasMultiQty = report.total_output !== report.total_completed

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">{report.week_label}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {format(parseISO(report.week_start), 'MMM d')} – {format(parseISO(report.week_end), 'MMM d')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-gray-900">{report.total_completed}</p>
          <p className="text-xs text-gray-400">
            {hasMultiQty ? `${report.total_output} outputs` : 'completed'}
          </p>
        </div>
      </div>

      {report.total_completed === 0 ? (
        <p className="text-sm text-gray-400">No tasks completed this week.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {report.by_person.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">By Person</p>
              <div className="space-y-1.5">
                {[...report.by_person].sort((a, b) => b.output - a.output).map((p) => (
                  <div key={p.name}>
                    <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                      <span>{p.name}</span>
                      {p.output !== p.count && <span className="text-gray-400">{p.count} tasks · {p.output} outputs</span>}
                    </div>
                    <Bar value={p.output} max={maxPerson} color="bg-blue-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.by_content_type.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">By Content Type</p>
              <div className="space-y-1.5">
                {[...report.by_content_type].sort((a, b) => b.output - a.output).map((t) => (
                  <div key={t.type}>
                    <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                      <span>{t.type}</span>
                      {t.output !== t.count && <span className="text-gray-400">{t.output} outputs</span>}
                    </div>
                    <Bar value={t.output} max={maxType} color="bg-purple-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.by_effort.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">By Effort</p>
              <div className="space-y-1.5">
                {(['High', 'Medium', 'Low'] as const).map((level) => {
                  const item = report.by_effort.find((e) => e.effort === level)
                  if (!item) return null
                  const colors = { High: 'bg-red-400', Medium: 'bg-amber-400', Low: 'bg-green-400' }
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

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Summary</p>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between"><span>Urgent</span><span className="font-medium">{report.urgent_count}</span></div>
              <div className="flex justify-between"><span>On time</span><span className="font-medium text-green-600">{report.on_time_count}</span></div>
              <div className="flex justify-between"><span>Late</span><span className="font-medium text-red-500">{report.late_count}</span></div>
              <div className="flex justify-between"><span>Published</span><span className="font-medium">{report.published_count}</span></div>
              {report.avg_turnaround_minutes !== null && (
                <div className="flex justify-between"><span>Avg turnaround</span><span className="font-medium">{minutesToHuman(report.avg_turnaround_minutes)}</span></div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Monthly card ─────────────────────────────────────────────────────────────

function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-4 py-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function MonthCard({ report }: { report: MonthlyReport }) {
  const topPerson = [...report.by_person].sort((a, b) => b.output - a.output)[0]
  const topType = [...report.by_content_type].sort((a, b) => b.output - a.output)[0]
  const onTimeRate = report.total_completed > 0
    ? Math.round((report.on_time_count / report.total_completed) * 100)
    : null
  const hasMultiQty = report.total_output !== report.total_completed

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Month header */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900">
        <div>
          <h2 className="text-base font-semibold text-white">{report.month_label}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {format(parseISO(report.month_start), 'MMM d')} – {format(parseISO(report.month_end), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white">{report.total_completed}</p>
          <p className="text-xs text-gray-400">tasks completed</p>
          {hasMultiQty && (
            <p className="text-sm font-semibold text-amber-400 mt-0.5">{report.total_output} total outputs</p>
          )}
        </div>
      </div>

      {report.total_completed === 0 ? (
        <p className="text-sm text-gray-400 px-6 py-8">No tasks completed this month.</p>
      ) : (
        <div className="p-6 space-y-6">
          {/* Stat boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="On Time" value={`${onTimeRate ?? 0}%`} sub={`${report.on_time_count} tasks`} />
            <StatBox label="Late" value={report.late_count} />
            <StatBox label="Urgent" value={report.urgent_count} />
            <StatBox label="Published" value={report.published_count} />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* By person */}
            {report.by_person.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Output by Person</p>
                <div className="space-y-2">
                  {[...report.by_person].sort((a, b) => b.output - a.output).map((p) => {
                    const maxOutput = Math.max(...report.by_person.map((x) => x.output), 1)
                    const pct = Math.round((p.output / maxOutput) * 100)
                    const isTop = p.name === topPerson?.name
                    return (
                      <div key={p.name}>
                        <div className="flex items-center justify-between gap-3 mb-0.5">
                          <span className={`text-sm truncate ${isTop ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                            {p.name}
                          </span>
                          <span className="text-xs text-gray-500 shrink-0">
                            {p.output !== p.count ? `${p.count}t · ${p.output} out` : `${p.count}`}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* By content type */}
            {report.by_content_type.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Content Type</p>
                <div className="space-y-2">
                  {[...report.by_content_type].sort((a, b) => b.output - a.output).map((t) => {
                    const isTop = t.type === topType?.type
                    return (
                      <div key={t.type} className="flex items-center justify-between gap-2">
                        <span className={`text-sm ${isTop ? 'font-medium text-gray-900' : 'text-gray-600'}`}>{t.type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isTop ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                          {t.output !== t.count ? `${t.count}t · ${t.output}` : t.count}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* By effort + turnaround */}
            <div className="space-y-4">
              {report.by_effort.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Effort Split</p>
                  <div className="space-y-1.5">
                    {(['High', 'Medium', 'Low'] as const).map((level) => {
                      const item = report.by_effort.find((e) => e.effort === level)
                      if (!item) return null
                      const pct = report.total_completed > 0 ? Math.round((item.count / report.total_completed) * 100) : 0
                      const colors = { High: 'text-red-500', Medium: 'text-amber-500', Low: 'text-green-500' }
                      return (
                        <div key={level} className="flex items-center gap-2 text-xs">
                          <span className={`w-14 ${colors[level]} font-medium`}>{level}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${level === 'High' ? 'bg-red-400' : level === 'Medium' ? 'bg-amber-400' : 'bg-green-400'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-gray-500 w-5 text-right">{item.count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {report.avg_turnaround_minutes !== null && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Avg Turnaround</p>
                  <p className="text-lg font-semibold text-gray-900">{minutesToHuman(report.avg_turnaround_minutes)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type GroupBy = 'monthly' | 'weekly'

export default function PastWorkClient() {
  const [groupBy, setGroupBy] = useState<GroupBy>('monthly')
  const [reports, setReports] = useState<(WeeklyReport | MonthlyReport)[]>([])
  const [loading, setLoading] = useState(true)
  const [weeks, setWeeks] = useState(8)
  const [months, setMonths] = useState(6)

  useEffect(() => {
    setLoading(true)
    const params = groupBy === 'monthly'
      ? `groupBy=monthly&months=${months}`
      : `groupBy=weekly&weeks=${weeks}`
    fetch(`/api/reports?${params}`)
      .then((r) => r.json())
      .then((json) => {
        setReports(json.data ?? [])
        setLoading(false)
      })
  }, [groupBy, weeks, months])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Past Work</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {groupBy === 'monthly' ? 'Monthly output reports' : 'Weekly output reports'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(['monthly', 'weekly'] as GroupBy[]).map((g) => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
                  groupBy === g ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Range selector */}
          {groupBy === 'monthly' ? (
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none"
            >
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
            </select>
          ) : (
            <select
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none"
            >
              <option value={4}>Last 4 weeks</option>
              <option value={8}>Last 8 weeks</option>
              <option value={12}>Last 12 weeks</option>
              <option value={24}>Last 24 weeks</option>
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-sm text-gray-400 py-10 text-center">Loading reports…</div>
      ) : (
        <div className="space-y-4">
          {groupBy === 'monthly'
            ? (reports as MonthlyReport[]).map((r) => (
                <MonthCard key={r.month_start} report={r} />
              ))
            : (reports as WeeklyReport[]).map((r) => (
                <WeekCard key={r.week_start} report={r} />
              ))
          }
        </div>
      )}
    </div>
  )
}
