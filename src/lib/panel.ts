import "server-only";

// The staff panel lives at a secret address set in .env.local (PANEL_SLUG),
// so it never appears in the code, the git history or the browser bundles
// served to clients. Without PANEL_SLUG the panel is switched off.
export const PANEL_SLUG = process.env.PANEL_SLUG ?? "";

export function panel(path = "") {
  return `/${PANEL_SLUG}${path}`;
}
