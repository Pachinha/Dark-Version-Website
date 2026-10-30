import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createJob } from "@/app/actions/admin";
import ConfirmedForm from "@/components/admin/ConfirmedForm";
import JobFields, { JOB_LABELS } from "@/components/admin/JobFields";
import { panel } from "@/lib/panel";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; orcamento?: string; q?: string }>;
}) {
  await requireAdmin();
  const { cliente, orcamento, q } = await searchParams;
  const supabase = await createClient();

  // Step 1: choose the client
  if (!cliente) {
    let query = supabase.from("profiles").select("id, full_name, email").eq("role", "client").order("full_name").limit(50);
    if (q) {
      const term = q.replace(/[%,()]/g, " ").trim();
      query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
    }
    const { data: clients } = await query;
    return (
      <section className="panel" style={{ maxWidth: 640 }}>
        <h2>Nova obra — escolher cliente</h2>
        <form className="row" style={{ marginBottom: 16 }}>
          <label className="field" style={{ flex: 1, minWidth: 200 }}>
            <span className="hint">Pesquisar por nome ou email</span>
            <input name="q" defaultValue={q} autoFocus />
          </label>
          <button className="btn btn-ink btn-sm" style={{ alignSelf: "flex-end", marginBottom: 4 }}>Pesquisar</button>
        </form>
        <ul className="list" style={{ gap: 6 }}>
          {clients?.map((c) => (
            <li key={c.id}>
              <Link className="item" style={{ display: "block", textDecoration: "none", color: "inherit" }} href={`?cliente=${c.id}`}>
                <strong>{c.full_name || "(sem nome)"}</strong> <span className="muted">· {c.email}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // Step 2: job details
  const [{ data: client }, { data: addresses }, { data: staff }, { data: quote }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email").eq("id", cliente).maybeSingle(),
    supabase.from("addresses").select("id, label, address").eq("user_id", cliente).order("created_at"),
    supabase.from("profiles").select("id, full_name").in("role", ["admin", "tecnico"]).order("full_name"),
    orcamento
      ? supabase.from("quote_requests").select("id, category, message").eq("id", orcamento).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (!client) return <section className="panel"><p>Cliente não encontrado.</p></section>;

  return (
    <section className="panel" style={{ maxWidth: 720 }}>
      <h2>Nova obra para {client.full_name}</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        {client.email} · <Link className="link" href={panel("/obras/nova")}>trocar cliente</Link>
      </p>
      {!addresses?.length && (
        <p className="alert alert-error">
          Este cliente ainda não tem moradas. Pode criar a obra sem morada e pedir-lhe que adicione uma na área de cliente.
        </p>
      )}
      <ConfirmedForm
        action={createJob}
        labels={JOB_LABELS}
        mode="create"
        submitLabel="Criar obra"
        confirmTitle="Deseja criar esta obra?"
      >
        <input type="hidden" name="user_id" value={client.id} />
        {quote && <input type="hidden" name="quote_id" value={quote.id} />}
        <JobFields
          isAdmin
          addresses={addresses ?? []}
          staff={staff ?? []}
          job={quote ? { title: quote.category, description: quote.message } : {}}
        />
      </ConfirmedForm>
    </section>
  );
}
