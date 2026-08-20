import { NextRequest, NextResponse } from 'next/server'
import { getAppSession } from '@/lib/auth/session'
import { canEdit } from '@/lib/auth/roles'
import { getAllGoals, createGoal, reorderGoals } from '@/lib/sheets/goals'

export async function GET() {
  const { role } = await getAppSession()
  if (!canEdit(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const goals = await getAllGoals()
    return NextResponse.json({ data: goals })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { role } = await getAppSession()
  if (!canEdit(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const { goal, deadline } = await req.json()
    if (!goal?.trim()) {
      return NextResponse.json({ error: 'Goal is required' }, { status: 400 })
    }
    const created = await createGoal(goal.trim(), deadline ?? '')
    return NextResponse.json({ data: created }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}

// PUT /api/goals — reorder all goals
export async function PUT(req: NextRequest) {
  const { role } = await getAppSession()
  if (!canEdit(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  try {
    const { goals } = await req.json()
    await reorderGoals(goals)
    return NextResponse.json({ data: { reordered: true } })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to reorder goals' }, { status: 500 })
  }
}
