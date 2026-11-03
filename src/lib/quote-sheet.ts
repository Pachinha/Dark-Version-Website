// Folha de orçamento: linhas com preços sem IVA, como na folha em papel.
// Soma → IVA → Subtotal (com IVA) → Desconto % → Total. Usado no editor, no PDF e no servidor.

// qty2: a segunda coluna "Quant." da folha em papel (opcional). A importância usa a primeira.
export type SheetItem = { qty: number; qty2?: number | null; description: string; unit_price: number };

export type Sheet = {
  id: string;
  number: number;
  quote_id: string;
  items: SheetItem[];
  vat_rate: number;
  discount_pct: number;
  payment_terms: string;
  notes: string;
  is_quote: boolean; // caixa "Orçamento"
  is_order: boolean; // caixa "Nota encomenda"
  delivery: string; // "Entrega"
  client_name: string;
  client_address: string;
  client_phone: string;
  client_nif: string;
  token: string;
  sent_at: string | null;
  created_at: string;
};

export const SHEET_COLUMNS =
  "id, number, quote_id, items, vat_rate, discount_pct, payment_terms, notes, is_quote, is_order, delivery, client_name, client_address, client_phone, client_nif, token, sent_at, created_at";

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function lineTotal(item: SheetItem) {
  return round2((Number(item.qty) || 0) * (Number(item.unit_price) || 0));
}

export function sheetTotals(sheet: Pick<Sheet, "items" | "vat_rate" | "discount_pct">) {
  const sum = round2(sheet.items.reduce((acc, item) => acc + lineTotal(item), 0));
  const vat = round2((sum * Number(sheet.vat_rate)) / 100);
  const subtotal = round2(sum + vat);
  const discount = round2((subtotal * Number(sheet.discount_pct)) / 100);
  return { sum, vat, subtotal, discount, total: round2(subtotal - discount) };
}

const EUR = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });
export const euro = (n: number) => EUR.format(n);
export const sheetNumber = (n: number) => String(n).padStart(4, "0");
// Nome do documento conforme as caixas assinaladas na folha.
export const sheetKind = (s: Pick<Sheet, "is_quote" | "is_order">) =>
  s.is_quote && s.is_order ? "Orçamento / Nota de encomenda" : s.is_order ? "Nota de encomenda" : "Orçamento";

// Validação do que vem do formulário (o editor envia as linhas em JSON).
export function parseItems(raw: string): SheetItem[] | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(data) || data.length > 60) return null;
  const items: SheetItem[] = [];
  for (const row of data) {
    const description = String(row?.description ?? "").trim().slice(0, 300);
    const qty = Number(row?.qty);
    const qty2 = row?.qty2 === null || row?.qty2 === undefined || row?.qty2 === "" ? null : Number(row.qty2);
    const unit_price = Number(row?.unit_price);
    if (!description && !qty && !unit_price) continue; // linha vazia
    if (!description || !Number.isFinite(qty) || qty <= 0 || qty > 100000) return null;
    if (qty2 !== null && (!Number.isFinite(qty2) || qty2 < 0 || qty2 > 100000)) return null;
    if (!Number.isFinite(unit_price) || unit_price < 0 || unit_price > 10_000_000) return null;
    items.push({ qty: round2(qty), qty2: qty2 === null ? null : round2(qty2), description, unit_price: round2(unit_price) });
  }
  return items;
}
