"use client";

import Script from "next/script";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useI18n } from "@/lib/i18n/client";

// Consent is stored in a first-party cookie (strictly necessary — it remembers the choice).
// Google Analytics is NOT loaded at all until the visitor accepts.
const COOKIE = "pachinha_consent";
const VERSION = "1";
const MAX_AGE = 60 * 60 * 24 * 180; // 6 meses — depois voltamos a perguntar
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const OPEN_COOKIE_SETTINGS = "pachinha:open-cookie-settings";
const CHOICE_CHANGED = "pachinha:consent-changed";

type Choice = "granted" | "denied" | null;

function readChoice(): Choice {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
  if (!match) return null;
  const [version, analytics] = decodeURIComponent(match[1]).split(":");
  if (version !== VERSION) return null;
  return analytics === "1" ? "granted" : "denied";
}

function saveChoice(choice: Exclude<Choice, null>) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=${VERSION}:${choice === "granted" ? 1 : 0}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(CHOICE_CHANGED));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHOICE_CHANGED, onChange);
  return () => window.removeEventListener(CHOICE_CHANGED, onChange);
}

// Removes the Google Analytics cookies (_ga, _ga_XXXX) after consent is withdrawn.
function clearAnalyticsCookies() {
  const host = location.hostname;
  const domains = ["", host, `.${host}`, `.${host.split(".").slice(-2).join(".")}`];
  document.cookie.split("; ").forEach((c) => {
    const name = c.split("=")[0];
    if (name === "_ga" || name.startsWith("_ga_") || name === "_gid") {
      domains.forEach((d) => {
        document.cookie = `${name}=; Max-Age=0; Path=/${d ? `; Domain=${d}` : ""}`;
      });
    }
  });
}

export default function CookieConsent() {
  const { t, href } = useI18n();
  // "pending" on the server and during hydration, so nothing flashes or mismatches.
  const choice = useSyncExternalStore<Choice | "pending">(subscribe, readChoice, () => "pending");
  const [reopened, setReopened] = useState(false);
  const open = reopened || choice === null;

  useEffect(() => {
    const reopen = () => setReopened(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS, reopen);
  }, []);

  function decide(next: Exclude<Choice, null>) {
    const wasGranted = choice === "granted";
    saveChoice(next);
    setReopened(false);
    if (wasGranted && next === "denied") {
      clearAnalyticsCookies();
      location.reload(); // unload the already-running GA script
    }
  }

  return (
    <>
      {choice === "granted" && GA_ID && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
          </Script>
        </>
      )}

      {open && (
        <div className="cookie-banner" role="dialog" aria-modal="false" aria-labelledby="cookie-title">
          <h2 id="cookie-title">🍪 {t.cookies.title}</h2>
          <p className="muted" style={{ margin: 0 }}>
            {t.cookies.text}{" "}
            <a href={href("/cookies")} className="link" style={{ color: "#bf5b2d", fontWeight: 600 }}>{t.cookies.learnMore}</a>
          </p>
          {/* Recusar e aceitar com o mesmo destaque, como exige a CNPD */}
          <div className="cookie-actions">
            <button className="btn btn-ink" onClick={() => decide("denied")}>{t.cookies.decline}</button>
            <button className="btn btn-ink" onClick={() => decide("granted")}>{t.cookies.accept}</button>
          </div>
        </div>
      )}
    </>
  );
}
