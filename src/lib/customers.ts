import "server-only";
import { createClient } from "@/lib/supabase/server";

// Leitura das fichas de cliente (supabase/016) para o painel. Só a administração com 2FA as vê (RLS).

export type Customer = {
  id: string;
  user_id: string | null;
  name: string;
  phone: string;
  email: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type Place = { address: string; details: string; lat: number | null; lng: number | null };

export type HistoryItem = {
  kind: "orcamento" | "manutencao" | "obra";
  id: string;
  date: string;
  title: string;
  status: string;
  withAccount: boolean;
};

const COLUMNS = "id, user_id, name, phone, email, notes, created_at, updated_at";

// Aceita o id da ficha ou o id da conta (links antigos do painel apontavam para a conta).
export async function getCustomer(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("customers").select(COLUMNS).or(`id.eq.${id},user_id.eq.${id}`).limit(1).maybeSingle<Customer>();
  return data;
}

// Pedidos, limpezas e obras da ficha (mais recentes primeiro).
export async function customerHistory(customerId: string): Promise<HistoryItem[]> {
  const supabase = await createClient();
  const [q, m, j] = await Promise.all([
    supabase.from("quote_requests").select("id, category, status, created_at, user_id").eq("customer_id", customerId),
    supabase.from("maintenance_requests").select("id, service, status, created_at, user_id").eq("customer_id", customerId),
    supabase.from("jobs").select("id, title, status, scheduled_start, created_at, user_id").eq("customer_id", customerId),
  ]);
  return [
    ...(q.data ?? []).map((r) => ({ kind: "orcamento" as const, id: r.id, date: r.created_at, title: r.category, status: r.status, withAccount: Boolean(r.user_id) })),
    ...(m.data ?? []).map((r) => ({ kind: "manutencao" as const, id: r.id, date: r.created_at, title: r.service, status: r.status, withAccount: Boolean(r.user_id) })),
    ...(j.data ?? []).map((r) => ({ kind: "obra" as const, id: r.id, date: r.scheduled_start ?? r.created_at, title: r.title, status: r.status, withAccount: Boolean(r.user_id) })),
  ].sort((a, b) => b.date.localeCompare(a.date));
}

// Moradas usadas nos pedidos da ficha (sem repetir), para a ficha e para o "+ Novo".
export async function customerPlaces(customerId: string): Promise<Place[]> {
  const supabase = await createClient();
  const cols = "address, address_details, lat, lng, created_at";
  const [q, m, j] = await Promise.all([
    supabase.from("quote_requests").select(cols).eq("customer_id", customerId).neq("address", ""),
    supabase.from("maintenance_requests").select(cols).eq("customer_id", customerId).neq("address", ""),
    supabase.from("jobs").select(cols).eq("customer_id", customerId).neq("address", ""),
  ]);
  const rows = [...(q.data ?? []), ...(m.data ?? []), ...(j.data ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const seen = new Set<string>();
  const places: Place[] = [];
  for (const r of rows) {
    const key = `${r.address.trim().toLowerCase()}|${(r.address_details ?? "").trim().toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    places.push({ address: r.address, details: r.address_details ?? "", lat: r.lat, lng: r.lng });
  }
  return places;
}

// Quantos pedidos/obras tem cada ficha (para a lista de clientes).
export async function requestCounts(ids: string[]) {
  const counts = new Map<string, number>();
  if (!ids.length) return counts;
  const supabase = await createClient();
  const results = await Promise.all(
    (["quote_requests", "maintenance_requests", "jobs"] as const).map((t) => supabase.from(t).select("customer_id").in("customer_id", ids)),
  );
  for (const r of results) for (const row of r.data ?? []) counts.set(row.customer_id, (counts.get(row.customer_id) ?? 0) + 1);
  return counts;
}

export type Duplicate = { a: string; b: string; reason: string };

export async function customerDuplicates(): Promise<Duplicate[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("customer_duplicates");
  return (data ?? []) as Duplicate[];
}
