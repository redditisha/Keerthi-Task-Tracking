// ─── Enums / Union Types ─────────────────────────────────────────────────────

export type ContentType = 'Video' | 'Creative' | 'Written'

export type VideoFormat = 'Short-form' | 'Long-form'
export type CreativeFormat =
  | 'Static'
  | 'Carousel'
  | 'YouTube Thumbnail'
  | 'Instagram Thumbnail'
  | 'Other Creative'
export type WrittenFormat = 'Long Form Script' | 'Short Form Script' | 'Carousel' | 'Caption' | 'Tweet' | 'Article' | 'Other'
export type TaskFormat = VideoFormat | CreativeFormat | WrittenFormat

export type Effort = 'Low' | 'Medium' | 'High'
export type Priority = 'Urgent' | 'Normal'
export type RequestSource = string   // dynamic — managed via Channels sheet
export type TaskStatus = 'Not Started' | 'Started' | 'In Progress' | 'In Review' | 'Completed' | 'On Hold / Blocked' | 'Deleted'
export type UserRole = 'Editor' | 'Designer' | 'Writer' | 'Content Manager' | 'Other'
export type AppRole = 'super_admin' | 'admin' | 'member' | 'viewer'

export type DeadlinePerformance = 'On time' | 'Late' | 'Not yet due' | 'Overdue'

// ─── Core Entities ───────────────────────────────────────────────────────────

export interface TeamMember {
  person_id: string
  name: string
  role: UserRole
  active: boolean
  created_at: string
  email: string
}

export interface Task {
  task_id: string
  task_name: string
  person_id: string
  content_type: ContentType
  format: TaskFormat
  effort: Effort
  priority: Priority
  request_source: RequestSource
  deadline: string        // ISO datetime string
  added_at: string        // ISO datetime string
  started_at: string      // ISO datetime string or ''
  completed_at: string    // ISO datetime string or ''
  status: TaskStatus
  published: boolean
  notes: string
  created_at: string
  updated_at: string
  video_quantity: number  // number of videos/creatives in this task
}

// Task with derived/joined fields for display
export interface TaskView extends Task {
  person_name: string
  person_role: UserRole
  turnaround_time: string | null       // e.g. "7h 15m"
  working_duration: string | null      // e.g. "5h 45m"
  deadline_performance: DeadlinePerformance | null
  delay_duration: string | null        // e.g. "18 hours"
}

// ─── Forms ───────────────────────────────────────────────────────────────────

export interface CreateTaskInput {
  task_name: string
  person_id: string
  content_type: ContentType
  format: TaskFormat
  effort: Effort
  priority: Priority
  request_source: RequestSource
  deadline: string
  added_at?: string
  started_at?: string
  completed_at?: string
  status: TaskStatus
  published: boolean
  notes?: string
  video_quantity?: number
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  task_id: string
}

// ─── Reporting ───────────────────────────────────────────────────────────────

export interface WeeklyReport {
  week_label: string        // e.g. "August — Week 2"
  week_start: string        // ISO date
  week_end: string          // ISO date
  total_completed: number
  total_output: number      // sum of video_quantity across completed tasks
  by_person: Array<{ name: string; count: number; output: number }>
  by_content_type: Array<{ type: ContentType; count: number; output: number }>
  by_format: Array<{ format: TaskFormat; count: number; output: number }>
  by_effort: Array<{ effort: Effort; count: number }>
  urgent_count: number
  on_time_count: number
  late_count: number
  published_count: number
  avg_turnaround_minutes: number | null
}

export interface MonthlyReport {
  month_label: string       // e.g. "August 2026"
  month_start: string       // ISO date
  month_end: string         // ISO date
  total_completed: number
  total_output: number      // sum of video_quantity across completed tasks
  by_person: Array<{ name: string; count: number; output: number }>
  by_content_type: Array<{ type: ContentType; count: number; output: number }>
  by_format: Array<{ format: TaskFormat; count: number; output: number }>
  by_effort: Array<{ effort: Effort; count: number }>
  urgent_count: number
  on_time_count: number
  late_count: number
  published_count: number
  avg_turnaround_minutes: number | null
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface SessionUser {
  name?: string | null
  email?: string | null
  image?: string | null
  app_role: AppRole
  person_id?: string       // set when role === 'member'
  person_role?: UserRole   // set when role === 'member'
}

export interface CreateTeamMemberInput {
  name: string
  role: UserRole
  active: boolean
  email?: string
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T
  error?: string
}

// ─── Taxonomy constants ──────────────────────────────────────────────────────

export const CONTENT_TYPES: ContentType[] = ['Video', 'Creative', 'Written']

export const FORMATS_BY_TYPE: Record<ContentType, TaskFormat[]> = {
  Video: ['Short-form', 'Long-form'],
  Creative: ['Static', 'Carousel', 'YouTube Thumbnail', 'Instagram Thumbnail', 'Other Creative'],
  Written: ['Long Form Script', 'Short Form Script', 'Carousel', 'Caption', 'Tweet', 'Article', 'Other'],
}

export const EFFORT_LEVELS: Effort[] = ['Low', 'Medium', 'High']
export const PRIORITIES: Priority[] = ['Urgent', 'Normal']
export const REQUEST_SOURCES: RequestSource[] = []   // kept for compatibility; populated dynamically from Channels sheet
export const TASK_STATUSES: TaskStatus[] = ['Not Started', 'Started', 'In Progress', 'In Review', 'Completed', 'On Hold / Blocked']
export const USER_ROLES: UserRole[] = ['Editor', 'Designer', 'Writer', 'Content Manager', 'Other']
