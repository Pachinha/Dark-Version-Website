"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { COUNTRIES, byIso, national, split } from "@/lib/phone";
import { fmt } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";

// Telefone com indicativo do país. Por defeito: o país da rede de onde se está a aceder
// (/api/pais, pelo IP); se não se souber, Portugal. (O idioma do telemóvel não serve:
// muitos portugueses têm o telemóvel em inglês.) A pessoa pode sempre escolher outro país.
// Grava no formato internacional: +351912345678.
// Visual: um só campo — [bandeira +351 ▾ | número]. A lista de países abre por baixo, com pesquisa.

let guessed: Promise<string> | null = null;
function guessCountry(): Promise<string> {
  guessed ??= (async () => {
    try {
      const cached = sessionStorage.getItem("pais");
      if (cached) return cached;
    } catch {}
    let iso = "";
    try {
      const res = await fetch("/api/pais", { cache: "no-store" });
      iso = ((await res.json()) as { country?: string }).country ?? "";
    } catch {}
    if (!byIso(iso)) iso = "PT";
    try {
      sessionStorage.setItem("pais", iso);
    } catch {}
    return iso;
  })();
  return guessed;
}

const Flag = ({ iso }: { iso: string }) => (
  // eslint-disable-next-line @next/next/no-img-element -- bandeiras de 1 KB, já no tamanho certo
  <img className="phone-flag" src={`/flags/${iso.toLowerCase()}.png`} alt="" width={20} height={14} loading="lazy" />
);

const plain = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function PhoneInput({
  name,
  value,
  defaultValue = "",
  onChange,
  required,
  label,
}: {
  name?: string; // formulário normal: input escondido com o número completo
  value?: string; // modo controlado (o formulário guarda o número completo)
  defaultValue?: string;
  onChange?: (full: string) => void;
  required?: boolean;
  label?: string;
}) {
  const { locale, t } = useI18n();
  // Nomes dos países na língua da página (o browser já os sabe); em português, os da lista.
  const regionNames = useMemo(() => (locale === "pt" ? null : new Intl.DisplayNames([locale], { type: "region" })), [locale]);
  const countryName = (c: { iso: string; name: string }) => regionNames?.of(c.iso) ?? c.name;
  const id = useId();
  const listId = `${id}-paises`;
  const initial = split(value ?? defaultValue);
  const [iso, setIso] = useState(initial.country?.iso ?? "");
  const [rest, setRest] = useState(initial.rest);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);

  // Sem número já gravado: escolhe o país pela rede (uma vez).
  useEffect(() => {
    if (iso) return;
    let alive = true;
    guessCountry().then((c) => alive && setIso((current) => current || c));
    return () => {
      alive = false;
    };
  }, [iso]);

  // Fecha a lista ao clicar fora.
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const list = useMemo(() => {
    const q = plain(query.trim().replace(/^\+/, ""));
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => plain(regionNames?.of(c.iso) ?? "").includes(q) || plain(c.name).includes(q) || c.dial.startsWith(q) || c.iso.toLowerCase() === q,
    );
  }, [query, regionNames]);

  const country = byIso(iso) ?? COUNTRIES[0];
  const digits = rest.replace(/\D/g, "");
  const full = digits ? `+${country.dial}${national(digits, country.iso)}` : "";

  function update(nextIso: string, nextRest: string) {
    // Colou um número com indicativo (+33…, 0033…): muda o país automaticamente.
    const pasted = split(nextRest);
    if (pasted.country) {
      nextIso = pasted.country.iso;
      nextRest = pasted.rest;
    }
    setIso(nextIso);
    setRest(nextRest);
    const d = nextRest.replace(/\D/g, "");
    const c = byIso(nextIso) ?? COUNTRIES[0];
    onChange?.(d ? `+${c.dial}${national(d, c.iso)}` : "");
  }

  function choose(nextIso: string) {
    update(nextIso, rest);
    setOpen(false);
    setQuery("");
    numberRef.current?.focus();
  }

  function onListKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, list.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault(); // não submeter o formulário
      if (list[active]) choose(list[active].iso);
    }
  }

  return (
    <div className="phone-input" ref={box}>
      <button
        type="button"
        className="phone-country"
        aria-label={fmt(t.phone.changeCountry, { country: countryName(country), dial: country.dial })}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          setActive(0);
        }}
      >
        <Flag iso={country.iso} />
        <span>+{country.dial}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <input
        ref={numberRef}
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        aria-label={label ?? t.phone.label}
        value={rest}
        required={required}
        maxLength={20}
        placeholder={country.iso === "PT" ? "912 345 678" : t.phone.label}
        onChange={(e) => update(country.iso, e.target.value)}
      />
      {name && <input type="hidden" name={name} value={full} />}

      {open && (
        <div className="phone-menu">
          <input
            className="phone-search"
            autoFocus
            placeholder={t.phone.searchCountry}
            aria-label={t.phone.searchAria}
            aria-controls={listId}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onListKey}
          />
          <ul id={listId} role="listbox" aria-label={t.phone.countries} className="phone-list">
            {list.map((c, i) => (
              <li
                key={c.iso}
                role="option"
                aria-selected={c.iso === country.iso}
                className={`${i === active ? "is-active" : ""}${c.iso === country.iso ? " is-selected" : ""}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(c.iso)}
              >
                <Flag iso={c.iso} />
                <span className="phone-name">{countryName(c)}</span>
                <span className="phone-dial">+{c.dial}</span>
              </li>
            ))}
            {!list.length && <li className="phone-empty">{t.phone.noCountry}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
