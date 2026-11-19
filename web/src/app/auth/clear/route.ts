import { NextResponse, type NextRequest } from "next/server";

/** Drops a stale/invalid session cookie, then continues to the login page (avoids redirect loops). */
export function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to");
  const safe = to === "/admin/login" ? "/admin/login" : "/login";
  const res = NextResponse.redirect(new URL(safe, req.url));
  res.cookies.delete("rb_session");
  return res;
}
