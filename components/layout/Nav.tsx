'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Session } from 'next-auth'
import { signIn, signOut } from 'next-auth/react'
import { AppRole, UserRole } from '@/types'

export default function Nav({ session }: { session: Session | null }) {
  const pathname = usePathname()
  const user = session?.user as {
    app_role?: AppRole
    person_id?: string
    person_role?: UserRole
    name?: string
  } | undefined

  const role = user?.app_role ?? 'viewer'
  const person_id = user?.person_id
  const canEdit = role === 'admin' || role === 'super_admin'
  const isViewer = role === 'viewer'
  const isMember = role === 'member'

  // Build nav links based on role
  const links = [
    { href: '/', label: 'Dashboard', show: true },
    { href: '/tasks', label: 'Tasks', show: !isViewer },
    { href: '/past-work', label: 'Past Work', show: !isViewer },
    // Members go directly to their own profile; admins go to team list
    {
      href: isMember && person_id ? `/team/${person_id}` : '/team',
      label: 'My Profile',
      show: isMember,
    },
    { href: '/team', label: 'Team', show: canEdit },
    { href: '/admin', label: 'Admin', show: canEdit },
  ].filter((l) => l.show)

  const roleBadge: Partial<Record<AppRole, string>> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    member: user?.person_role ?? 'Member',
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <span className="font-semibold text-gray-900 text-sm tracking-tight">
              Content Ops
            </span>
            <nav className="flex gap-1">
              {links.map((l) => (
                <Link
                  key={l.href + l.label}
                  href={l.href}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    pathname === l.href || pathname.startsWith(l.href + '/')
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

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
                  {roleBadge[role] && (
                    <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {roleBadge[role]}
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
