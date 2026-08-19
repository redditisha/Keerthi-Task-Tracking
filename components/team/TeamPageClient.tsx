'use client'

import { useState } from 'react'
import { TeamMember } from '@/types'
import TeamTable from './TeamTable'
import AddMemberForm from './AddMemberForm'

interface TaskCount {
  person_id: string
  active: number
  weekCompleted: number
}

interface Props {
  initialMembers: TeamMember[]
  counts: TaskCount[]
  canEdit: boolean
}

export default function TeamPageClient({ initialMembers, counts, canEdit }: Props) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers)

  const handleUpdate = (updated: TeamMember) => {
    setMembers((prev) => prev.map((m) => (m.person_id === updated.person_id ? updated : m)))
  }

  const handleAdded = (added: TeamMember) => {
    setMembers((prev) => [...prev, added])
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Team</h1>

      <TeamTable
        members={members}
        counts={counts}
        onUpdate={handleUpdate}
      />

      {canEdit && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Add Team Member</h2>
          <AddMemberForm onAdded={handleAdded} />
        </div>
      )}
    </div>
  )
}
