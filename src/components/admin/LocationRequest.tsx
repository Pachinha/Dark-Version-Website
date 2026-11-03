import { requestLocation } from "@/app/actions/location";
import ConfirmedForm from "@/components/admin/ConfirmedForm";
import ManualAddress from "@/components/admin/ManualAddress";
import { formatDate } from "@/lib/labels";
import type { Entity } from "@/lib/location-request";
import { createAdminClient } from "@/lib/supabase/server";

// Só quando ainda não há morada: pedir a localização ao cliente (link) ou inserir à mão.
// Só para a administração (a tabela não é acessível pela API; lê-se aqui no servidor).
export default async function LocationRequest({ entity, id, hasLocation }: { entity: Entity; id: string; hasLocation: boolean }) {
  if (hasLocation) return null;
  const { data: last } = await createAdminClient()
    .from("location_requests")
    .select("created_at, expires_at, fulfilled_at, address")
    .eq("entity", entity)
    .eq("entity_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const expired = last && !last.fulfilled_at && new Date(last.expires_at) < new Date();
  return (
    <div className="info-box" style={{ marginTop: 14 }}>
      <strong>Falta a morada.</strong> Peça ao cliente que partilhe a localização, ou insira-a à mão.
      <div style={{ height: 10 }} />
      {last && !last.fulfilled_at && !expired ? (
        <p className="hint" style={{ margin: "0 0 8px" }}>⏳ Pedido enviado a {formatDate(last.created_at, true)} — à espera do cliente.</p>
      ) : expired ? (
        <p className="hint" style={{ margin: "0 0 8px" }}>O último link expirou sem resposta. Pode enviar outro.</p>
      ) : null}
      <ConfirmedForm
        action={requestLocation}
        labels={{}}
        mode="create"
        submitLabel={last && !last.fulfilled_at && !expired ? "📍 Reenviar pedido de localização" : "📍 Pedir localização ao cliente"}
        confirmTitle="Enviar ao cliente um link para partilhar a localização?"
      >
        <input type="hidden" name="entity" value={entity} />
        <input type="hidden" name="entity_id" value={id} />
      </ConfirmedForm>
      <div style={{ marginTop: 10 }}>
        <ManualAddress entity={entity} id={id} />
      </div>
    </div>
  );
}
