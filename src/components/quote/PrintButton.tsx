"use client";

import { useI18n } from "@/lib/i18n/client";

export default function PrintButton() {
  const { t } = useI18n();
  return (
    <button type="button" className="btn btn-ink btn-sm" onClick={() => window.print()}>
      {t.quote.print}
    </button>
  );
}
