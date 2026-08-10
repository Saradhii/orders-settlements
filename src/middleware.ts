import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next();

  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/orders/:path*"],
};
