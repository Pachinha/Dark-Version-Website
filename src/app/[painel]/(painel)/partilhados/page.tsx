import Link from "next/link";
import { requirePanel } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { QUOTE_STATUS, formatDate, one, quoteRef } from "@/lib/labels";
import { panel } from "@/lib/panel";

type Share = {
  id: string;
  created_at: string;
  client_id: string | null;
  quote_id: string | null;
  client: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
  quote: { ref: number; name: string; category: string; status: string; municipality: string } | { ref: number; name: string; category: string; status: string; municipality: string }[] | null;
};

// Clientes e pedidos que a administração partilhou com esta pessoa (só consulta + comentários).
export default async function SharedWithMePage() {
  const { user } = await requirePanel();
  const supabase = await createClient();
  const { data: shares } = await supabase
    .from("client_shares")
    .select(
      "id, created_at, client_id, quote_id, client:profiles!client_shares_client_id_fkey(full_name, email), quote:quote_requests(ref, name, category, status, municipality)",
    )
    .eq("staff_id", user.id)
    .order("created_at", { ascending: false })
    .returns<Share[]>();

  return (
    <section className="panel">
      <h2>Partilhados comigo</h2>
      <p className="muted" style={{ marginTop: 0 }}>
        Pode consultar a ficha, abrir a morada no Google Maps ou no Waze e deixar comentários para a equipa.
      </p>
      {shares?.length ? (
        <ul className="list">
          {shares.map((s) => {
            const client = one(s.client) as { full_name: string; email: string } | null;
            const quote = one(s.quote) as { ref: number; name: string; category: string; status: string; municipality: string } | null;
            return (
              <li key={s.id} className="item">
                {s.client_id ? (
                  <>
                    <div className="item-head">
                      <Link className="link" href={panel(`/partilhados/cliente/${s.client_id}`)}>
                        <strong>{client?.full_name || client?.email || "Cliente"}</strong>
                      </Link>
                      <span className="badge">Cliente</span>
                    </div>
                    <div className="muted">Partilhado a {formatDate(s.created_at)}</div>
                  </>
                ) : (
                  <>
                    <div className="item-head">
                      <Link className="link" href={panel(`/partilhados/pedido/${s.quote_id}`)}>
                        <strong>{quote?.name || "Pedido de orçamento"}</strong>
                      </Link>
                      <span className="badge">{quote ? quoteRef(quote.ref) : "Pedido"}</span>
                    </div>
                    <div className="muted">
                      {quote && `${quote.category} · ${quote.municipality} · ${QUOTE_STATUS[quote.status] ?? quote.status} · `}
                      partilhado a {formatDate(s.created_at)}
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="muted" style={{ marginBottom: 0 }}>Ainda não há nada partilhado consigo.</p>
      )}
    </section>
  );
}
