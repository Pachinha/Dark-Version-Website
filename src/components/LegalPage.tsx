import Shell from "@/components/account/Shell";
import { PRIVACY_VERSION } from "@/lib/legal";
import { formatDate } from "@/lib/labels";
import { LOCALE_TAGS, fmt, type Locale } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

// Textos legais escritos à parte por língua (src/content/legal); o português é o original.
export type LegalTexts = Record<Locale, () => React.ReactNode>;

export default async function LegalPage({ title, texts }: { title: string; texts: LegalTexts }) {
  const { locale, t } = await getI18n();
  return (
    <Shell languages>
      <article className="panel legal" style={{ margin: "0 auto" }}>
        <span className="eyebrow">{t.legal.eyebrow}</span>
        <h1 className="page-title">{title}</h1>
        <p className="muted">{fmt(t.legal.updated, { date: formatDate(PRIVACY_VERSION, false, LOCALE_TAGS[locale]) })}</p>
        {t.legal.translationNote && <p className="info-box">{t.legal.translationNote}</p>}
        {texts[locale]()}
      </article>
    </Shell>
  );
}
