import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { REMEMBER_COOKIE, sessionCookieOptions } from "@/lib/supabase/remember";
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, LOCALE_HEADER, isPortugueseOnly, splitLocale, type Locale } from "@/lib/i18n/config";

// Língua preferida do browser (Accept-Language), entre as que o site tem.
function browserLocale(request: NextRequest): Locale {
  const prefs = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return (prefs.find((p) => LOCALES.includes(p.lang as Locale))?.lang as Locale) ?? DEFAULT_LOCALE;
}

// Refreshes the Supabase session cookie and performs optimistic redirects.
// The real authorization checks (role, two-step verification) happen in
// src/lib/auth.ts and again in the database (RLS).
export async function proxy(request: NextRequest) {
  // Línguas: /en/sobre é servido pela página /sobre, com a língua no cabeçalho LOCALE_HEADER.
  const { locale, path: pathname } = splitLocale(request.nextUrl.pathname);
  const toPath = (path: string) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    return url;
  };
  // /pt/… e páginas que só existem em português (/en/conta) seguem para o endereço em português.
  if (request.nextUrl.pathname === "/pt" || request.nextUrl.pathname.startsWith("/pt/")) {
    return NextResponse.redirect(toPath(request.nextUrl.pathname.slice(3) || "/"));
  }
  if (locale !== DEFAULT_LOCALE && isPortugueseOnly(pathname, process.env.PANEL_SLUG)) return NextResponse.redirect(toPath(pathname));
  // Primeira visita à página inicial: abre na língua do browser (depois manda a escolha no dropdown).
  if (request.nextUrl.pathname === "/" && !request.cookies.has(LOCALE_COOKIE)) {
    const preferred = browserLocale(request);
    if (preferred !== DEFAULT_LOCALE) return NextResponse.redirect(toPath(`/${preferred}`));
  }
  // Lido no momento de responder, para levar também os cookies de sessão atualizados.
  const pass = () => {
    const headers = new Headers(request.headers);
    headers.set(LOCALE_HEADER, locale);
    return locale === DEFAULT_LOCALE
      ? NextResponse.next({ request: { headers } })
      : NextResponse.rewrite(toPath(pathname), { request: { headers } });
  };

  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  const slug = process.env.PANEL_SLUG;
  const isPanel = Boolean(slug) && (pathname === `/${slug}` || pathname.startsWith(`/${slug}/`));
  const isAccount = pathname.startsWith("/conta");

  // Public pages for visitors without a session: nothing to do.
  if (!hasSession && !isPanel && !isAccount) return pass();

  let response = pass();
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
          response = pass();
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
