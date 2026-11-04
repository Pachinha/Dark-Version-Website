"use client";

import { useState } from "react";
import { saveCategory } from "@/app/actions/catalog";
import { SaveBar, TranslationFields, useCatalogForm, type Translations } from "./shared";

export type CategoryFormData = {
  id: string;
  slug: string;
  name: string;
  title: string;
  subtitle: string;
  image_url: string;
  active: boolean;
  sort: number;
  translations: Translations;
};

export default function CategoryForm({ category }: { category?: CategoryFormData }) {
  const { state, pending, onSubmit } = useCatalogForm(saveCategory, ["image"]);
  const [preview, setPreview] = useState(category?.image_url ?? "");
  const c = category;

  return (
    <form className="form" noValidate onSubmit={(e) => onSubmit(e)}>
      {c && <input type="hidden" name="id" value={c.id} />}

      <label className="field" style={{ maxWidth: 360 }}>
        Nome da categoria
        <input name="name" defaultValue={c?.name} maxLength={60} required placeholder="Ex.: Lareiras" />
      </label>
      <label className="field">
        Frase do topo da página <span className="hint">Opcional — ex.: &quot;Lareiras para todos os espaços.&quot;</span>
        <input name="title" defaultValue={c?.title} maxLength={120} />
      </label>
      <label className="field">
        Subtítulo <span className="hint">Opcional</span>
        <textarea name="subtitle" defaultValue={c?.subtitle} maxLength={300} style={{ minHeight: 70 }} />
      </label>

      <fieldset className="tr-lang">
        <legend>Imagem <span className="hint">(cartão na página inicial e topo da página da categoria)</span></legend>
        {preview && <img src={preview} alt="" className="category-preview" />}
        <label className="field">
          {c?.image_url ? "Substituir imagem" : "Carregar imagem"}
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPreview(URL.createObjectURL(f));
            }}
          />
        </label>
        {c?.image_url && (
          <label className="check">
            <input type="checkbox" name="remove_image" />
            <span>Retirar a imagem</span>
          </label>
        )}
      </fieldset>

      <label className="check">
        <input type="checkbox" name="active" defaultChecked={c?.active ?? true} />
        <span><strong>Visível no site</strong><br /><span className="hint">Escondida, os produtos dela também deixam de aparecer.</span></span>
      </label>

      <TranslationFields
        fields={[
          { key: "name", label: "Nome" },
          { key: "title", label: "Frase do topo" },
          { key: "subtitle", label: "Subtítulo", long: true },
        ]}
        values={c?.translations}
      />

      <details className="tr-box">
        <summary>Avançado <span className="hint">(ordem no menu e endereço)</span></summary>
        <div className="row" style={{ alignItems: "flex-start", marginTop: 12 }}>
          <label className="field" style={{ width: 140 }}>
            Ordem
            <input name="sort" inputMode="numeric" defaultValue={c?.sort ?? 0} />
          </label>
          <label className="field" style={{ flex: 1, minWidth: 220 }}>
            Endereço <span className="hint">/produtos/… — vazio = gerado pelo nome</span>
            <input name="slug" defaultValue={c?.slug} maxLength={80} />
          </label>
        </div>
      </details>

      <SaveBar pending={pending} state={state} label={c ? "Guardar alterações" : "Criar categoria"} />
    </form>
  );
}
