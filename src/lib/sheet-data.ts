import "server-only";
import { createAdminClient } from "@/lib/supabase/server";
import { SHEET_COLUMNS, type Sheet } from "@/lib/quote-sheet";
import type { SheetClient } from "@/lib/sheet-pdf";

type QuoteContact = {
  name: string;
  email: string;
  phone: string;
  address: string;
  address_details: string;
  municipality: string;
  profiles: { full_name: string; email: string; phone: string } | null;
};

export function clientFromQuote(q: QuoteContact): SheetClient {
  const p = q.profiles;
  const address = [q.address || q.municipality, q.address_details].filter(Boolean).join(" — ");
  return { name: p?.full_name || q.name, email: q.email || p?.email || "", phone: q.phone || p?.phone || "", address, nif: "" };
}

// Lê a folha e os dados do cliente com a chave de servidor. Só chamar depois de validar
// o acesso: administrador (painel) ou token privado de uma folha já enviada (link do cliente).
export async function loadSheet(by: { id: string } | { token: string }) {
  const db = createAdminClient();
  const query = db.from("quote_sheets").select(`${SHEET_COLUMNS}, quote_requests(name, email, phone, address, address_details, municipality, profiles!quote_requests_user_id_fkey(full_name, email, phone))`);
  const { data } = await ("id" in by ? query.eq("id", by.id) : query.eq("token", by.token)).maybeSingle();
  if (!data) return null;
  const { quote_requests: q, ...sheet } = data as unknown as Sheet & { quote_requests: QuoteContact };
  // Os dados escritos na folha prevalecem; folhas antigas sem eles usam os do pedido.
  const fromQuote = clientFromQuote(q);
  const client: SheetClient = {
    name: sheet.client_name || fromQuote.name,
    address: sheet.client_address || fromQuote.address,
    phone: sheet.client_phone || fromQuote.phone,
    email: fromQuote.email,
    nif: sheet.client_nif,
  };
  return { sheet: sheet as Sheet, client };
}
