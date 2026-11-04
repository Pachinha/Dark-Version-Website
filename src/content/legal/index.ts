import type { LegalTexts } from "@/components/LegalPage";
import PrivacyPt from "./privacy.pt";
import PrivacyEn from "./privacy.en";
import PrivacyEs from "./privacy.es";
import PrivacyFr from "./privacy.fr";
import PrivacyDe from "./privacy.de";
import TermsPt from "./terms.pt";
import TermsEn from "./terms.en";
import TermsEs from "./terms.es";
import TermsFr from "./terms.fr";
import TermsDe from "./terms.de";
import CookiesPt from "./cookies.pt";
import CookiesEn from "./cookies.en";
import CookiesEs from "./cookies.es";
import CookiesFr from "./cookies.fr";
import CookiesDe from "./cookies.de";

// Textos legais por língua. O português é o original e o que vale juridicamente;
// ao alterar um texto em português, atualizar também as traduções.
export const LEGAL: Record<"privacy" | "terms" | "cookies", LegalTexts> = {
  privacy: { pt: PrivacyPt, en: PrivacyEn, es: PrivacyEs, fr: PrivacyFr, de: PrivacyDe },
  terms: { pt: TermsPt, en: TermsEn, es: TermsEs, fr: TermsFr, de: TermsDe },
  cookies: { pt: CookiesPt, en: CookiesEn, es: CookiesEs, fr: CookiesFr, de: CookiesDe },
};
