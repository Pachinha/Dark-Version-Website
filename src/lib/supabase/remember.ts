import type { CookieOptions } from "@supabase/ssr";

// "Manter sessão iniciada neste dispositivo". When unticked at login we store
// pachinha_remember=0 and write the auth cookies without an expiry, so the
// browser forgets the session when it is closed. Otherwise they last 400 days.
export const REMEMBER_COOKIE = "pachinha_remember";

export function sessionCookieOptions(options: CookieOptions, remember: boolean): CookieOptions {
  if (remember || options.maxAge === 0) return options; // maxAge 0 = deleting a cookie
  const { maxAge: _maxAge, expires: _expires, ...rest } = options;
  return rest;
}
