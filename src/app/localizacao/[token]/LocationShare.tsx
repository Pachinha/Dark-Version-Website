"use client";

import { useActionState, useState } from "react";
import { submitLocation } from "@/app/actions/location";
import PlaceSearch, { type Place } from "@/components/account/PlaceSearch";
import FormMessage from "@/components/account/FormMessage";
import { googleMapsUrl } from "@/lib/geo";

// O cliente partilha a localização (GPS, uma única vez) ou pesquisa a morada.
export default function LocationShare({ token }: { token: string }) {
  const [place, setPlace] = useState<Place | null>(null);
  const [state, action, pending] = useActionState(submitLocation, undefined);

  if (state?.success) {
    return (
      <div className="alert alert-success" role="status" style={{ margin: 0 }}>
        <strong>✓ {state.success}</strong>
        <div style={{ marginTop: 4 }}>Já pode fechar esta página. Até breve!</div>
      </div>
    );
  }

  return (
    <form action={action} className="form">
      <input type="hidden" name="token" value={token} />
      {place ? (
        <div className="item">
          <div className="item-head">
            <strong>{place.address}</strong>
            <span className="badge">{place.source === "gps" ? "Localização GPS" : "Pesquisa"}</span>
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <a className="link" href={googleMapsUrl(place.lat, place.lng)} target="_blank" rel="noreferrer">Confirmar no mapa ↗</a>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPlace(null)}>Alterar</button>
          </div>
          <input type="hidden" name="address" value={place.address} />
          <input type="hidden" name="postcode" value={place.postcode} />
          <input type="hidden" name="locality" value={place.locality} />
          <input type="hidden" name="lat" value={place.lat} />
          <input type="hidden" name="lng" value={place.lng} />
          <input type="hidden" name="source" value={place.source} />
        </div>
      ) : (
        <PlaceSearch onSelect={setPlace} />
      )}
      <label className="field">
        Nº de porta, andar, indicações <span className="hint">Opcional — ex.: portão verde, 2º Esq.</span>
        <input name="address_details" maxLength={200} />
      </label>
      <FormMessage state={state} />
      <button className="btn btn-fire" disabled={pending || !place}>{pending ? "A enviar…" : "Enviar localização"}</button>
    </form>
  );
}
