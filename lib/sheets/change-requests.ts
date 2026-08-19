import { getRange, appendRow, updateRow } from './client'

const SHEET = 'ChangeRequests'
const HEADER_ROW = 1

export type ChangeRequestStatus = 'pending' | 'accepted' | 'rejected'

export interface ChangeField {
  field: string       // 'deadline' | 'started_at' | 'completed_at' | 'notes' | 'delete'
  new_value: string   // ISO string for dates, text for notes, '' for delete
}

export interface ChangeRequest {
  request_id: string
  task_id: string
  task_name: string
  requested_by_id: string
  requested_by_email: string
  requested_at: string
  changes: string   // JSON string of ChangeField[]
  notes: string
  status: ChangeRequestStatus
  reviewed_by: string
  reviewed_at: string
  admin_notes: string
}

export interface CreateChangeRequestInput {
  task_id: string
  task_name: string
  requested_by_id: string
  requested_by_email: string
  changes: ChangeField[]
  notes: string
}

function rowToRequest(row: string[]): ChangeRequest {
  return {
    request_id: row[0] ?? '',
    task_id: row[1] ?? '',
    task_name: row[2] ?? '',
    requested_by_id: row[3] ?? '',
    requested_by_email: row[4] ?? '',
    requested_at: row[5] ?? '',
    changes: row[6] ?? '[]',
    notes: row[7] ?? '',
    status: (row[8] as ChangeRequestStatus) ?? 'pending',
    reviewed_by: row[9] ?? '',
    reviewed_at: row[10] ?? '',
    admin_notes: row[11] ?? '',
  }
}

export async function getAllChangeRequests(): Promise<ChangeRequest[]> {
  const rows = await getRange(`${SHEET}!A2:L5000`)
  return rows.filter((r) => r[0]).map(rowToRequest).reverse()
}

export async function createChangeRequest(input: CreateChangeRequestInput): Promise<ChangeRequest> {
  const rows = await getRange(`${SHEET}!A2:A5000`)
  const count = rows.filter((r) => r[0]).length
  const request_id = `CR${String(count + 1).padStart(5, '0')}`
  const now = new Date().toISOString()

  const request: ChangeRequest = {
    request_id,
    task_id: input.task_id,
    task_name: input.task_name,
    requested_by_id: input.requested_by_id,
    requested_by_email: input.requested_by_email,
    requested_at: now,
    changes: JSON.stringify(input.changes),
    notes: input.notes,
    status: 'pending',
    reviewed_by: '',
    reviewed_at: '',
    admin_notes: '',
  }

  await appendRow(SHEET, [
    request.request_id,
    request.task_id,
    request.task_name,
    request.requested_by_id,
    request.requested_by_email,
    request.requested_at,
    request.changes,
    request.notes,
    request.status,
    request.reviewed_by,
    request.reviewed_at,
    request.admin_notes,
  ])

  return request
}

export async function resolveChangeRequest(
  requestId: string,
  status: 'accepted' | 'rejected',
  reviewedBy: string,
  adminNotes: string
): Promise<ChangeRequest | null> {
  const rows = await getRange(`${SHEET}!A2:L5000`)
  const idx = rows.findIndex((r) => r[0] === requestId)
  if (idx === -1) return null

  const updated: ChangeRequest = {
    ...rowToRequest(rows[idx]),
    status,
    reviewed_by: reviewedBy,
    reviewed_at: new Date().toISOString(),
    admin_notes: adminNotes,
  }

  await updateRow(SHEET, idx + 1 + HEADER_ROW, [
    updated.request_id,
    updated.task_id,
    updated.task_name,
    updated.requested_by_id,
    updated.requested_by_email,
    updated.requested_at,
    updated.changes,
    updated.notes,
    updated.status,
    updated.reviewed_by,
    updated.reviewed_at,
    updated.admin_notes,
  ])

  return updated
}
