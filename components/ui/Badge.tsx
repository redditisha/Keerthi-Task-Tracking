import { TaskStatus, Priority, Effort, DeadlinePerformance } from '@/types'

type Variant = 'default' | 'urgent' | 'success' | 'warning' | 'danger' | 'muted'

const variantClass: Record<Variant, string> = {
  default: 'bg-gray-100 text-gray-700',
  urgent: 'bg-red-100 text-red-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  muted: 'bg-gray-100 text-gray-500',
}

export function Badge({ label, variant = 'default' }: { label: string; variant?: Variant }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variantClass[variant]}`}>
      {label}
    </span>
  )
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, Variant> = {
    'Not Started': 'muted',
    'Started': 'default',
    'In Progress': 'warning',
    'Completed': 'success',
    'On Hold / Blocked': 'danger',
  }
  return <Badge label={status} variant={map[status]} />
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge label={priority} variant={priority === 'Urgent' ? 'urgent' : 'muted'} />
}

export function EffortBadge({ effort }: { effort: Effort }) {
  const map: Record<Effort, Variant> = { Low: 'success', Medium: 'warning', High: 'danger' }
  return <Badge label={effort} variant={map[effort]} />
}

export function DeadlineBadge({ performance }: { performance: DeadlinePerformance | null }) {
  if (!performance) return null
  const map: Record<DeadlinePerformance, Variant> = {
    'On time': 'success',
    'Late': 'danger',
    'Not yet due': 'muted',
    'Overdue': 'urgent',
  }
  return <Badge label={performance} variant={map[performance]} />
}
