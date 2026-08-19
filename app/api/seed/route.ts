import { NextResponse } from 'next/server'
import { getAppSession } from '@/lib/auth/session'
import { isAdmin } from '@/lib/auth/roles'
import { createTask } from '@/lib/sheets/tasks'
import { CreateTaskInput } from '@/types'

const YASHAS = 'P001'
const YOSHITH = 'P003'

// One-time seed endpoint — admin only.
// POST /api/seed   → creates historical tasks and returns a summary.
// Safe to call multiple times only if the sheet is empty; otherwise duplicates will be created.

function dt(date: string, time = '12:00') {
  return new Date(`${date}T${time}:00+05:30`).toISOString()
}

const RAW_TASKS: Array<CreateTaskInput> = [
  // 1. Podcast Edit — Yashas (P001) — Jul 13 → Jul 21
  {
    person_id: YASHAS,
    task_name: 'Podcast Edit',
    content_type: 'Video',
    format: 'Long-form',
    effort: 'High',
    priority: 'Normal',
    request_source: 'Client',
    added_at: dt('2026-07-13', '09:00'),
    started_at: dt('2026-07-13', '09:00'),
    deadline: dt('2026-07-21', '18:00'),
    completed_at: dt('2026-07-21', '18:00'),
    status: 'Completed',
    published: true,
    notes: 'Footage cleaning and audio sync (Jul 13–15), full podcast edit (Jul 16–18, 21). Client: Tejasvi Surya.',
  },

  // 2. 1 Reel Clip — Yashas (P001) — Jul 13
  {
    person_id: YASHAS,
    task_name: '1 Reel Clip',
    content_type: 'Video',
    format: 'Short-form',
    effort: 'High',
    priority: 'Normal',
    request_source: 'Client',
    added_at: dt('2026-07-13', '09:00'),
    started_at: dt('2026-07-13', '09:00'),
    deadline: dt('2026-07-13', '18:00'),
    completed_at: dt('2026-07-13', '18:00'),
    status: 'Completed',
    published: true,
    notes: 'Produced 1 reel clip from podcast footage. Client: Tejasvi Surya.',
  },

  // 3. 5 Raw Reel Clips — Yashas (P001) — Jul 14
  {
    person_id: YASHAS,
    task_name: '5 Raw Reel Clips',
    content_type: 'Video',
    format: 'Short-form',
    effort: 'Medium',
    priority: 'Normal',
    request_source: 'Client',
    added_at: dt('2026-07-14', '09:00'),
    started_at: dt('2026-07-14', '09:00'),
    deadline: dt('2026-07-14', '18:00'),
    completed_at: dt('2026-07-14', '18:00'),
    status: 'Completed',
    published: true,
    notes: '5 raw clips cut from podcast footage for reels. Client: Tejasvi Surya.',
  },

  // 4. Podcast Promo — Yoshith (P003) — Jul 13 → Jul 17
  {
    person_id: YOSHITH,
    task_name: 'Podcast Promo',
    content_type: 'Video',
    format: 'Short-form',
    effort: 'High',
    priority: 'Normal',
    request_source: 'Client',
    added_at: dt('2026-07-13', '09:00'),
    started_at: dt('2026-07-13', '09:00'),
    deadline: dt('2026-07-17', '18:00'),
    completed_at: dt('2026-07-17', '18:00'),
    status: 'Completed',
    published: true,
    notes: 'Created promo video (Jul 13), completed (Jul 14), revisions (Jul 15–16), final posted (Jul 17). Client: Tejasvi Surya.',
  },

  // 5. High Court Cuts — Yoshith (P003) — Jul 17
  {
    person_id: YOSHITH,
    task_name: 'High Court Cuts',
    content_type: 'Video',
    format: 'Short-form',
    effort: 'High',
    priority: 'Normal',
    request_source: 'Client',
    added_at: dt('2026-07-17', '09:00'),
    started_at: dt('2026-07-17', '09:00'),
    deadline: dt('2026-07-17', '18:00'),
    completed_at: dt('2026-07-17', '18:00'),
    status: 'Completed',
    published: true,
    notes: '2 cuts for High Court. Client: Tejasvi Surya.',
  },

  // 6. 3 Thumbnail Samples — Yashas (P001) — Jul 20
  {
    person_id: YASHAS,
    task_name: '3 Thumbnail Samples',
    content_type: 'Creative',
    format: 'YouTube Thumbnail',
    effort: 'High',
    priority: 'Normal',
    request_source: 'Client',
    added_at: dt('2026-07-20', '09:00'),
    started_at: dt('2026-07-20', '09:00'),
    deadline: dt('2026-07-20', '18:00'),
    completed_at: dt('2026-07-20', '18:00'),
    status: 'Completed',
    published: true,
    notes: '3 thumbnail samples created. Client: Tejasvi Surya.',
  },

  // 7. Sunday Event Highlights Video — Yashas (P001) — Jul 20
  {
    person_id: YASHAS,
    task_name: 'Sunday Event Highlights Video',
    content_type: 'Video',
    format: 'Short-form',
    effort: 'High',
    priority: 'Normal',
    request_source: 'Client',
    added_at: dt('2026-07-20', '09:00'),
    started_at: dt('2026-07-20', '09:00'),
    deadline: dt('2026-07-20', '18:00'),
    completed_at: dt('2026-07-20', '18:00'),
    status: 'Completed',
    published: true,
    notes: 'Highlights video for Sunday event. Client: Tejasvi Surya.',
  },

  // 8. Kalanath Video Subtitles — Yashas (P001) — Jul 21
  {
    person_id: YASHAS,
    task_name: 'Kalanath Video Subtitles',
    content_type: 'Video',
    format: 'Long-form',
    effort: 'Medium',
    priority: 'Normal',
    request_source: 'Client',
    added_at: dt('2026-07-21', '09:00'),
    started_at: dt('2026-07-21', '09:00'),
    deadline: dt('2026-07-21', '18:00'),
    completed_at: dt('2026-07-21', '18:00'),
    status: 'Completed',
    published: true,
    notes: 'Added subtitles to video made by Kalanath. Client: Tejasvi Surya.',
  },
]

export async function POST() {
  const { role } = await getAppSession()
  if (!isAdmin(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const results: { task_name: string; person_id: string; status: 'created' }[] = []

    for (const task of RAW_TASKS) {
      await createTask(task)
      results.push({ task_name: task.task_name, person_id: task.person_id, status: 'created' })
    }

    return NextResponse.json({ data: { created: results.length, results } })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
