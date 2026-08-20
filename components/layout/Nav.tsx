'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Session } from 'next-auth'
import { signIn, signOut } from 'next-auth/react'
import { AppRole, UserRole } from '@/types'

export default function Nav({ session }: { session: Session | null }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

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

  const links = [
    { href: '/', label: 'Dashboard', show: true },
    { href: '/tasks', label: 'Tasks', show: !isViewer },
    { href: '/past-work', label: 'Past Work', show: !isViewer },
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

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* ── Desktop ───────────────────────────────────────────────────── */}
        <div className="hidden md:flex items-center justify-between h-14">
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
                    isActive(l.href)
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

        {/* ── Mobile ────────────────────────────────────────────────────── */}
        <div className="flex md:hidden items-center justify-between h-12">
          <span className="font-semibold text-gray-900 text-sm tracking-tight">
            Content Ops
          </span>

          <div className="flex items-center gap-2">
            {canEdit && (
              <Link
                href="/tasks/new"
                className="bg-blue-600 text-white text-xs font-medium px-2.5 py-1.5 rounded hover:bg-blue-700 transition-colors"
              >
                + Task
              </Link>
            )}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 rounded text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Menu"
            >
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="4" x2="16" y2="16" />
                  <line x1="16" y1="4" x2="4" y2="16" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="17" y2="6" />
                  <line x1="3" y1="10" x2="17" y2="10" />
                  <line x1="3" y1="14" x2="17" y2="14" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile dropdown menu ─────────────────────────────────────── */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white shadow-md">
          <nav className="px-4 py-3 space-y-1">
            {links.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(l.href)
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* User info + sign out */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            {session ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 font-medium">
                    {session.user?.name?.split(' ')[0]}
                  </span>
                  {roleBadge[role] && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {roleBadge[role]}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => signOut()}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="w-full text-sm text-center text-gray-600 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
