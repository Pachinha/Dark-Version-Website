"use client";

import { useState } from "react";
import { setAddressManually } from "@/app/actions/location";
import ConfirmedForm from "@/components/admin/ConfirmedForm";
import PlaceSearch, { type Place } from "@/components/account/PlaceSearch";
import type { Entity } from "@/lib/location-request";

// A Sandra insere a morada à mão (pesquisa de moradas reais; sem "usar a minha localização").
export default function ManualAddress({ entity, id }: { entity: Entity; id: string }) {
  const [open, setOpen] = useState(false);
  const [place, setPlace] = useState<Place | null>(null);

  if (!open) {
    return (
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>
        ✎ Inserir a morada à mão
      </button>
    );
  }

  return (
    <div className="item" style={{ marginTop: 8 }}>
      <ConfirmedForm action={setAddressManually} labels={{ address: "Morada", address_details: "Indicações" }} mode="create" submitLabel="Guardar morada" confirmTitle="Guardar esta morada?">
        <input type="hidden" name="entity" value={entity} />
        <input type="hidden" name="entity_id" value={id} />
        {place ? (
          <div className="item-head">
            <strong>{place.address}</strong>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPlace(null)}>Alterar</button>
            <input type="hidden" name="address" value={place.address} />
            <input type="hidden" name="postcode" value={place.postcode} />
            <input type="hidden" name="locality" value={place.locality} />
            <input type="hidden" name="lat" value={place.lat} />
            <input type="hidden" name="lng" value={place.lng} />
          </div>
        ) : (
          <PlaceSearch onSelect={setPlace} allowGps={false} />
        )}
        <label className="field">
          Nº de porta, andar, indicações
          <input name="address_details" maxLength={200} />
        </label>
      </ConfirmedForm>
      <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => { setOpen(false); setPlace(null); }}>
        Cancelar
      </button>
    </div>
  );
}
