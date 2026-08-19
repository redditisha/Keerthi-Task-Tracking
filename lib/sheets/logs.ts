import { getRange, appendRow } from './client'

const SHEET = 'Logs'

export interface LogEntry {
  log_id: string
  timestamp: string
  actor_email: string
  actor_role: string
  action: string
  entity_type: string
  entity_id: string
  entity_name: string
  changes: string
}

export interface CreateLogInput {
  actor_email: string
  actor_role: string
  action: string
  entity_type: 'task' | 'team_member'
  entity_id: string
  entity_name: string
  changes?: Record<string, [unknown, unknown] | unknown>
}

function rowToLog(row: string[]): LogEntry {
  return {
    log_id: row[0] ?? '',
    timestamp: row[1] ?? '',
    actor_email: row[2] ?? '',
    actor_role: row[3] ?? '',
    action: row[4] ?? '',
    entity_type: row[5] ?? '',
    entity_id: row[6] ?? '',
    entity_name: row[7] ?? '',
    changes: row[8] ?? '',
  }
}

export async function getAllLogs(): Promise<LogEntry[]> {
  const rows = await getRange(`${SHEET}!A2:I5000`)
  return rows.filter((r) => r[0]).map(rowToLog).reverse() // newest first
}

export async function createLog(input: CreateLogInput): Promise<void> {
  const rows = await getRange(`${SHEET}!A2:A5000`)
  const count = rows.filter((r) => r[0]).length
  const log_id = `L${String(count + 1).padStart(5, '0')}`

  await appendRow(SHEET, [
    log_id,
    new Date().toISOString(),
    input.actor_email,
    input.actor_role,
    input.action,
    input.entity_type,
    input.entity_id,
    input.entity_name,
    input.changes ? JSON.stringify(input.changes) : '',
  ])
}
