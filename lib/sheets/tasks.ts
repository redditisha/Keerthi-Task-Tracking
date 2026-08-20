import {
  Task, CreateTaskInput, UpdateTaskInput,
  ContentType, TaskFormat, Effort, Priority, RequestSource, TaskStatus,
} from '@/types'
import { getRange, appendRow, updateRow } from './client'

const SHEET = 'Tasks'
const HEADER_ROW = 1

// Columns (0-indexed):
// 0  task_id
// 1  task_name
// 2  person_id
// 3  content_type
// 4  format
// 5  effort
// 6  priority
// 7  request_source
// 8  deadline
// 9  added_at
// 10 started_at
// 11 completed_at
// 12 status
// 13 published
// 14 notes
// 15 created_at
// 16 updated_at
// 17 video_quantity

function rowToTask(row: string[]): Task {
  return {
    task_id: row[0] ?? '',
    task_name: row[1] ?? '',
    person_id: row[2] ?? '',
    content_type: (row[3] as ContentType) ?? 'Video',
    format: (row[4] as TaskFormat) ?? 'Short-form',
    effort: (row[5] as Effort) ?? 'Medium',
    priority: (row[6] as Priority) ?? 'Normal',
    request_source: (row[7] as RequestSource) ?? 'Internal',
    deadline: row[8] ?? '',
    added_at: row[9] ?? '',
    started_at: row[10] ?? '',
    completed_at: row[11] ?? '',
    status: (row[12] as TaskStatus) ?? 'Not Started',
    published: row[13] === 'TRUE' || row[13] === 'true' || row[13] === '1',
    notes: row[14] ?? '',
    created_at: row[15] ?? '',
    updated_at: row[16] ?? '',
    video_quantity: parseInt(row[17] ?? '1', 10) || 1,
  }
}

function taskToRow(t: Task): (string | boolean | number)[] {
  return [
    t.task_id, t.task_name, t.person_id, t.content_type, t.format,
    t.effort, t.priority, t.request_source, t.deadline, t.added_at,
    t.started_at, t.completed_at, t.status, t.published, t.notes,
    t.created_at, t.updated_at, t.video_quantity ?? 1,
  ]
}

export async function getAllTasks(): Promise<Task[]> {
  const rows = await getRange(`${SHEET}!A2:R5000`)
  return rows.filter((r) => r[0]).map(rowToTask)
}

export async function getTaskById(taskId: string): Promise<Task | null> {
  const tasks = await getAllTasks()
  return tasks.find((t) => t.task_id === taskId) ?? null
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const all = await getAllTasks()
  const maxNum = all.reduce((max, t) => {
    const n = parseInt(t.task_id.replace(/^T0*/, ''), 10)
    return isNaN(n) ? max : Math.max(max, n)
  }, 0)
  const task_id = `T${String(maxNum + 1).padStart(5, '0')}`
  const now = new Date().toISOString()
  const task: Task = {
    task_id,
    task_name: input.task_name,
    person_id: input.person_id,
    content_type: input.content_type,
    format: input.format,
    effort: input.effort,
    priority: input.priority,
    request_source: input.request_source,
    deadline: input.deadline,
    added_at: now,
    started_at: input.started_at ?? '',
    completed_at: input.completed_at ?? '',
    status: input.status,
    published: input.published,
    notes: input.notes ?? '',
    created_at: now,
    updated_at: now,
    video_quantity: input.video_quantity ?? 1,
  }
  await appendRow(SHEET, taskToRow(task))
  return task
}

export async function updateTask(input: UpdateTaskInput): Promise<Task | null> {
  const rows = await getRange(`${SHEET}!A2:R5000`)
  const idx = rows.findIndex((r) => r[0] === input.task_id)
  if (idx === -1) return null

  const existing = rowToTask(rows[idx])
  const updated: Task = {
    ...existing,
    ...input,
    updated_at: new Date().toISOString(),
  }
  await updateRow(SHEET, idx + 1 + HEADER_ROW, taskToRow(updated))
  return updated
}

export async function deleteTask(taskId: string): Promise<boolean> {
  const rows = await getRange(`${SHEET}!A2:R5000`)
  const idx = rows.findIndex((r) => r[0] === taskId)
  if (idx === -1) return false

  const existing = rowToTask(rows[idx])
  const updated: Task = {
    ...existing,
    status: 'Deleted',
    updated_at: new Date().toISOString(),
  }
  await updateRow(SHEET, idx + 1 + HEADER_ROW, taskToRow(updated))
  return true
}
