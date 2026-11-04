"use client";

import { OPEN_COOKIE_SETTINGS } from "./CookieConsent";
import { useI18n } from "@/lib/i18n/client";

export default function CookieSettingsButton({ style }: { style?: React.CSSProperties }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))}
      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", font: "inherit", ...style }}
    >
      {t.cookies.settings}
    </button>
  );
}
