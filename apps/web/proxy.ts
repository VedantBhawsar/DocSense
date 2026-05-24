import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const isAuthPage =
      pathname.startsWith("/login") ||
      pathname.startsWith("/signup")

    if (req.nextauth.token && isAuthPage) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl
        const isAuthPage =
          pathname.startsWith("/login") ||
          pathname.startsWith("/signup") || pathname.startsWith("/reset-password") || pathname.startsWith("/forgot-password")
        const isPublicPage = pathname.startsWith("/share") || pathname.startsWith("/") 

        if (isAuthPage || isPublicPage) return true
        return !!token
      },
    },
    pages: {
      signIn: "/login",
    },
  }
)

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
