import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { REMEMBER_COOKIE, sessionCookieOptions } from "@/lib/supabase/remember";

// Refreshes the Supabase session cookie and performs optimistic redirects.
// The real authorization checks (role, two-step verification) happen in
// src/lib/auth.ts and again in the database (RLS).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  const slug = process.env.PANEL_SLUG;
  const isPanel = Boolean(slug) && (pathname === `/${slug}` || pathname.startsWith(`/${slug}/`));
  const isAccount = pathname.startsWith("/conta");

  // Public pages for visitors without a session: nothing to do.
  if (!hasSession && !isPanel && !isAccount) return NextResponse.next();

  let response = NextResponse.next({ request });
  const remember = request.cookies.get(REMEMBER_COOKIE)?.value !== "0";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, sessionCookieOptions(options, remember)),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  const redirectTo = (path: string, next?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = next ? `?next=${encodeURIComponent(next)}` : "";
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c)); // keep refreshed session
    return res;
  };

  if (isAccount && !isLoggedIn) return redirectTo("/entrar", pathname);
  if (isPanel && !isLoggedIn && pathname !== `/${slug}/entrar`) return redirectTo(`/${slug}/entrar`);
  if ((pathname === "/entrar" || pathname === "/registar") && isLoggedIn) return redirectTo("/conta");

  return response;
}

export const config = {
  matcher: [
    // Everything except static files and images
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
