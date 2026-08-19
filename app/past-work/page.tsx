import { redirect } from 'next/navigation'
import { getAppSession } from '@/lib/auth/session'
import PastWorkClient from '@/components/past-work/PastWorkClient'

export default async function PastWorkPage() {
  const { role } = await getAppSession()
  if (role === 'viewer') redirect('/')
  return <PastWorkClient />
}
