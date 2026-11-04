import type { Metadata } from "next";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";
import { I18nProvider } from "@/lib/i18n/client";
import { LOCALE_TAGS } from "@/lib/i18n/config";
import { clientDict } from "@/lib/i18n/dict";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.siteTitle, description: t.meta.siteDescription };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getI18n();
  return (
    <html lang={LOCALE_TAGS[locale]}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Archivo+Expanded:wght@600;700;800&family=Great+Vibes&family=Bree+Serif&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <I18nProvider locale={locale} t={clientDict(t)}>
          {children}
          <CookieConsent />
        </I18nProvider>
      </body>
    </html>
  );
}
