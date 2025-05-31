import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const userId = request.cookies.get("userId")?.value

  // Protected routes that require authentication
  const protectedRoutes = ["/budget", "/alternatives", "/checkout"]

  // Check if the requested path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // If it's a protected route and the user is not logged in, redirect to login
  if (isProtectedRoute && !userId) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If user is logged in and trying to access login/signup, redirect to budget
  if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup") && userId) {
    return NextResponse.redirect(new URL("/budget", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/budget/:path*", "/alternatives/:path*", "/checkout/:path*", "/login", "/signup"],
}
