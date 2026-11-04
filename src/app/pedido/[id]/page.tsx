import Link from "next/link";
import { notFound } from "next/navigation";
import Shell from "@/components/account/Shell";
import PrintButton from "@/components/quote/PrintButton";
import QuoteReceipt, { RECEIPT_COLUMNS, type ReceiptQuote } from "@/components/quote/QuoteReceipt";
import { createAdminClient } from "@/lib/supabase/server";
import { quoteRef } from "@/lib/labels";
import { companyWhatsappUrl } from "@/lib/notify";
import { fmt } from "@/lib/i18n/config";
import { getI18n, pageMetadata } from "@/lib/i18n/server";

export const generateMetadata = () => pageMetadata((t) => t.receipt.meta, { robots: { index: false, follow: false } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Comprovativo público do pedido. O endereço contém o identificador aleatório do pedido
// (impossível de adivinhar) e só é enviado ao próprio cliente. Não mostra telefone nem morada.
export default async function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const { t, href } = await getI18n();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { data: q } = await createAdminClient()
    .from("quote_requests")
    .select(RECEIPT_COLUMNS)
    .eq("id", id)
    .maybeSingle<ReceiptQuote>();
  if (!q) notFound();

  const whatsapp = companyWhatsappUrl(fmt(t.receipt.whatsappText, { ref: quoteRef(q.ref) }));

  // Versão do cliente: botões do site. A equipa tem a sua própria versão dentro do painel.
  return (
    <Shell languages>
      <div className="receipt" style={{ maxWidth: 680, margin: "0 auto" }}>
        <QuoteReceipt
          q={q}
          actions={
            <>
              <PrintButton />
              {whatsapp && (
                <a className="btn btn-whatsapp btn-sm" href={whatsapp} target="_blank" rel="noreferrer">
                  {t.receipt.whatsapp}
                </a>
              )}
              <Link className="btn btn-ghost btn-sm" href={href("/")}>{t.receipt.backToSite}</Link>
            </>
          }
        />
      </div>
    </Shell>
  );
}
