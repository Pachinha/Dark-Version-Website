import Link from "next/link";
import { notFound } from "next/navigation";
import PrintButton from "@/components/quote/PrintButton";
import QuoteReceipt, { RECEIPT_COLUMNS, type ReceiptQuote } from "@/components/quote/QuoteReceipt";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { panel } from "@/lib/panel";

export const metadata = { title: "Comprovativo do pedido — Painel", robots: { index: false, follow: false } };

// O comprovativo tal como o cliente o vê, mas dentro do painel: os botões levam de volta
// ao pedido no backoffice (e não ao site).
export default async function PanelReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: q } = await supabase.from("quote_requests").select(RECEIPT_COLUMNS).eq("id", id).maybeSingle<ReceiptQuote>();
  if (!q) notFound();

  return (
    <div className="receipt" style={{ maxWidth: 680 }}>
      <p className="no-print" style={{ margin: "0 0 12px" }}>
        <Link href={panel(`/orcamentos/${id}`)} className="tab">← Voltar ao pedido</Link>
      </p>
      <p className="hint no-print" style={{ margin: "0 0 12px" }}>
        Pré-visualização do comprovativo que o cliente recebe.
      </p>
      <QuoteReceipt
        q={q}
        actions={
          <>
            <PrintButton />
            <Link className="btn btn-ghost btn-sm" href={panel(`/orcamentos/${id}`)}>← Voltar ao pedido</Link>
          </>
        }
      />
    </div>
  );
}
