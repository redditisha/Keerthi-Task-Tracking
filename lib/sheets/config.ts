import { getRange, appendRow, updateRow } from './client'

const SHEET = 'Config'

// Columns: key | value
async function getAll(): Promise<Record<string, string>> {
  const rows = await getRange(`${SHEET}!A2:B500`)
  const map: Record<string, string> = {}
  for (const row of rows) {
    if (row[0]) map[row[0]] = row[1] ?? ''
  }
  return map
}

export async function getAdminEmails(): Promise<string[]> {
  const config = await getAll()
  const raw = config['admin_emails'] ?? ''
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export async function setAdminEmails(emails: string[]): Promise<void> {
  const rows = await getRange(`${SHEET}!A2:B500`)
  const idx = rows.findIndex((r) => r[0] === 'admin_emails')
  const value = emails.join(',')
  if (idx === -1) {
    await appendRow(SHEET, ['admin_emails', value])
  } else {
    await updateRow(SHEET, idx + 2, ['admin_emails', value])
  }
}
