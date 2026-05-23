import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"
const INTERNAL_SECRET = process.env.INTERNAL_SECRET ?? ""

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

        const { user, accessToken } = await res.json()

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          accessToken,
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
      if (user) {
        token.id = user.id
        token.accessToken = (user as any).accessToken
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
          const { user: apiUser, accessToken } = await res.json()
          token.id = apiUser.id
          token.accessToken = accessToken
        }
      }

      return token
    },

    async session({ session, token }) {
      session.user.id = token.id as string
      session.accessToken = token.accessToken as string

      return session
    },
  },

  pages: {
    signIn: "/login",
  },
}
