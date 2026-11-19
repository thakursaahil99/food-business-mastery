import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "rb_session";

/**
 * Optimistic auth gate only (cookie presence). Role checks happen in the data layer
 * (requireUser / requireRole) and, ultimately, in the Laravel API.
 */
export function proxy(req: NextRequest) {
  const hasSession = req.cookies.has(SESSION_COOKIE);
  const { pathname, search } = req.nextUrl;
  const redirectTo = (login: string) => {
    const url = new URL(login, req.url);
    url.searchParams.set("redirect", pathname + search);
    return NextResponse.redirect(url);
  };

  if (pathname.startsWith("/student") && !hasSession) return redirectTo("/login");
  if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !hasSession) return redirectTo("/admin/login");

  if ((pathname === "/login" || pathname === "/register") && hasSession) {
    const to = req.nextUrl.searchParams.get("redirect");
    const safe = to && to.startsWith("/") && !to.startsWith("//") ? to : "/student";
    return NextResponse.redirect(new URL(safe, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/admin/:path*", "/admin", "/login", "/register"],
};
