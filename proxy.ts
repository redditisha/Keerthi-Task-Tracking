// Minimal proxy — all auth/role checks happen in page components and API handlers.
// Public read access is the default; writes require an admin session enforced per-handler.
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
