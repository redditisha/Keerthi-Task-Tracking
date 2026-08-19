import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { AppRole, UserRole } from '@/types'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        // Fresh sign-in — resolve role (dynamic import keeps sheets out of Edge bundle)
        try {
          const { resolveRole } = await import('@/lib/auth/roles')
          const result = await resolveRole(token.email)
          token.app_role = result.role
          token.person_id = result.person_id
          token.person_role = result.person_role
        } catch {
          // Fallback: check super admin by env var alone
          const superAdmin = process.env.SUPER_ADMIN_EMAIL?.toLowerCase()
          token.app_role = superAdmin && token.email?.toLowerCase() === superAdmin
            ? 'super_admin'
            : 'viewer'
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as {
          app_role?: AppRole
          person_id?: string
          person_role?: UserRole
        }
        u.app_role = token.app_role as AppRole
        u.person_id = token.person_id as string | undefined
        u.person_role = token.person_role as UserRole | undefined
      }
      return session
    },
  },
})
