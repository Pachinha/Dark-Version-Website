"use client";

import { useState } from "react";

// Galeria da página de produto: foto grande + miniaturas. Os textos alternativos chegam já traduzidos.
export default function ProductGallery({ photos, alts, emptyLabel }: { photos: string[]; alts: string[]; emptyLabel: string }) {
  const [current, setCurrent] = useState(0);

  if (!photos.length) {
    return (
      <div className="product-photo" style={{ display: "grid", placeItems: "center", color: "rgba(242,236,226,0.35)", fontSize: "14px" }}>
        {emptyLabel}
      </div>
    );
  }

  return (
    <div>
      <div className="product-photo">
        <img src={photos[current]} alt={alts[current]} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
      {photos.length > 1 && (
        <div className="product-thumbs">
          {photos.map((src, i) => (
            <button
              key={src}
              type="button"
              className={`product-thumb${i === current ? " product-thumb-active" : ""}`}
              aria-label={alts[i]}
              aria-pressed={i === current}
              onClick={() => setCurrent(i)}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
