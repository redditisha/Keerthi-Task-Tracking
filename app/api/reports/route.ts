import { NextRequest, NextResponse } from 'next/server'
import { getAllTasks } from '@/lib/sheets/tasks'
import { getAllMembers } from '@/lib/sheets/team'
import { enrichTasks, calcDeadlinePerformance } from '@/lib/utils/calculations'
import { WeeklyReport, TaskView, ContentType, TaskFormat, Effort } from '@/types'
import { startOfWeek, endOfWeek, format, parseISO, isWithinInterval } from 'date-fns'
import { getAppSession } from '@/lib/auth/session'

function getWeekLabel(date: Date): string {
  const month = format(date, 'MMMM')
  const weekOfMonth = Math.ceil(date.getDate() / 7)
  return `${month} — Week ${weekOfMonth}`
}

function avgOrNull(nums: number[]): number | null {
  if (!nums.length) return null
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)
}

function buildWeeklyReport(tasks: TaskView[], weekStart: Date): WeeklyReport {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const interval = { start: weekStart, end: weekEnd }

  const completed = tasks.filter((t) => {
    if (t.status !== 'Completed' || !t.completed_at) return false
    try {
      return isWithinInterval(parseISO(t.completed_at), interval)
    } catch {
      return false
    }
  })

  // By person
  const personMap: Record<string, number> = {}
  completed.forEach((t) => {
    personMap[t.person_name] = (personMap[t.person_name] ?? 0) + 1
  })

  // By content type
  const typeMap: Record<string, number> = {}
  completed.forEach((t) => {
    typeMap[t.content_type] = (typeMap[t.content_type] ?? 0) + 1
  })

  // By format
  const formatMap: Record<string, number> = {}
  completed.forEach((t) => {
    formatMap[t.format] = (formatMap[t.format] ?? 0) + 1
  })

  // By effort
  const effortMap: Record<string, number> = {}
  completed.forEach((t) => {
    effortMap[t.effort] = (effortMap[t.effort] ?? 0) + 1
  })

  const on_time = completed.filter((t) => calcDeadlinePerformance(t) === 'On time').length
  const late = completed.filter((t) => calcDeadlinePerformance(t) === 'Late').length

  // Avg turnaround in minutes
  const turnaroundMins = completed
    .filter((t) => t.added_at && t.completed_at)
    .map((t) => (new Date(t.completed_at).getTime() - new Date(t.added_at).getTime()) / 60000)
    .filter((m) => m > 0)

  return {
    week_label: getWeekLabel(weekStart),
    week_start: weekStart.toISOString(),
    week_end: weekEnd.toISOString(),
    total_completed: completed.length,
    by_person: Object.entries(personMap).map(([name, count]) => ({ name, count })),
    by_content_type: Object.entries(typeMap).map(([type, count]) => ({ type: type as ContentType, count })),
    by_format: Object.entries(formatMap).map(([format, count]) => ({ format: format as TaskFormat, count })),
    by_effort: Object.entries(effortMap).map(([effort, count]) => ({ effort: effort as Effort, count })),
    urgent_count: completed.filter((t) => t.priority === 'Urgent').length,
    on_time_count: on_time,
    late_count: late,
    published_count: completed.filter((t) => t.published).length,
    avg_turnaround_minutes: avgOrNull(turnaroundMins),
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const weeksParam = parseInt(searchParams.get('weeks') ?? '8', 10)

  try {
    const { role, person_id } = await getAppSession()
    const [tasks, members] = await Promise.all([getAllTasks(), getAllMembers()])
    let enriched = enrichTasks(tasks, members)

    // Members only see their own history
    if (role === 'member' && person_id) {
      enriched = enriched.filter((t) => t.person_id === person_id)
    }

    const reports: WeeklyReport[] = []
    const now = new Date()

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
