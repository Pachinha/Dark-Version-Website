"use client";

import { useActionState, useState } from "react";
import { saveSheet } from "@/app/actions/sheets";
import FormMessage from "@/components/account/FormMessage";
import { euro, lineTotal, sheetTotals, type SheetItem } from "@/lib/quote-sheet";
import PhoneInput from "@/components/PhoneInput";

type Row = { qty: string; qty2: string; description: string; unit_price: string };
const empty = (): Row => ({ qty: "1", qty2: "", description: "", unit_price: "" });
const num = (v: string) => Number(v.replace(",", ".")) || 0;
const str = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n).replace(".", ","));
const toItem = (r: Row): SheetItem => ({
  qty: num(r.qty),
  qty2: r.qty2.trim() ? num(r.qty2) : null,
  description: r.description.trim(),
  unit_price: num(r.unit_price),
});

export type SheetInitial = {
  items: SheetItem[];
  vat_rate: number;
  discount_pct: number;
  payment_terms: string;
  notes: string;
  is_quote: boolean;
  is_order: boolean;
  delivery: string;
  client_name: string;
  client_address: string;
  client_phone: string;
  client_nif: string;
};

// Folha de orçamento / nota de encomenda: os mesmos campos da folha em papel.
export default function SheetEditor({ quoteId, sheetId, initial }: { quoteId: string; sheetId?: string; initial: SheetInitial }) {
  const [rows, setRows] = useState<Row[]>(
    initial.items.length
      ? initial.items.map((i) => ({ qty: str(i.qty), qty2: str(i.qty2), description: i.description, unit_price: str(i.unit_price) }))
      : [empty(), empty(), empty()],
  );
  const [vat, setVat] = useState(str(initial.vat_rate));
  const [discount, setDiscount] = useState(str(initial.discount_pct));
  const [state, action, pending] = useActionState(saveSheet, undefined);

  const items = rows.map(toItem).filter((i) => i.description || i.unit_price);
  const t = sheetTotals({ items, vat_rate: num(vat), discount_pct: num(discount) });
  const update = (i: number, patch: Partial<Row>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <form action={action} className="form">
      <input type="hidden" name="quote_id" value={quoteId} />
      {sheetId && <input type="hidden" name="sheet_id" value={sheetId} />}
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="sheet-doc">
        <fieldset className="sheet-type">
          <legend>Documento</legend>
          <label><input type="checkbox" name="is_quote" defaultChecked={initial.is_quote} /> Orçamento</label>
          <label><input type="checkbox" name="is_order" defaultChecked={initial.is_order} /> Nota encomenda</label>
        </fieldset>
        <label className="field">
          Entrega <span className="hint">Ex.: setembro/outubro</span>
          <input name="delivery" defaultValue={initial.delivery} maxLength={120} />
        </label>
      </div>
      <div className="grid-2">
        <label className="field">
          Cliente
          <input name="client_name" defaultValue={initial.client_name} maxLength={200} required />
        </label>
        <label className="field">
          N.I.F. do cliente <span className="hint">Opcional</span>
          <input name="client_nif" defaultValue={initial.client_nif} maxLength={20} inputMode="numeric" />
        </label>
        <label className="field">
          Morada
          <input name="client_address" defaultValue={initial.client_address} maxLength={300} />
        </label>
        <div className="field">
          Telefone
          <PhoneInput name="client_phone" defaultValue={initial.client_phone} />
        </div>
      </div>

      <div className="sheet-table" role="table" aria-label="Linhas do orçamento">
        <div className="sheet-row sheet-head" role="row">
          <span role="columnheader">Quant.</span>
          <span role="columnheader">Quant.</span>
          <span role="columnheader">Designação</span>
          <span role="columnheader">Preço unit. (s/ IVA)</span>
          <span role="columnheader" className="sheet-num">Importância</span>
          <span />
        </div>
        {rows.map((r, i) => (
          <div className="sheet-row" role="row" key={i}>
            <input aria-label={`Quantidade, linha ${i + 1}`} inputMode="decimal" value={r.qty} onChange={(e) => update(i, { qty: e.target.value })} />
            <input aria-label={`Segunda quantidade (opcional), linha ${i + 1}`} inputMode="decimal" value={r.qty2} placeholder="—" onChange={(e) => update(i, { qty2: e.target.value })} />
            <input aria-label={`Designação, linha ${i + 1}`} value={r.description} maxLength={300} placeholder="Ex.: Recuperador a lenha 12 kW" onChange={(e) => update(i, { description: e.target.value })} />
            <input aria-label={`Preço unitário, linha ${i + 1}`} inputMode="decimal" value={r.unit_price} placeholder="0,00" onChange={(e) => update(i, { unit_price: e.target.value })} />
            <span className="sheet-num">{euro(lineTotal(toItem(r)))}</span>
            <button type="button" className="btn btn-ghost btn-sm" aria-label={`Apagar linha ${i + 1}`} onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((_, j) => j !== i) : [empty()]))}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRows((rs) => [...rs, empty()])} disabled={rows.length >= 60}>
          + Adicionar linha
        </button>
      </div>

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="form">
          <label className="field">
            Condições de pagamento
            <textarea name="payment_terms" defaultValue={initial.payment_terms} maxLength={1000} style={{ minHeight: 70 }} placeholder="Ex.: 50% na adjudicação, 50% na conclusão." />
          </label>
          <label className="field">
            Observações
            <textarea name="notes" defaultValue={initial.notes} maxLength={2000} style={{ minHeight: 70 }} />
          </label>
        </div>
        <dl className="summary sheet-totals">
          <div><dt>Soma</dt><dd>{euro(t.sum)}</dd></div>
          <div>
            <dt><label htmlFor="vat_rate">IVA %</label></dt>
            <dd><input id="vat_rate" name="vat_rate" inputMode="decimal" value={vat} onChange={(e) => setVat(e.target.value)} /> {euro(t.vat)}</dd>
          </div>
          <div><dt>Sub-soma</dt><dd>{euro(t.subtotal)}</dd></div>
          <div>
            <dt><label htmlFor="discount_pct">Desc. %</label></dt>
            <dd><input id="discount_pct" name="discount_pct" inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} /> − {euro(t.discount)}</dd>
          </div>
          <div><dt><strong>Total</strong></dt><dd><strong>{euro(t.total)}</strong></dd></div>
        </dl>
      </div>

      <FormMessage state={state} />
      <div className="row">
        <button className="btn btn-fire" disabled={pending}>{pending ? "A guardar…" : "Guardar folha"}</button>
        <span className="hint">Depois de guardar pode pré-visualizar o PDF e enviá-lo ao cliente.</span>
      </div>
    </form>
  );
}
