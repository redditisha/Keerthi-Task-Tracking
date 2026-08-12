'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Session } from 'next-auth'
import { signIn, signOut } from 'next-auth/react'
import { AppRole } from '@/types'

const baseLinks = [
  { href: '/', label: 'Dashboard' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/past-work', label: 'Past Work' },
  { href: '/team', label: 'Team' },
]

export default function Nav({ session }: { session: Session | null }) {
  const pathname = usePathname()
  const role = (session?.user as { app_role?: AppRole })?.app_role ?? 'viewer'
  const canEdit = role === 'admin' || role === 'super_admin'
  const links = role === 'super_admin'
    ? [...baseLinks, { href: '/admin', label: 'Admin' }]
    : baseLinks

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <span className="font-semibold text-gray-900 text-sm tracking-tight">
              Content Ops
            </span>
            {/* Nav links */}
            <nav className="flex gap-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    pathname === l.href
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {canEdit && (
              <Link
                href="/tasks/new"
                className="bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
              >
                + Add Task
              </Link>
            )}
            {session ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {session.user?.name?.split(' ')[0]}
                  {role !== 'viewer' && (
                    <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                  )}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="text-sm text-gray-600 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded hover:bg-gray-50 transition-colors"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
