import { TeamMember, CreateTeamMemberInput, UserRole } from '@/types'
import { getRange, appendRow, updateRow, clearRow } from './client'

const SHEET = 'Team'
const HEADER_ROW = 1

// Columns: person_id | name | role | active | created_at
function rowToMember(row: string[]): TeamMember {
  return {
    person_id: row[0] ?? '',
    name: row[1] ?? '',
    role: (row[2] as UserRole) ?? 'Other',
    active: row[3] === 'TRUE' || row[3] === 'true' || row[3] === '1',
    created_at: row[4] ?? '',
  }
}

function memberToRow(m: TeamMember): (string | boolean)[] {
  return [m.person_id, m.name, m.role, m.active, m.created_at]
}

export async function getAllMembers(): Promise<TeamMember[]> {
  const rows = await getRange(`${SHEET}!A2:E1000`)
  return rows.filter((r) => r[0]).map(rowToMember)
}

export async function getMemberById(personId: string): Promise<TeamMember | null> {
  const members = await getAllMembers()
  return members.find((m) => m.person_id === personId) ?? null
}

export async function createMember(input: CreateTeamMemberInput): Promise<TeamMember> {
  const existing = await getAllMembers()
  const num = existing.length + 1
  const person_id = `P${String(num).padStart(3, '0')}`
  const member: TeamMember = {
    person_id,
    name: input.name,
    role: input.role,
    active: input.active,
    created_at: new Date().toISOString(),
  }
  await appendRow(SHEET, memberToRow(member))
  return member
}

export async function updateMember(
  personId: string,
  input: Partial<CreateTeamMemberInput>
): Promise<TeamMember | null> {
  const rows = await getRange(`${SHEET}!A2:E1000`)
  const idx = rows.findIndex((r) => r[0] === personId)
  if (idx === -1) return null
  const existing = rowToMember(rows[idx])
  const updated: TeamMember = { ...existing, ...input }
  await updateRow(SHEET, idx + 1 + HEADER_ROW, memberToRow(updated))
  return updated
}

export async function deleteMember(personId: string): Promise<boolean> {
  const rows = await getRange(`${SHEET}!A2:E1000`)
  const idx = rows.findIndex((r) => r[0] === personId)
  if (idx === -1) return false
  await clearRow(SHEET, idx + 1 + HEADER_ROW)
  return true
}
