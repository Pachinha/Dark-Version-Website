import LegalPage from "@/components/LegalPage";
import { getI18n, pageMetadata } from "@/lib/i18n/server";
import { LEGAL } from "@/content/legal";

export const generateMetadata = () => pageMetadata((t) => t.legal.cookies);

export default async function Page() {
  const { t } = await getI18n();
  return <LegalPage title={t.legal.cookies} texts={LEGAL.cookies} />;
}
