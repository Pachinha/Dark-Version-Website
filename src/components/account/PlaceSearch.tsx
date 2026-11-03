"use client";

import { useEffect, useState } from "react";
import { isInPortugal } from "@/lib/geo";

// Geocoding via Photon (OpenStreetMap data, operated by Komoot in the EU).
// Only real, existing places in Portugal can be chosen — no free-typed addresses.
const PHOTON = "https://photon.komoot.io";

export type Place = {
  address: string;
  postcode: string;
  locality: string;
  lat: number;
  lng: number;
  source: "gps" | "search";
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    countrycode?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    locality?: string;
    district?: string;
    county?: string;
  };
};

function toPlace(f: PhotonFeature, source: Place["source"], at?: { lat: number; lng: number }): Place | null {
  const p = f.properties;
  if (p.countrycode !== "PT") return null;
  const [lng, lat] = f.geometry.coordinates;
  const locality = p.city ?? p.town ?? p.village ?? p.locality ?? p.district ?? p.county ?? "";
  const street = p.street ? [p.street, p.housenumber].filter(Boolean).join(", ") : "";
  const first = [p.name !== p.street ? p.name : "", street].filter(Boolean).join(" — ");
  const address = [first, [p.postcode, locality].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  if (!address) return null;
  return { address, postcode: p.postcode ?? "", locality, lat: at?.lat ?? lat, lng: at?.lng ?? lng, source };
}

// Pesquisa de morada + "usar a minha localização". Só devolve moradas reais em Portugal.
// allowGps=false no painel: quem escreve é a equipa, a localização dela não interessa.
export default function PlaceSearch({
  onSelect,
  placeholder = "Ex.: Rua da Lagoa, Monção",
  allowGps = true,
}: {
  onSelect: (place: Place) => void;
  placeholder?: string;
  allowGps?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [status, setStatus] = useState("");

  const searching = query.trim().length >= 3;
  const visibleResults = searching ? results : [];

  // Debounced search, Portugal only
  useEffect(() => {
    if (!searching) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const url = `${PHOTON}/api/?q=${encodeURIComponent(query)}&limit=8&bbox=-31.5,32.3,-6.1,42.2`;
        const res = await fetch(url, { signal: controller.signal });
        const data: { features: PhotonFeature[] } = await res.json();
        const places = data.features.map((f) => toPlace(f, "search")).filter((p): p is Place => p !== null);
        setResults(places);
        setStatus(places.length ? "" : "Nenhuma morada encontrada em Portugal. Tente rua + localidade.");
      } catch (e) {
        if ((e as Error).name !== "AbortError") setStatus("Pesquisa indisponível de momento.");
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, searching]);

  function choose(place: Place) {
    setQuery("");
    setResults([]);
    setStatus("");
    onSelect(place);
  }

  function shareLocation() {
    if (!("geolocation" in navigator)) {
      setStatus("O seu navegador não permite partilhar a localização. Pesquise a morada.");
      return;
    }
    setStatus("A obter a sua localização…");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const at = { lat: coords.latitude, lng: coords.longitude };
        if (!isInPortugal(at.lat, at.lng)) {
          setStatus("A sua localização não está em Portugal. Pesquise a morada.");
          return;
        }
        try {
          const res = await fetch(`${PHOTON}/reverse?lat=${at.lat}&lon=${at.lng}`);
          const data: { features: PhotonFeature[] } = await res.json();
          const place = data.features[0] ? toPlace(data.features[0], "gps", at) : null;
          if (!place) throw new Error();
          choose(place);
        } catch {
          setStatus("Não foi possível identificar a morada. Pesquise-a manualmente.");
        }
      },
      () => setStatus("Localização não partilhada. Pode pesquisar a morada em vez disso."),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <>
      {allowGps && (
        <>
          <button type="button" className="btn btn-ink" onClick={shareLocation}>
            📍 Usar a minha localização atual
          </button>
          <p className="hint" style={{ margin: 0 }}>
            A localização é lida uma única vez, só para esta morada — nunca seguimos a sua posição.
            Se preferir não partilhar, pesquise a morada abaixo.
          </p>
        </>
      )}
      <label className="field">
        Pesquisar morada
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={visibleResults.length > 0}
          aria-controls="address-results"
        />
      </label>
      {visibleResults.length > 0 && (
        <ul id="address-results" role="listbox" className="list" style={{ gap: 6 }}>
          {visibleResults.map((place, i) => (
            <li key={`${place.lat},${place.lng},${i}`} role="option" aria-selected={false}>
              <button
                type="button"
                className="item"
                style={{ width: "100%", textAlign: "left", cursor: "pointer", font: "inherit" }}
                onClick={() => choose(place)}
              >
                {place.address}
              </button>
            </li>
          ))}
        </ul>
      )}
      {status && <p className="hint" role="status" style={{ margin: 0 }}>{status}</p>}
      <p className="hint" style={{ margin: 0 }}>Pesquisa de moradas © contribuidores do OpenStreetMap, via Photon (Komoot).</p>
    </>
  );
}
