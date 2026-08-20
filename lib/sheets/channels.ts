import { getSheetsClient, SHEET_ID, getRange, appendRow } from './client'

const SHEET = 'Channels'

export interface Channel {
  channel_id: string
  name: string
}

function rowToChannel(row: string[]): Channel {
  return {
    channel_id: row[0] ?? '',
    name: row[1] ?? '',
  }
}

export async function getAllChannels(): Promise<Channel[]> {
  const rows = await getRange(`${SHEET}!A2:B5000`)
  return rows.filter((r) => r[0]).map(rowToChannel)
}

export async function createChannel(name: string): Promise<Channel> {
  const rows = await getRange(`${SHEET}!A2:A5000`)
  let maxNum = 0
  for (const r of rows) {
    if (!r[0]) continue
    const n = parseInt(r[0].replace(/^CH0*/, ''), 10)
    if (!isNaN(n) && n > maxNum) maxNum = n
  }
  const channel_id = `CH${String(maxNum + 1).padStart(4, '0')}`
  await appendRow(SHEET, [channel_id, name])
  return { channel_id, name }
}

export async function deleteChannel(channel_id: string): Promise<boolean> {
  const sheets = getSheetsClient()
  const spreadsheetId = SHEET_ID()

  const rows = await getRange(`${SHEET}!A2:B5000`)
  const idx = rows.findIndex((r) => r[0] === channel_id)
  if (idx === -1) return false

  // Clear the row values (soft remove — keeps row intact)
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${SHEET}!A${idx + 2}:B${idx + 2}`,
  })
  return true
}
