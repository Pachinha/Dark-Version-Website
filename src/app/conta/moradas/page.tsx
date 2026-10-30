import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteAddress } from "@/app/actions/account";
import AddressPicker from "@/components/account/AddressPicker";
import { googleMapsUrl, wazeUrl } from "@/lib/geo";

export default async function MoradasPage() {
  const { user } = await requireUser();
  const supabase = await createClient();
  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at");

  return (
    <div className="grid-2">
      <section className="panel">
        <h2>Adicionar morada</h2>
        <AddressPicker />
      </section>
      <section className="panel">
        <h2>As minhas moradas</h2>
        {addresses?.length ? (
          <ul className="list">
            {addresses.map((a) => (
              <li key={a.id} className="item">
                <div className="item-head">
                  <strong>{a.label}</strong>
                  <span className="badge">{a.source === "gps" ? "GPS" : "Pesquisa"}</span>
                </div>
                <div>{a.address}</div>
                {a.details && <div className="muted">{a.details}</div>}
                <div className="row" style={{ marginTop: 8 }}>
                  <a className="link" href={googleMapsUrl(a.lat, a.lng)} target="_blank" rel="noreferrer">Google Maps ↗</a>
                  <a className="link" href={wazeUrl(a.lat, a.lng)} target="_blank" rel="noreferrer">Waze ↗</a>
                  <form action={deleteAddress} style={{ marginLeft: "auto" }}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="btn btn-ghost btn-sm">Apagar</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted" style={{ marginBottom: 0 }}>Ainda não tem moradas guardadas.</p>
        )}
      </section>
    </div>
  );
}
