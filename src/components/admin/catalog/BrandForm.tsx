"use client";

import { useState } from "react";
import { saveBrand } from "@/app/actions/catalog";
import { SaveBar, TranslationFields, useCatalogForm, type Translations } from "./shared";

export type BrandFormData = {
  id: string;
  slug: string;
  name: string;
  origin: string;
  description: string;
  website: string;
  logo_url: string;
  logo_height: number;
  imported: boolean;
  in_ticker: boolean;
  catalog_url: string;
  catalog_label: string;
  active: boolean;
  sort: number;
  translations: Translations;
};

export default function BrandForm({ brand }: { brand?: BrandFormData }) {
  // O logótipo não é reduzido: tem de manter o fundo transparente (PNG).
  const { state, pending, onSubmit } = useCatalogForm(saveBrand);
  const [logoPreview, setLogoPreview] = useState(brand?.logo_url ?? "");
  const [height, setHeight] = useState(brand?.logo_height ?? 30);
  const [removeLogo, setRemoveLogo] = useState(false);
  const b = brand;

  return (
    <form className="form" noValidate onSubmit={(e) => onSubmit(e)}>
      {b && <input type="hidden" name="id" value={b.id} />}

      <div className="row" style={{ alignItems: "flex-start" }}>
        <label className="field" style={{ flex: 2, minWidth: 200 }}>
          Nome da marca
          <input name="name" defaultValue={b?.name} maxLength={80} required />
        </label>
        <label className="field" style={{ flex: 1, minWidth: 160 }}>
          País de origem <span className="hint">Opcional</span>
          <input name="origin" defaultValue={b?.origin} maxLength={60} placeholder="Ex.: França" />
        </label>
      </div>

      <label className="field">
        Descrição <span className="hint">Opcional — aparece no destaque das marcas importadas.</span>
        <textarea name="description" defaultValue={b?.description} maxLength={2000} style={{ minHeight: 90 }} />
      </label>

      <label className="field">
        Site da marca <span className="hint">Opcional — ex.: https://www.jotul.com</span>
        <input name="website" type="url" defaultValue={b?.website} maxLength={300} />
      </label>

      <fieldset className="tr-lang">
        <legend>Logótipo <span className="hint">(PNG com fundo transparente, até 2 MB)</span></legend>
        <div className="logo-preview" aria-label="Pré-visualização na faixa de marcas">
          {logoPreview && !removeLogo ? (
            <img src={logoPreview} alt="" style={{ height }} />
          ) : (
            <span className="ticker-name">{b?.name || "Nome da marca"}</span>
          )}
        </div>
        <span className="hint">É assim que aparece na faixa da página inicial (sem logótipo, aparece o nome).</span>
        <div className="row" style={{ alignItems: "flex-end" }}>
          <label className="field" style={{ flex: 1, minWidth: 220 }}>
            {b?.logo_url ? "Substituir logótipo" : "Carregar logótipo"}
            <input
              type="file"
              name="logo"
              accept="image/png,image/webp,image/jpeg"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setLogoPreview(URL.createObjectURL(f));
                  setRemoveLogo(false);
                }
              }}
            />
          </label>
          <label className="field" style={{ width: 220 }}>
            Altura na faixa: {height} px
            <input type="range" name="logo_height" min={10} max={60} value={height} onChange={(e) => setHeight(Number(e.target.value))} />
          </label>
        </div>
        {b?.logo_url && (
          <label className="check">
            <input type="checkbox" name="remove_logo" checked={removeLogo} onChange={(e) => setRemoveLogo(e.target.checked)} />
            <span>Retirar o logótipo</span>
          </label>
        )}
      </fieldset>

      <fieldset className="tr-lang">
        <legend>Catálogo em PDF <span className="hint">(opcional, até 15 MB — o site mostra &quot;Ver catálogo&quot;)</span></legend>
        {b?.catalog_url && (
          <p style={{ margin: 0 }}>
            <a className="link" href={b.catalog_url} target="_blank" rel="noreferrer">Abrir o catálogo atual ↗</a>
          </p>
        )}
        <div className="row" style={{ alignItems: "flex-start" }}>
          <label className="field" style={{ flex: 1, minWidth: 220 }}>
            {b?.catalog_url ? "Substituir PDF" : "Carregar PDF"}
            <input type="file" name="catalog_pdf" accept="application/pdf" />
          </label>
          <label className="field" style={{ width: 200 }}>
            Etiqueta <span className="hint">ex.: 2025/2026</span>
            <input name="catalog_label" defaultValue={b?.catalog_label} maxLength={40} />
          </label>
        </div>
        {b?.catalog_url && (
          <label className="check">
            <input type="checkbox" name="remove_catalog" />
            <span>Retirar o catálogo</span>
          </label>
        )}
      </fieldset>

      <div className="row" style={{ alignItems: "flex-start", gap: 24 }}>
        <label className="check">
          <input type="checkbox" name="active" defaultChecked={b?.active ?? true} />
          <span><strong>Visível no site</strong><br /><span className="hint">Escondida, os produtos dela também deixam de aparecer.</span></span>
        </label>
        <label className="check">
          <input type="checkbox" name="in_ticker" defaultChecked={b?.in_ticker ?? true} />
          <span><strong>Mostrar na faixa de marcas</strong></span>
        </label>
        <label className="check">
          <input type="checkbox" name="imported" defaultChecked={b?.imported ?? false} />
          <span><strong>Importador oficial</strong><br /><span className="hint">Destaque na página inicial e etiqueta &quot;Importador&quot;.</span></span>
        </label>
      </div>

      <TranslationFields
        fields={[
          { key: "origin", label: "País de origem" },
          { key: "description", label: "Descrição", long: true },
        ]}
        values={b?.translations}
      />

      <details className="tr-box">
        <summary>Avançado <span className="hint">(ordem na faixa e endereço)</span></summary>
        <div className="row" style={{ alignItems: "flex-start", marginTop: 12 }}>
          <label className="field" style={{ width: 140 }}>
            Ordem
            <input name="sort" inputMode="numeric" defaultValue={b?.sort ?? 0} />
          </label>
          <label className="field" style={{ flex: 1, minWidth: 220 }}>
            Endereço (slug) <span className="hint">vazio = gerado pelo nome</span>
            <input name="slug" defaultValue={b?.slug} maxLength={80} />
          </label>
        </div>
      </details>

      <SaveBar pending={pending} state={state} label={b ? "Guardar alterações" : "Criar marca"} />
    </form>
  );
}
