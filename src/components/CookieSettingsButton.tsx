"use client";

import { OPEN_COOKIE_SETTINGS } from "./CookieConsent";

export default function CookieSettingsButton({ style }: { style?: React.CSSProperties }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))}
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", font: "inherit", ...style }}
    >
      Definições de cookies
    </button>
  );
}
