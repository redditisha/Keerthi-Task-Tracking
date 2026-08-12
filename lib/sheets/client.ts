// This module only runs in the Node.js runtime (API routes + Server Components).
// It must never be imported from Edge-runtime code (proxy.ts / middleware).
import { google } from 'googleapis'

let _sheets: ReturnType<typeof google.sheets> | null = null

function getAuth() {
  // Production (Vercel): full JSON stored as env var
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
    return new google.auth.GoogleAuth({
      credentials: key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
  }

  // Local dev: read from file path
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('path') as typeof import('path')

  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH
  if (!keyPath) throw new Error('Set GOOGLE_SERVICE_ACCOUNT_KEY or GOOGLE_SERVICE_ACCOUNT_KEY_PATH')

  const resolved = path.isAbsolute(keyPath)
    ? keyPath
    : path.join(process.cwd(), keyPath)

  if (!fs.existsSync(resolved)) throw new Error(`Key file not found at: ${resolved}`)

  const key = JSON.parse(fs.readFileSync(resolved, 'utf-8'))
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

export function getSheetsClient() {
  if (!_sheets) {
    const auth = getAuth()
    _sheets = google.sheets({ version: 'v4', auth })
  }
  return _sheets
}

export const SHEET_ID = () => {
  const id = process.env.GOOGLE_SHEET_ID
  if (!id) throw new Error('GOOGLE_SHEET_ID is not set')
  return id
}

// ─── Low-level helpers ───────────────────────────────────────────────────────

export async function getRange(range: string): Promise<string[][]> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID(),
    range,
  })
  return (res.data.values as string[][]) ?? []
}

export async function appendRow(sheetName: string, values: (string | boolean | number)[]): Promise<void> {
  const sheets = getSheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID(),
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  })
}

export async function updateRow(
  sheetName: string,
  rowIndex: number, // 1-based, including header
  values: (string | boolean | number)[]
): Promise<void> {
  const sheets = getSheetsClient()
  const range = `${sheetName}!A${rowIndex}:Z${rowIndex}`
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID(),
    range,
    valueInputOption: 'RAW',
    requestBody: { values: [values] },
  })
}

export async function clearRow(sheetName: string, rowIndex: number): Promise<void> {
  const sheets = getSheetsClient()
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID(),
    range: `${sheetName}!A${rowIndex}:Z${rowIndex}`,
  })
}
