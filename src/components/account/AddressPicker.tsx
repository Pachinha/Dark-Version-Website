"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { addAddress } from "@/app/actions/account";
import FormMessage from "./FormMessage";
import type { FormState } from "@/app/actions/auth";
import { googleMapsUrl } from "@/lib/geo";
import PlaceSearch, { type Place } from "./PlaceSearch";

export default function AddressPicker() {
  const [selected, setSelected] = useState<Place | null>(null);
  const [saved, setSaved] = useState<{ label: string; address: string } | null>(null);

  const [state, action, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await addAddress(prev, formData);
    if (result?.success) {
      setSaved({ label: String(formData.get("label") || "Casa"), address: String(formData.get("address")) });
      setSelected(null);
    }
    return result;
  }, undefined);

  // Depois de guardar: confirmação clara em vez de um formulário vazio com o botão desativado.
  if (saved) {
    return (
      <div className="form" role="status">
        <div className="alert alert-success" style={{ margin: 0 }}>
          <strong>✓ Morada guardada</strong>
          <div style={{ marginTop: 4 }}>{saved.label} — {saved.address}</div>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          Já aparece em “As minhas moradas” e pode escolhê-la quando pedir um orçamento ou uma manutenção.
        </p>
        <div className="row">
          <button type="button" className="btn btn-ink" onClick={() => setSaved(null)}>
            + Adicionar outra morada
          </button>
          <Link href="/pedir-orcamento" className="btn btn-ghost">Pedir orçamento</Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="form">
      {selected ? (
        <div className="item">
          <div className="item-head">
            <strong>{selected.address}</strong>
            <span className="badge">{selected.source === "gps" ? "Localização GPS" : "Pesquisa"}</span>
          </div>
          <div className="row" style={{ marginTop: 8 }}>
            <a className="link" href={googleMapsUrl(selected.lat, selected.lng)} target="_blank" rel="noreferrer">
              Confirmar no mapa ↗
            </a>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>
              Alterar
            </button>
          </div>
          <input type="hidden" name="address" value={selected.address} />
          <input type="hidden" name="postcode" value={selected.postcode} />
          <input type="hidden" name="locality" value={selected.locality} />
          <input type="hidden" name="lat" value={selected.lat} />
          <input type="hidden" name="lng" value={selected.lng} />
          <input type="hidden" name="source" value={selected.source} />
        </div>
      ) : (
        <PlaceSearch onSelect={setSelected} />
      )}

      <label className="field">
        Nº de porta, andar, indicações <span className="hint">Ex.: nº 25, 2º Esq. — portão verde</span>
        <input name="details" maxLength={200} />
      </label>
      <label className="field">
        Nome da morada
        <input name="label" placeholder="Casa" maxLength={60} />
      </label>

      <FormMessage state={state?.error ? state : undefined} />
      {!selected && <p className="hint" style={{ margin: 0 }}>Escolha primeiro uma morada da lista (ou use a sua localização) para poder guardar.</p>}
      <button className="btn btn-fire" disabled={pending || !selected}>
        {pending ? "A guardar…" : "Guardar morada"}
      </button>
    </form>
  );
}
