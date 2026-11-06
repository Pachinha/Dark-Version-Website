import NewEntryForm from "@/components/admin/NewEntryForm";
import { requireAdmin } from "@/lib/auth";
import { QUOTE_CATEGORIES } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { clientAddresses, customerPastPlaces } from "@/app/actions/entries";

export const metadata = { title: "Novo registo — Painel", robots: { index: false, follow: false } };

const KINDS = ["orcamento", "visita", "manutencao", "obra"] as const;

// A Sandra regista sozinha: pedido de orçamento, visita técnica, limpeza/manutenção ou obra —
// para clientes com conta ou sem conta (quem aparece na loja ou liga).
export default async function NewEntryPage({ searchParams }: { searchParams: Promise<{ tipo?: string; cliente?: string }> }) {
  await requireAdmin();
  const { tipo, cliente } = await searchParams;
  const supabase = await createClient();
  const [{ data: customers }, { data: staff }] = await Promise.all([
    // Todas as fichas (com e sem conta), exceto a equipa.
    supabase
      .from("customers")
      .select("id, user_id, name, email, phone, profiles!customers_user_id_fkey(role)")
      .order("name")
      .limit(5000)
      .returns<{ id: string; user_id: string | null; name: string; email: string; phone: string; profiles: { role: string } | null }[]>(),
    supabase.from("profiles").select("id, full_name").in("role", ["admin", "tecnico"]).order("full_name"),
  ]);

  const clients = (customers ?? [])
    .filter((c) => !c.profiles || c.profiles.role === "client")
    .map((c) => ({ id: c.id, user_id: c.user_id, full_name: c.name, email: c.email, phone: c.phone }));

  const chosen = clients.find((c) => c.id === cliente);
  const initial = chosen
    ? {
        client: chosen,
        saved: chosen.user_id ? await clientAddresses(chosen.user_id) : [],
        past: chosen.user_id ? [] : await customerPastPlaces(chosen.id),
      }
    : null;

  return (
    <section className="panel">
      <h2 style={{ marginTop: 0 }}>Novo registo</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Para clientes que ligam ou aparecem na loja. Fica no painel e na agenda, e o técnico escolhido vê-o na agenda dele.
      </p>
      <NewEntryForm
        initialKind={KINDS.find((k) => k === tipo) ?? "visita"}
        clients={clients}
        initialClient={initial}
        staff={staff ?? []}
        categories={QUOTE_CATEGORIES}
      />
    </section>
  );
}
