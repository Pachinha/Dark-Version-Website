import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { markNotDuplicates, mergeCustomers } from "@/app/actions/customers";
import { customerDuplicates, customerPlaces, requestCounts, type Customer } from "@/lib/customers";
import { formatDate } from "@/lib/labels";
import { panel } from "@/lib/panel";

export const metadata = { title: "Possíveis repetidos — Painel", robots: { index: false, follow: false } };

const ERRORS: Record<string, string> = {
  contas: "Não é possível juntar: as duas fichas têm conta no site (são duas contas diferentes).",
  "1": "Não foi possível juntar as fichas. Tente novamente.",
};

// Fichas com o mesmo nome ou a mesma morada mas contactos diferentes: a base de dados não as junta
// sozinha (homónimos, famílias na mesma casa). A administração decide.
export default async function DuplicatesPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  await requireAdmin();
  const { erro } = await searchParams;
  const duplicates = await customerDuplicates();
  const ids = [...new Set(duplicates.flatMap((d) => [d.a, d.b]))];
  const supabase = await createClient();
  const [{ data }, counts, places] = await Promise.all([
    ids.length
      ? supabase.from("customers").select("id, user_id, name, phone, email, created_at").in("id", ids).returns<Customer[]>()
      : Promise.resolve({ data: [] as Customer[] }),
    requestCounts(ids),
    Promise.all(ids.map(async (id) => [id, (await customerPlaces(id))[0]?.address ?? ""] as const)).then((e) => new Map(e)),
  ]);
  const byId = new Map((data ?? []).map((c) => [c.id, c]));

  const card = (c: Customer) => (
    <div className="item" style={{ flex: 1, minWidth: 220 }}>
      <div className="item-head">
        <Link className="link" href={panel(`/clientes/${c.id}`)}><strong>{c.name || "(sem nome)"}</strong></Link>
        <span className="badge">{c.user_id ? "Com conta" : "Sem conta"}</span>
      </div>
      <div className="muted">{[c.phone, c.email].filter(Boolean).join(" · ") || "Sem contactos"}</div>
      {places.get(c.id) && <div className="muted">{places.get(c.id)}</div>}
      <div className="hint">{counts.get(c.id) ?? 0} pedido(s) · desde {formatDate(c.created_at)}</div>
    </div>
  );

  return (
    <>
      <p style={{ margin: "0 0 12px" }}>
        <Link href={panel("/clientes")} className="tab">← Clientes</Link>
      </p>
      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Possíveis clientes repetidos</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Quem volta a pedir com o mesmo telefone ou email já entra sozinho na ficha certa. Aqui aparecem só os casos
          duvidosos: mesmo nome ou mesma morada, mas com contactos diferentes. Pode ser a mesma pessoa (mudou de número)
          ou pessoas diferentes (homónimos, família na mesma casa) — decida em cada caso.
        </p>
        {erro && <p className="alert alert-error" role="alert">{ERRORS[erro] ?? ERRORS["1"]}</p>}
        {duplicates.length ? (
          <ul className="list">
            {duplicates.map((d) => {
              const a = byId.get(d.a);
              const b = byId.get(d.b);
              if (!a || !b) return null;
              // Fica a ficha com conta; se nenhuma tiver, a mais antiga.
              const [keep, other] = b.user_id || (!a.user_id && b.created_at < a.created_at) ? [b, a] : [a, b];
              return (
                <li key={`${d.a}-${d.b}`} className="item">
                  <p className="hint" style={{ marginTop: 0 }}>Coincide: {d.reason}</p>
                  <div className="row" style={{ alignItems: "stretch" }}>
                    {card(a)}
                    {card(b)}
                  </div>
                  <div className="row" style={{ marginTop: 10 }}>
                    <form action={mergeCustomers}>
                      <input type="hidden" name="keep" value={keep.id} />
                      <input type="hidden" name="other" value={other.id} />
                      <button className="btn btn-fire btn-sm">É a mesma pessoa — juntar</button>
                    </form>
                    <form action={markNotDuplicates}>
                      <input type="hidden" name="a" value={d.a} />
                      <input type="hidden" name="b" value={d.b} />
                      <button className="btn btn-ghost btn-sm">São pessoas diferentes</button>
                    </form>
                  </div>
                  <p className="hint" style={{ marginBottom: 0 }}>
                    Ao juntar, fica a ficha de {keep.name || "(sem nome)"}{keep.user_id ? " (tem conta)" : ""}; os contactos em falta são
                    completados com os da outra.
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted" style={{ marginBottom: 0 }}>Não há possíveis repetidos. ✓</p>
        )}
      </section>
    </>
  );
}
