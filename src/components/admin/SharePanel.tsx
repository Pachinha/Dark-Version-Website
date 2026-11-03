import { createClient } from "@/lib/supabase/server";
import { shareWith, unshare } from "@/app/actions/sharing";
import ActionForm from "@/components/account/ActionForm";
import { ROLE_LABEL, formatDate, one } from "@/lib/labels";

type Share = {
  id: string;
  created_at: string;
  profiles: { full_name: string; email: string; role: string } | { full_name: string; email: string; role: string }[] | null;
};

// Só para o administrador: partilhar este cliente com técnicos ou colaboradores do backoffice.
// Quem recebe vê a ficha (sem poder alterar), a morada com Maps/Waze, e pode comentar.
export default async function SharePanel({ clientId, quoteId }: { clientId?: string; quoteId?: string }) {
  const supabase = await createClient();
  let sharesQuery = supabase
    .from("client_shares")
    .select("id, created_at, profiles!client_shares_staff_id_fkey(full_name, email, role)")
    .order("created_at");
  sharesQuery = clientId ? sharesQuery.eq("client_id", clientId) : sharesQuery.eq("quote_id", quoteId ?? "");

  const [{ data: shares }, { data: people }] = await Promise.all([
    sharesQuery.returns<Share[]>(),
    supabase.from("profiles").select("id, full_name, email, role").in("role", ["tecnico", "colaborador"]).order("full_name"),
  ]);

  return (
    <section className="panel">
      <h2>Partilhar com a equipa</h2>
      <p className="hint" style={{ marginTop: 0 }}>
        Quem recebe a partilha vê a ficha e a morada (Google Maps / Waze) e pode deixar comentários, mas não altera nada.
      </p>
      {shares?.length ? (
        <ul className="list" style={{ gap: 6 }}>
          {shares.map((s) => {
            const p = one(s.profiles) as { full_name: string; email: string; role: string } | null;
            return (
              <li key={s.id} className="item">
                <div className="item-head">
                  <span>
                    <strong>{p?.full_name || p?.email}</strong>{" "}
                    <span className="badge">{p ? ROLE_LABEL[p.role] : ""}</span>
                  </span>
                  <form action={unshare}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="btn btn-ghost btn-sm">Retirar acesso</button>
                  </form>
                </div>
                <div className="muted">Partilhado a {formatDate(s.created_at)}</div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted">Ainda não está partilhado com ninguém.</p>
      )}

      {people?.length ? (
        <ActionForm action={shareWith} submitLabel="Partilhar">
          {clientId && <input type="hidden" name="client_id" value={clientId} />}
          {quoteId && <input type="hidden" name="quote_id" value={quoteId} />}
          <label className="field">
            Partilhar com
            <select name="staff_id" defaultValue="" required>
              <option value="" disabled>Escolha…</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || p.email} — {ROLE_LABEL[p.role]}
                </option>
              ))}
            </select>
          </label>
        </ActionForm>
      ) : (
        <p className="hint" style={{ marginBottom: 0 }}>
          Ainda não há técnicos nem colaboradores. Adicione-os no separador <strong>Equipa</strong>.
        </p>
      )}
    </section>
  );
}
