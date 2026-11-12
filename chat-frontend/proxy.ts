import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route protection is enforced client-side (AuthGuard + silent refresh),
// because the access token lives in memory and refresh is httpOnly.
// This proxy only redirects the root to /chat when a session cookie exists.
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname === "/") {
    const hasRefresh = req.cookies.has("refresh_token");
    const url = req.nextUrl.clone();
    url.pathname = hasRefresh ? "/chat" : "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/chat/:path*", "/login"],
};
