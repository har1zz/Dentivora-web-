import { NextResponse, type NextRequest } from "next/server";

// First line of defence only: keep unauthenticated visitors out of /admin early.
// Real authorisation happens server-side in requireAdmin() on every admin page and action.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const hasSession = req.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
    if (!hasSession) return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  const res = NextResponse.next();
  if (pathname.startsWith("/admin")) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = { matcher: ["/admin/:path*"] };
