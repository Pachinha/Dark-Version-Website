import { googleMapsSearchUrl, googleMapsUrl, wazeSearchUrl, wazeUrl } from "@/lib/geo";

// Botões "Google Maps" e "Waze" com o trajeto até à casa do cliente.
// Com coordenadas (morada verificada) vai direto à porta; pedidos antigos só têm texto.
export default function Directions({
  address,
  lat,
  lng,
  compact = false,
}: {
  address: string;
  lat?: number | null;
  lng?: number | null;
  compact?: boolean;
}) {
  const exact = lat != null && lng != null;
  const maps = exact ? googleMapsUrl(lat, lng) : googleMapsSearchUrl(address);
  const waze = exact ? wazeUrl(lat, lng) : wazeSearchUrl(address);

  if (compact) {
    return (
      <div className="row" style={{ marginTop: 6 }}>
        <a className="link" href={maps} target="_blank" rel="noreferrer">Google Maps ↗</a>
        <a className="link" href={waze} target="_blank" rel="noreferrer">Waze ↗</a>
      </div>
    );
  }

  return (
    <>
      <div className="row">
        <a className="btn btn-fire btn-sm" href={maps} target="_blank" rel="noreferrer">Abrir no Google Maps</a>
        <a className="btn btn-ink btn-sm" href={waze} target="_blank" rel="noreferrer">Navegar com Waze</a>
      </div>
      {!exact && (
        <p className="hint" style={{ margin: "6px 0 0" }}>
          Pedido antigo, sem morada verificada — o mapa procura pelo texto. Confirme com o cliente.
        </p>
      )}
    </>
  );
}
