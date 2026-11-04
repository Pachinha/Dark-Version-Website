"use client";

import { useEffect, useRef, useState } from "react";
import { saveProduct } from "@/app/actions/catalog";
import { ENERGY_CLASSES, FUELS, FUEL_KEYS } from "@/lib/catalog";
import { shrinkImage } from "@/lib/shrink-image";
import { SaveBar, TranslationFields, useCatalogForm, type Translations } from "./shared";

export type ProductFormData = {
  id: string;
  slug: string;
  name: string;
  brand_id: string;
  category_id: string;
  fuel: string;
  description: string;
  power_kw: number | null;
  heated_area_m2: number | null;
  efficiency_pct: number | null;
  energy_class: string;
  dimensions: string;
  badge: string;
  outlet: boolean;
  active: boolean;
  sort: number;
  photos: string[];
  translations: Translations;
};

const BADGE_LABELS: Record<string, string> = { "": "Nenhuma", novidade: "Novidade", exposicao: "Exposição", ultima_unidade: "Última unidade" };
const MAX_PHOTOS = 12;

type Photo = { kind: "old"; url: string } | { kind: "new"; file: File; url: string };

export default function ProductForm({
  product,
  brands,
  categories,
}: {
  product?: ProductFormData;
  brands: { id: string; name: string; active: boolean }[];
  categories: { id: string; name: string; active: boolean }[];
}) {
  const { state, pending, onSubmit } = useCatalogForm(saveProduct);
  const [photos, setPhotos] = useState<Photo[]>(() => (product?.photos ?? []).map((url) => ({ kind: "old", url })));
  const [busy, setBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const previews = useRef<string[]>([]);
  useEffect(() => () => previews.current.forEach((u) => URL.revokeObjectURL(u)), []);

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const room = MAX_PHOTOS - photos.length;
    const chosen = [...files].filter((f) => f.type.startsWith("image/")).slice(0, room);
    setBusy(true);
    const added: Photo[] = [];
    for (const f of chosen) {
      try {
        const small = await shrinkImage(f);
        const url = URL.createObjectURL(small);
        previews.current.push(url);
        added.push({ kind: "new", file: small, url });
      } catch {
        setPhotoError(`Não foi possível abrir "${f.name}". Experimente guardá-la em JPG.`);
      }
    }
    setPhotos((p) => [...p, ...added]);
    setBusy(false);
    if (files.length > room) setPhotoError(`No máximo ${MAX_PHOTOS} fotos por produto.`);
  }

  const move = (i: number, by: number) =>
    setPhotos((p) => {
      const next = [...p];
      const [item] = next.splice(i, 1);
      next.splice(Math.max(0, Math.min(next.length, i + by)), 0, item);
      return next;
    });

  const p = product;
  return (
    <form
      className="form"
      noValidate
      onSubmit={(e) =>
        onSubmit(e, (fd) => {
          let n = 0;
          for (const photo of photos) {
            if (photo.kind === "old") fd.append("photo_order", `old:${photo.url}`);
            else {
              fd.append("new_photos", photo.file);
              fd.append("photo_order", `new:${n++}`);
            }
          }
        })
      }
    >
      {p && <input type="hidden" name="id" value={p.id} />}

      <div className="row" style={{ alignItems: "flex-start" }}>
        <label className="field" style={{ flex: 2, minWidth: 220 }}>
          Nome do modelo
          <input name="name" defaultValue={p?.name} maxLength={120} required placeholder="Ex.: Kivo 120" />
        </label>
        <label className="field" style={{ flex: 1, minWidth: 180 }}>
          Marca
          <select name="brand_id" defaultValue={p?.brand_id ?? ""} required>
            <option value="" disabled>Escolha…</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}{b.active ? "" : " (escondida)"}</option>)}
          </select>
        </label>
      </div>

      <div className="row" style={{ alignItems: "flex-start" }}>
        <label className="field" style={{ flex: 1, minWidth: 180 }}>
          Categoria
          <select name="category_id" defaultValue={p?.category_id ?? ""} required>
            <option value="" disabled>Escolha…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.active ? "" : " (escondida)"}</option>)}
          </select>
        </label>
        <label className="field" style={{ flex: 1, minWidth: 160 }}>
          Combustível
          <select name="fuel" defaultValue={p?.fuel ?? ""} required>
            <option value="" disabled>Escolha…</option>
            {FUEL_KEYS.map((f) => <option key={f} value={f}>{FUELS[f]}</option>)}
          </select>
        </label>
        <label className="field" style={{ flex: 1, minWidth: 160 }}>
          Etiqueta no cartão
          <select name="badge" defaultValue={p?.badge ?? ""}>
            {Object.entries(BADGE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>

      <label className="field">
        Descrição <span className="hint">Opcional. Linha em branco = novo parágrafo.</span>
        <textarea name="description" defaultValue={p?.description} maxLength={5000} style={{ minHeight: 140 }} />
      </label>

      <fieldset className="tr-lang">
        <legend>Características técnicas <span className="hint">(opcionais — só aparecem as preenchidas)</span></legend>
        <div className="row" style={{ alignItems: "flex-start" }}>
          <label className="field" style={{ flex: 1, minWidth: 120 }}>
            Potência (kW)
            <input name="power_kw" inputMode="decimal" defaultValue={p?.power_kw ?? ""} placeholder="8,5" />
          </label>
          <label className="field" style={{ flex: 1, minWidth: 120 }}>
            Aquece até (m²)
            <input name="heated_area_m2" inputMode="numeric" defaultValue={p?.heated_area_m2 ?? ""} placeholder="90" />
          </label>
          <label className="field" style={{ flex: 1, minWidth: 120 }}>
            Rendimento (%)
            <input name="efficiency_pct" inputMode="decimal" defaultValue={p?.efficiency_pct ?? ""} placeholder="82" />
          </label>
          <label className="field" style={{ flex: 1, minWidth: 120 }}>
            Classe energética
            <select name="energy_class" defaultValue={p?.energy_class ?? ""}>
              <option value="">—</option>
              {ENERGY_CLASSES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <label className="field">
          Dimensões
          <input name="dimensions" defaultValue={p?.dimensions} maxLength={120} placeholder="Ex.: 120 × 55 × 48 cm (L × A × P)" />
        </label>
      </fieldset>

      <div className="field">
        Fotografias <span className="hint">A primeira é a do cartão. Até {MAX_PHOTOS}; são reduzidas antes de enviar.</span>
        <div className="photo-grid">
          {photos.map((photo, i) => (
            <figure key={photo.url} className="photo-thumb">
              <img src={photo.url} alt={`Foto ${i + 1}`} />
              <button type="button" onClick={() => setPhotos((list) => list.filter((_, j) => j !== i))} aria-label={`Remover foto ${i + 1}`}>×</button>
              <span className="photo-move">
                {i > 0 && <button type="button" onClick={() => move(i, -1)} aria-label={`Passar a foto ${i + 1} para trás`}>←</button>}
                {i < photos.length - 1 && <button type="button" onClick={() => move(i, 1)} aria-label={`Passar a foto ${i + 1} para a frente`}>→</button>}
              </span>
              {i === 0 && <span className="photo-main">Principal</span>}
            </figure>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="photo-add">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={busy}
                onChange={(e) => {
                  setPhotoError("");
                  void addPhotos(e.target.files);
                  e.target.value = "";
                }}
              />
              <span aria-hidden>{busy ? "…" : "+"}</span>
              {busy ? "A preparar…" : "Adicionar fotos"}
            </label>
          )}
        </div>
        {photoError && <p className="alert alert-error" style={{ margin: 0 }}>{photoError}</p>}
      </div>

      <div className="row" style={{ alignItems: "flex-start", gap: 24 }}>
        <label className="check">
          <input type="checkbox" name="active" defaultChecked={p?.active ?? true} />
          <span><strong>Visível no site</strong><br /><span className="hint">Desmarque para esconder sem apagar.</span></span>
        </label>
        <label className="check">
          <input type="checkbox" name="outlet" defaultChecked={p?.outlet ?? false} />
          <span><strong>Outlet</strong><br /><span className="hint">Aparece só na página Outlet.</span></span>
        </label>
      </div>

      <TranslationFields
        fields={[
          { key: "name", label: "Nome (se mudar noutra língua)" },
          { key: "description", label: "Descrição", long: true },
        ]}
        values={p?.translations}
      />

      <details className="tr-box">
        <summary>Avançado <span className="hint">(ordem e endereço da página)</span></summary>
        <div className="row" style={{ alignItems: "flex-start", marginTop: 12 }}>
          <label className="field" style={{ width: 140 }}>
            Ordem
            <input name="sort" inputMode="numeric" defaultValue={p?.sort ?? 0} />
          </label>
          <label className="field" style={{ flex: 1, minWidth: 220 }}>
            Endereço <span className="hint">/produto/… — vazio = gerado pelo nome</span>
            <input name="slug" defaultValue={p?.slug} maxLength={80} />
          </label>
        </div>
      </details>

      <SaveBar pending={pending || busy} state={state} label={p ? "Guardar alterações" : "Criar produto"} />
    </form>
  );
}
