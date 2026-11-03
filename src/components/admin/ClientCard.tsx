import Link from "next/link";
import Directions from "@/components/admin/Directions";
import { googleMapsUrl, wazeUrl } from "@/lib/geo";
import { panel } from "@/lib/panel";

type Client = { id: string; full_name: string; email: string; phone: string } | null;
// lat/lng em falta (pedido antigo sem coordenadas): os botões usam a pesquisa por texto.
type Address = { label: string; address: string; details: string; lat: number | null; lng: number | null } | null;

// children: aparece no fim, depois da morada (ex.: "Pedir localização ao cliente").
export default function ClientCard({
  client,
  address,
  linkToClient = true,
  children,
}: {
  client: Client;
  address: Address;
  linkToClient?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section className="panel">
      <h2>Cliente</h2>
      {client ? (
        <p style={{ marginTop: 0, lineHeight: 1.7 }}>
          <strong>
            {linkToClient ? <Link className="link" href={panel(`/clientes/${client.id}`)}>{client.full_name}</Link> : client.full_name}
          </strong>
          <br />
          <a className="link" href={`mailto:${client.email}`}>{client.email}</a>
          {client.phone && (
            <>
              <br />
              <a className="link" href={`tel:${client.phone}`}>{client.phone}</a>
            </>
          )}
        </p>
      ) : (
        <p className="muted">Cliente indisponível.</p>
      )}

      <h2 style={{ marginTop: 24 }}>Morada</h2>
      {address ? (
        <>
          <p style={{ marginTop: 0 }}>
            <strong>{address.label}:</strong> {address.address}
            {address.details && <><br /><span className="muted">{address.details}</span></>}
          </p>
          {address.lat == null || address.lng == null ? (
            <Directions address={address.address} lat={null} lng={null} />
          ) : (
          <div className="row">
            <a className="btn btn-fire btn-sm" href={googleMapsUrl(address.lat, address.lng)} target="_blank" rel="noreferrer">
              Abrir no Google Maps
            </a>
            <a className="btn btn-ink btn-sm" href={wazeUrl(address.lat, address.lng)} target="_blank" rel="noreferrer">
              Navegar com Waze
            </a>
          </div>
          )}
        </>
      ) : (
        <p className="muted" style={{ marginBottom: 0 }}>Sem morada associada.</p>
      )}
      {children}
    </section>
  );
}
