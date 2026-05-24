import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? ""

async function refreshBackendTokens(refreshToken: string) {
  const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) return null
  return res.json() as Promise<{ accessToken: string; refreshToken: string }>
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const res = await fetch(`${API_URL}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        })

        if (!res.ok) return null

        const { user, accessToken, refreshToken } = await res.json()

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          accessToken,
          refreshToken,
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign-in — store tokens and expiry
      if (user) {
        token.id = user.id
        token.accessToken = (user as any).accessToken
        token.refreshToken = (user as any).refreshToken
        token.accessTokenExpires = Date.now() + 14 * 60 * 1000 // 14 min (1 min before 15m expiry)
      }

      if (account?.provider === "google") {
        const res = await fetch(`${API_URL}/api/v1/auth/oauth`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": INTERNAL_SECRET,
          },
          body: JSON.stringify({
            email: token.email,
            name: token.name,
          }),
        })

        if (res.ok) {
          const { user: apiUser, accessToken, refreshToken } = await res.json()
          token.id = apiUser.id
          token.accessToken = accessToken
          token.refreshToken = refreshToken
          token.accessTokenExpires = Date.now() + 14 * 60 * 1000
        }
      }

      // Access token still valid
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token
      }

      // Access token expired — use refresh token to get new ones
      const refreshed = await refreshBackendTokens(token.refreshToken as string)
      if (!refreshed) {
        return { ...token, error: "RefreshAccessTokenError" }
      }

      return {
        ...token,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        accessTokenExpires: Date.now() + 14 * 60 * 1000,
        error: undefined,
      }
    },

    async session({ session, token }) {
      session.user.id = token.id as string
      session.accessToken = token.accessToken as string
      if (token.error) {
        (session as any).error = token.error
      }

      return session
    },
  },

  pages: {
    signIn: "/login",
  },
}
