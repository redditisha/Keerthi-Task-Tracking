import type { Metadata } from 'next'
import './globals.css'
import { auth } from '@/auth'
import Nav from '@/components/layout/Nav'
import SessionProvider from '@/components/layout/SessionProvider'

export const metadata: Metadata = {
  title: 'Content Ops Tracker',
  description: 'Internal content operations and tracking tool',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SessionProvider session={session}>
          <Nav session={session} />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">{children}</main>
        </SessionProvider>
      </body>
    </html>
  )
}
