import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteSheet, sendSheet } from "@/app/actions/sheets";
import ConfirmedForm from "@/components/admin/ConfirmedForm";
import SheetEditor, { type SheetInitial } from "@/components/admin/SheetEditor";
import { requireAdmin } from "@/lib/auth";
import { formatDate, one, quoteRef } from "@/lib/labels";
import { panel } from "@/lib/panel";
import { SHEET_COLUMNS, euro, sheetKind, sheetNumber, sheetTotals, type Sheet } from "@/lib/quote-sheet";
import { clientFromQuote } from "@/lib/sheet-data";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Folha de orçamento — Painel", robots: { index: false, follow: false } };

// /orcamentos/<pedido>/folha/nova            → folha nova (?de=<folha> copia outra, p. ex. para uma nova versão)
// /orcamentos/<pedido>/folha/<folha>         → rascunho (editar, PDF, enviar) ou folha enviada (só consulta)
export default async function SheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; sheet: string }>;
  searchParams: Promise<{ de?: string }>;
}) {
  await requireAdmin();
  const { id, sheet: sheetId } = await params;
  const { de } = await searchParams;
  const supabase = await createClient();

  const { data: q } = await supabase
    .from("quote_requests")
    .select("id, ref, category, name, email, phone, address, address_details, municipality, profiles!quote_requests_user_id_fkey(full_name, email, phone)")
    .eq("id", id)
    .maybeSingle();
  if (!q) notFound();
  const fromQuote = clientFromQuote({ ...q, profiles: one(q.profiles) as { full_name: string; email: string; phone: string } | null });
  const clientName = fromQuote.name;

  const isNew = sheetId === "nova";
  const sourceId = isNew ? de : sheetId;
  const { data: sheet } = sourceId
    ? await supabase.from("quote_sheets").select(SHEET_COLUMNS).eq("id", sourceId).eq("quote_id", id).maybeSingle<Sheet>()
    : { data: null };
  if (!isNew && !sheet) notFound();

  const back = panel(`/orcamentos/${id}`);
  const pdf = sheet ? panel(`/orcamentos/${id}/folha/${sheet.id}/pdf`) : "";
  const title = isNew
    ? sheet ? `Nova versão (a partir do n.º ${sheetNumber(sheet.number)})` : "Nova folha de orçamento"
    : `${sheetKind(sheet!)} n.º ${sheetNumber(sheet!.number)}`;

  // Folha nova: cliente, morada e telefone vêm do pedido (podem ser alterados na folha).
  const initial: SheetInitial = sheet
    ? {
        items: sheet.items, vat_rate: sheet.vat_rate, discount_pct: sheet.discount_pct, payment_terms: sheet.payment_terms, notes: sheet.notes,
        is_quote: sheet.is_quote, is_order: sheet.is_order, delivery: sheet.delivery,
        client_name: sheet.client_name || fromQuote.name, client_address: sheet.client_address || fromQuote.address,
        client_phone: sheet.client_phone || fromQuote.phone, client_nif: sheet.client_nif,
      }
    : {
        items: [], vat_rate: 23, discount_pct: 0, payment_terms: "", notes: "", is_quote: true, is_order: false, delivery: "",
        client_name: fromQuote.name, client_address: fromQuote.address, client_phone: fromQuote.phone, client_nif: "",
      };

  return (
    <>
      <p style={{ margin: "0 0 12px" }}>
        <Link href={back} className="tab">← Voltar ao pedido</Link>
      </p>
      <section className="panel">
        <span className="eyebrow">{quoteRef(q.ref)} · {q.category} · {clientName}</span>
        <h2 style={{ marginTop: 4 }}>{title}</h2>

        {!isNew && sheet!.sent_at ? (
          <>
            <p className="info-box" style={{ marginTop: 0 }}>
              Enviado ao cliente a {formatDate(sheet!.sent_at, true)} · Total <strong>{euro(sheetTotals(sheet!).total)}</strong>.
              Um orçamento enviado já não se altera — para mudar valores, crie uma nova versão.
            </p>
            <div className="row">
              <a className="btn btn-ink" href={pdf} target="_blank" rel="noreferrer">Ver PDF</a>
              <Link className="btn btn-ghost" href={panel(`/orcamentos/${id}/folha/nova?de=${sheet!.id}`)}>Criar nova versão</Link>
            </div>
            <h3 style={{ fontSize: 15, margin: "24px 0 8px" }}>Reenviar ao cliente</h3>
            <ConfirmedForm action={sendSheet} labels={{}} mode="create" submitLabel="Reenviar orçamento" confirmTitle={`Reenviar o documento n.º ${sheetNumber(sheet!.number)} ao cliente?`}>
              <input type="hidden" name="sheet_id" value={sheet!.id} />
            </ConfirmedForm>
          </>
        ) : (
          <>
            <SheetEditor
              quoteId={id}
              sheetId={isNew ? undefined : sheet!.id}
              initial={initial}
            />
            {!isNew && (
              <>
                <h3 style={{ fontSize: 15, margin: "28px 0 8px" }}>Enviar ao cliente</h3>
                <p className="muted" style={{ marginTop: 0 }}>
                  Guarde primeiro as alterações. Depois de enviado, o pedido fica em “aguarda confirmação” e o orçamento já não se altera.
                </p>
                <div className="row" style={{ marginBottom: 12 }}>
                  <a className="btn btn-ghost" href={pdf} target="_blank" rel="noreferrer">Pré-visualizar PDF</a>
                </div>
                <ConfirmedForm action={sendSheet} labels={{}} mode="create" submitLabel="Enviar orçamento ao cliente" confirmTitle={`Enviar o documento n.º ${sheetNumber(sheet!.number)} ao cliente?`}>
                  <input type="hidden" name="sheet_id" value={sheet!.id} />
                </ConfirmedForm>
                <h3 style={{ fontSize: 15, margin: "28px 0 8px" }}>Apagar rascunho</h3>
                <ConfirmedForm action={deleteSheet} labels={{}} mode="create" danger submitLabel="Apagar rascunho" confirmTitle="Apagar este rascunho de orçamento?">
                  <input type="hidden" name="sheet_id" value={sheet!.id} />
                  <input type="hidden" name="quote_id" value={id} />
                </ConfirmedForm>
              </>
            )}
          </>
        )}
      </section>
    </>
  );
}
