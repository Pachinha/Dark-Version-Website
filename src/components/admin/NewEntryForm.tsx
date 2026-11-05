"use client";

import { useMemo, useState } from "react";
import { clientAddresses, createEntry, customerPastPlaces, type ClientAddress, type PastPlace } from "@/app/actions/entries";
import ConfirmedForm from "@/components/admin/ConfirmedForm";
import PlaceSearch, { type Place } from "@/components/account/PlaceSearch";
import { MAINTENANCE_SERVICE } from "@/lib/labels";
import PhoneInput from "@/components/PhoneInput";

type Kind = "orcamento" | "visita" | "manutencao" | "obra";
// Ficha de cliente (com ou sem conta no site). id = ficha; user_id = conta, se tiver.
type Client = { id: string; user_id: string | null; full_name: string; email: string; phone: string };
type Staff = { id: string; full_name: string };

const KINDS: { value: Kind; title: string; hint: string }[] = [
  { value: "orcamento", title: "Pedido de orçamento", hint: "Cliente quer orçamento — depois faz a folha." },
  { value: "visita", title: "Visita técnica", hint: "Marcar a visita para orçamentar no local." },
  { value: "manutencao", title: "Limpeza / manutenção", hint: "Limpeza de chaminé, manutenção, assistência." },
  { value: "obra", title: "Obra", hint: "Instalação já combinada com o cliente." },
];

// Rótulos mostrados no "Deseja mesmo criar isto?" — dependem do tipo.
const LABELS: Record<Kind, Record<string, string>> = {
  orcamento: { name: "Cliente", category: "Equipamento", message: "Notas" },
  visita: { name: "Cliente", category: "Equipamento", visit_at: "Visita", technician_id: "Técnico" },
  manutencao: { name: "Cliente", service: "Serviço", equipment: "Equipamento", scheduled_for: "Data", technician_id: "Técnico" },
  obra: { name: "Cliente", title: "Obra", scheduled_start: "Início", scheduled_end: "Fim previsto", technician_id: "Técnico" },
};

const toPlace = (p: PastPlace): Place => ({ address: p.address, postcode: "", locality: "", lat: p.lat, lng: p.lng, source: "search" });

