import { NextRequest, NextResponse } from 'next/server'
import { getAllTasks } from '@/lib/sheets/tasks'
import { getAllMembers } from '@/lib/sheets/team'
import { enrichTasks, calcDeadlinePerformance } from '@/lib/utils/calculations'
import { WeeklyReport, MonthlyReport, TaskView, ContentType, TaskFormat, Effort } from '@/types'
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  format, parseISO, isWithinInterval,
} from 'date-fns'
import { getAppSession } from '@/lib/auth/session'

function avgOrNull(nums: number[]): number | null {
  if (!nums.length) return null
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)
}

function buildStats(completed: TaskView[]) {
  const personCount: Record<string, number> = {}
  const personOutput: Record<string, number> = {}
  const typeCount: Record<string, number> = {}
  const typeOutput: Record<string, number> = {}
  const formatCount: Record<string, number> = {}
  const formatOutput: Record<string, number> = {}
  const effortMap: Record<string, number> = {}

  for (const t of completed) {
    const qty = t.video_quantity ?? 1
    personCount[t.person_name] = (personCount[t.person_name] ?? 0) + 1
    personOutput[t.person_name] = (personOutput[t.person_name] ?? 0) + qty
    typeCount[t.content_type] = (typeCount[t.content_type] ?? 0) + 1
    typeOutput[t.content_type] = (typeOutput[t.content_type] ?? 0) + qty
    formatCount[t.format] = (formatCount[t.format] ?? 0) + 1
    formatOutput[t.format] = (formatOutput[t.format] ?? 0) + qty
    effortMap[t.effort] = (effortMap[t.effort] ?? 0) + 1
  }

  const total_output = completed.reduce((sum, t) => sum + (t.video_quantity ?? 1), 0)

  const turnaroundMins = completed
    .filter((t) => t.added_at && t.completed_at)
    .map((t) => (new Date(t.completed_at).getTime() - new Date(t.added_at).getTime()) / 60000)
    .filter((m) => m > 0)

  return {
    total_output,
    by_person: Object.entries(personCount).map(([name, count]) => ({ name, count, output: personOutput[name] ?? count })),
    by_content_type: Object.entries(typeCount).map(([type, count]) => ({ type: type as ContentType, count, output: typeOutput[type] ?? count })),
    by_format: Object.entries(formatCount).map(([format, count]) => ({ format: format as TaskFormat, count, output: formatOutput[format] ?? count })),
    by_effort: Object.entries(effortMap).map(([effort, count]) => ({ effort: effort as Effort, count })),
    urgent_count: completed.filter((t) => t.priority === 'Urgent').length,
    on_time_count: completed.filter((t) => calcDeadlinePerformance(t) === 'On time').length,
    late_count: completed.filter((t) => calcDeadlinePerformance(t) === 'Late').length,
    published_count: completed.filter((t) => t.published).length,
    avg_turnaround_minutes: avgOrNull(turnaroundMins),
  }
}

function getCompletedInInterval(tasks: TaskView[], interval: { start: Date; end: Date }) {
  return tasks.filter((t) => {
    if (t.status !== 'Completed' || !t.completed_at) return false
    try { return isWithinInterval(parseISO(t.completed_at), interval) } catch { return false }
  })
}

function buildWeeklyReport(tasks: TaskView[], weekStart: Date): WeeklyReport {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const completed = getCompletedInInterval(tasks, { start: weekStart, end: weekEnd })
  const weekOfMonth = Math.ceil(weekStart.getDate() / 7)

  return {
    week_label: `${format(weekStart, 'MMMM')} — Week ${weekOfMonth}`,
    week_start: weekStart.toISOString(),
    week_end: weekEnd.toISOString(),
    total_completed: completed.length,
    ...buildStats(completed),
  }
}

function buildMonthlyReport(tasks: TaskView[], monthStart: Date): MonthlyReport {
  const monthEnd = endOfMonth(monthStart)
  const completed = getCompletedInInterval(tasks, { start: monthStart, end: monthEnd })

  return {
    month_label: format(monthStart, 'MMMM yyyy'),
    month_start: monthStart.toISOString(),
    month_end: monthEnd.toISOString(),
    total_completed: completed.length,
    ...buildStats(completed),
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const groupBy = searchParams.get('groupBy') ?? 'monthly'
  const weeksParam = parseInt(searchParams.get('weeks') ?? '8', 10)
  const monthsParam = parseInt(searchParams.get('months') ?? '6', 10)

  try {
    const { role, person_id } = await getAppSession()
    const [tasks, members] = await Promise.all([getAllTasks(), getAllMembers()])
    let enriched = enrichTasks(tasks, members)

    if (role === 'member' && person_id) {
      enriched = enriched.filter((t) => t.person_id === person_id)
    }

    const now = new Date()

    if (groupBy === 'monthly') {
      const reports: MonthlyReport[] = []
      for (let i = 0; i < monthsParam; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        reports.push(buildMonthlyReport(enriched, startOfMonth(d)))
      }
      return NextResponse.json({ data: reports })
    }

    // Weekly (original)
    const reports: WeeklyReport[] = []
    for (let i = 0; i < weeksParam; i++) {
      const weekStart = startOfWeek(
        new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7),
        { weekStartsOn: 1 }
      )
      reports.push(buildWeeklyReport(enriched, weekStart))
    }
    return NextResponse.json({ data: reports })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to generate reports' }, { status: 500 })
  }
}
