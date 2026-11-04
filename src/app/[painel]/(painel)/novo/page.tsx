import NewEntryForm from "@/components/admin/NewEntryForm";
import { requireAdmin } from "@/lib/auth";
import { QUOTE_CATEGORIES } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Novo registo — Painel", robots: { index: false, follow: false } };

const KINDS = ["orcamento", "visita", "manutencao", "obra"] as const;

// A Sandra regista sozinha: pedido de orçamento, visita técnica, limpeza/manutenção ou obra —
// para clientes com conta ou sem conta (quem aparece na loja ou liga).
export default async function NewEntryPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  await requireAdmin();
  const { tipo } = await searchParams;
  const supabase = await createClient();
  const [{ data: clients }, { data: staff }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, phone").eq("role", "client").order("full_name").limit(2000),
    supabase.from("profiles").select("id, full_name").in("role", ["admin", "tecnico"]).order("full_name"),
  ]);

  return (
    <section className="panel">
      <h2 style={{ marginTop: 0 }}>Novo registo</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Para clientes que ligam ou aparecem na loja. Fica no painel e na agenda, e o técnico escolhido vê-o na agenda dele.
      </p>
      <NewEntryForm
        initialKind={KINDS.find((k) => k === tipo) ?? "visita"}
        clients={(clients ?? []).map((c) => ({ ...c, phone: c.phone ?? "" }))}
        staff={staff ?? []}
        categories={QUOTE_CATEGORIES}
      />
    </section>
  );
}
