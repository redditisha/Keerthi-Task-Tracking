import { getSheetsClient, SHEET_ID, getRange, appendRow, deleteRow } from './client'

const SHEET = 'Goals'

export interface Goal {
  goal_id: string
  goal: string
  deadline: string
}

function rowToGoal(row: string[]): Goal {
  return {
    goal_id: row[0] ?? '',
    goal: row[1] ?? '',
    deadline: row[2] ?? '',
  }
}

export async function getAllGoals(): Promise<Goal[]> {
  const rows = await getRange(`${SHEET}!A2:C5000`)
  return rows.filter((r) => r[0]).map(rowToGoal)
}

export async function createGoal(goal: string, deadline: string): Promise<Goal> {
  const rows = await getRange(`${SHEET}!A2:A5000`)
  const existing = rows.filter((r) => r[0])
  // Use max ID to avoid duplicates after deletions
  let maxNum = 0
  for (const r of existing) {
    const n = parseInt(r[0].replace(/^G0*/, ''), 10)
    if (!isNaN(n) && n > maxNum) maxNum = n
  }
  const goal_id = `G${String(maxNum + 1).padStart(5, '0')}`

  await appendRow(SHEET, [goal_id, goal, deadline])
  return { goal_id, goal, deadline }
}

export async function updateGoalDeadline(goal_id: string, deadline: string): Promise<boolean> {
  const rows = await getRange(`${SHEET}!A2:C5000`)
  const idx = rows.findIndex((r) => r[0] === goal_id)
  if (idx === -1) return false

  const sheets = getSheetsClient()
  const rowNum = idx + 2 // 1-based + header
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID(),
    range: `${SHEET}!C${rowNum}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[deadline]] },
  })
  return true
}

export async function reorderGoals(orderedGoals: Goal[]): Promise<void> {
  const sheets = getSheetsClient()
  const spreadsheetId = SHEET_ID()

  // Clear existing data rows
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${SHEET}!A2:C5000`,
  })

  if (orderedGoals.length === 0) return

  // Write in new order
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${SHEET}!A2:C${orderedGoals.length + 1}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: orderedGoals.map((g) => [g.goal_id, g.goal, g.deadline]),
    },
  })
}

export async function deleteGoal(goal_id: string): Promise<boolean> {
  const rows = await getRange(`${SHEET}!A2:C5000`)
  const idx = rows.findIndex((r) => r[0] === goal_id)
  if (idx === -1) return false

  await deleteRow(SHEET, idx + 2)
  return true
}