export default function NewEntryForm({
  initialKind,
  initialClient,
  clients,
  staff,
  categories,
}: {
  initialKind: Kind;
  // Cliente já escolhido ("+ Novo registo" na ficha), com as moradas carregadas pelo servidor.
  initialClient?: { client: Client; saved: ClientAddress[]; past: PastPlace[] } | null;
  clients: Client[];
  staff: Staff[];
  categories: string[];
}) {
  const [kind, setKind] = useState<Kind>(initialKind);
  const [mode, setMode] = useState<"novo" | "conta">(initialClient ? "conta" : "novo");
  const [search, setSearch] = useState("");
  const [account, setAccount] = useState<Client | null>(initialClient?.client ?? null);
  const [past, setPast] = useState<PastPlace[]>(initialClient?.past ?? []);
  const [details, setDetails] = useState(initialClient?.past[0]?.details ?? "");
  const [saved, setSaved] = useState<ClientAddress[]>(initialClient?.saved ?? []);
  const [addressId, setAddressId] = useState(initialClient?.saved[0]?.id ?? "");
  const [place, setPlace] = useState<Place | null>(initialClient?.past[0] ? toPlace(initialClient.past[0]) : null);
  const [askClient, setAskClient] = useState(false);

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term.length < 2) return [];
    return clients.filter((c) => `${c.full_name} ${c.email} ${c.phone}`.toLowerCase().includes(term)).slice(0, 8);
  }, [clients, search]);

  async function chooseAccount(c: Client) {
    setAccount(c);
    setSearch("");
    setPlace(null);
    setDetails("");
    setPast([]);
    if (c.user_id) {
      const list = await clientAddresses(c.user_id);
      setSaved(list);
      setAddressId(list[0]?.id ?? "");
    } else {
      // Cliente sem conta: sugere as moradas dos pedidos anteriores.
      setSaved([]);
      setAddressId("");
      const list = await customerPastPlaces(c.id);
      setPast(list);
      if (list[0]) applyPast(list[0]);
    }
  }
  function applyPast(p: PastPlace) {
    setPlace(toPlace(p));
    setDetails(p.details);
  }
  function clearAccount() {
    setAccount(null);
    setSaved([]);
    setAddressId("");
    setPast([]);
    setPlace(null);
    setDetails("");
  }

  const needsAddress = kind !== "orcamento";
  const techSelect = (
    <label className="field">
      Técnico <span className="hint">Aparece-lhe na agenda</span>
      <select name="technician_id" defaultValue="">
        <option value="">— Sem técnico —</option>
        {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name || "(sem nome)"}</option>)}
      </select>
    </label>
  );

  return (
    <>
      <div className="variants" role="radiogroup" aria-label="Tipo de registo" style={{ marginBottom: 20 }}>
        {KINDS.map((k) => (
          <button
            key={k.value}
            type="button"
            role="radio"
            aria-checked={kind === k.value}
            className={`variant${kind === k.value ? " variant-on" : ""}`}
            onClick={() => setKind(k.value)}
            style={{ textAlign: "left", font: "inherit", cursor: "pointer" }}
          >
            <strong>{k.title}</strong>
            <span>{k.hint}</span>
          </button>
        ))}
      </div>

      <ConfirmedForm key={kind} action={createEntry} labels={LABELS[kind]} mode="create" submitLabel="Criar registo" confirmTitle="Criar este registo?">
        <input type="hidden" name="kind" value={kind} />

        {/* ── Cliente ── */}
        <h3 style={{ fontSize: 15, margin: 0 }}>Cliente</h3>
        <div className="row">
          <button type="button" className={`btn btn-sm ${mode === "novo" ? "btn-ink" : "btn-ghost"}`} onClick={() => { setMode("novo"); clearAccount(); }}>
            Cliente novo
          </button>
          <button type="button" className={`btn btn-sm ${mode === "conta" ? "btn-ink" : "btn-ghost"}`} onClick={() => setMode("conta")}>
            Cliente já registado
          </button>
        </div>

        {mode === "novo" ? (
          <div className="grid-2">
            <label className="field">
              Nome
              <input name="name" required maxLength={120} autoComplete="off" />
            </label>
            <div className="field">
              Telefone
              <PhoneInput name="phone" />
            </div>
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              Email <span className="hint">Opcional — para enviar avisos e orçamentos por email</span>
              <input name="email" type="email" maxLength={200} autoComplete="off" />
            </label>
          </div>
        ) : account ? (
          <div className="item">
            <div className="item-head">
              <strong>{account.full_name || "(sem nome)"}</strong>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearAccount}>Trocar</button>
            </div>
            <div className="muted">{[account.email, account.phone].filter(Boolean).join(" · ")} · {account.user_id ? "com conta" : "sem conta"}</div>
            <input type="hidden" name="customer_id" value={account.id} />
            {account.user_id ? (
              <input type="hidden" name="user_id" value={account.user_id} />
            ) : (
              <>
                <input type="hidden" name="phone" value={account.phone} />
                <input type="hidden" name="email" value={account.email} />
              </>
            )}
            <input type="hidden" name="name" value={account.full_name} />
          </div>
        ) : (
          <>
            <label className="field">
              Pesquisar cliente <span className="hint">Nome, email ou telefone</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)} autoComplete="off" />
            </label>
            {matches.length > 0 && (
              <ul className="list" style={{ gap: 6 }}>
                {matches.map((c) => (
                  <li key={c.id}>
                    <button type="button" className="item" style={{ width: "100%", textAlign: "left", font: "inherit", cursor: "pointer" }} onClick={() => chooseAccount(c)}>
                      <strong>{c.full_name || "(sem nome)"}</strong> <span className="muted">· {[c.phone, c.email].filter(Boolean).join(" · ")}{c.user_id ? " · com conta" : ""}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {search.trim().length >= 2 && !matches.length && <p className="hint" style={{ margin: 0 }}>Nenhum cliente encontrado. Use “Cliente novo”.</p>}
          </>
        )}

        {/* ── Morada ── */}
        <h3 style={{ fontSize: 15, margin: "8px 0 0" }}>Morada {needsAddress ? "" : <span className="hint">(opcional)</span>}</h3>
        {askClient ? (
          <div className="info-box" style={{ margin: 0 }}>
            <input type="hidden" name="ask_location" value="on" />
            <strong>📍 A localização vai ser pedida ao cliente.</strong> Depois de criar, abre-se a mensagem com o link para
            enviar por WhatsApp ou email. Quando o cliente partilhar, a morada fica no registo e recebe um aviso no Telegram.
            <div style={{ marginTop: 10 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAskClient(false)}>✎ Escrever a morada em vez disso</button>
            </div>
          </div>
        ) : (
        <>
        {/* No lugar do "usar a minha localização" (a localização da Sandra não interessa): */}
        <button type="button" className="btn btn-ink" onClick={() => { setAskClient(true); setPlace(null); setAddressId(""); }}>
          📍 Pedir localização ao cliente
        </button>
        <p className="hint" style={{ margin: 0 }}>Envia ao cliente um link para partilhar a localização. Ou escolha/pesquise a morada abaixo.</p>
        {saved.length > 0 && (
          <label className="field">
            Morada guardada do cliente
            <select name="address_id" value={addressId} onChange={(e) => { setAddressId(e.target.value); setPlace(null); }}>
              {saved.map((a) => <option key={a.id} value={a.id}>{a.label}: {a.address}</option>)}
              <option value="">Outra morada…</option>
            </select>
          </label>
        )}
        {past.length > 1 && (
          <label className="field">
            Morada usada antes
            <select onChange={(e) => { const p = past[Number(e.target.value)]; if (p) applyPast(p); else { setPlace(null); setDetails(""); } }} defaultValue="0">
              {past.map((p, i) => <option key={i} value={i}>{p.address}{p.details ? ` (${p.details})` : ""}</option>)}
              <option value="-1">Outra morada…</option>
            </select>
          </label>
        )}
        {!addressId && (
          place ? (
            <div className="item">
              <div className="item-head">
                <strong>{place.address}</strong>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPlace(null)}>Alterar</button>
              </div>
              <input type="hidden" name="address" value={place.address} />
              <input type="hidden" name="postcode" value={place.postcode} />
              <input type="hidden" name="lat" value={place.lat} />
              <input type="hidden" name="lng" value={place.lng} />
              <label className="field" style={{ marginTop: 10 }}>
                Nº de porta, andar, indicações
                <input name="address_details" maxLength={200} value={details} onChange={(e) => setDetails(e.target.value)} />
              </label>
            </div>
          ) : (
            <PlaceSearch onSelect={setPlace} allowGps={false} />
          )
        )}
        </>
        )}

        {/* ── Detalhes por tipo ── */}
        <h3 style={{ fontSize: 15, margin: "8px 0 0" }}>Detalhes</h3>
        {(kind === "orcamento" || kind === "visita") && (
          <>
            <label className="field">
              Equipamento
              <select name="category" required defaultValue="">
                <option value="" disabled>Escolha…</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            {kind === "visita" && (
              <div className="grid-2">
                <label className="field">
                  Data e hora da visita
                  <input type="datetime-local" name="visit_at" required />
                </label>
                {techSelect}
              </div>
            )}
            <label className="field">
              Notas <span className="hint">O que o cliente pediu, medidas, etc.</span>
              <textarea name="message" maxLength={2000} style={{ minHeight: 80 }} />
            </label>
          </>
        )}

        {kind === "manutencao" && (
          <>
            <div className="grid-2">
              <label className="field">
                Serviço
                <select name="service" required defaultValue="limpeza">
                  {Object.entries(MAINTENANCE_SERVICE).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label className="field">
                Equipamento
                <input name="equipment" required maxLength={200} placeholder="Ex.: recuperador a lenha" />
              </label>
              <label className="field">
                Data e hora <span className="hint">Vazio = fica “por agendar”</span>
                <input type="datetime-local" name="scheduled_for" />
              </label>
              <label className="field">
                Duração (minutos)
                <input name="duration_minutes" type="number" min={15} max={1440} step={15} defaultValue={120} />
              </label>
            </div>
            {techSelect}
            <label className="field">
              Notas
              <textarea name="notes" maxLength={2000} style={{ minHeight: 70 }} />
            </label>
          </>
        )}

        {kind === "obra" && (
          <>
            <label className="field">
              Título da obra
              <input name="title" required maxLength={200} placeholder="Ex.: Instalação de recuperador" />
            </label>
            <div className="grid-2">
              <label className="field">
                Início <span className="hint">Vazio = fica “por agendar”</span>
                <input type="datetime-local" name="scheduled_start" />
              </label>
              <label className="field">
                Fim previsto
                <input type="datetime-local" name="scheduled_end" />
              </label>
            </div>
            {techSelect}
            <label className="field">
              Descrição
              <textarea name="description" maxLength={4000} style={{ minHeight: 80 }} />
            </label>
          </>
        )}
      </ConfirmedForm>
    </>
  );
}
