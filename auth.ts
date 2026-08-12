import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { AppRole } from '@/types'

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
        // Fresh sign-in — resolve role from email.
        // Dynamic import keeps googleapis/fs/path out of the Edge-traced bundle.
        try {
          const { resolveRole } = await import('@/lib/auth/roles')
          token.app_role = await resolveRole(token.email)
        } catch {
          // Fall back — super admin check by env var alone
          const superAdmin = process.env.SUPER_ADMIN_EMAIL?.toLowerCase()
          token.app_role = (superAdmin && token.email?.toLowerCase() === superAdmin)
            ? 'super_admin'
            : 'viewer'
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { app_role?: AppRole }).app_role = token.app_role as AppRole
      }
      return session
    },
  },
})
