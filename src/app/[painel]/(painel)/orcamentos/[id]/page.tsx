import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateQuote } from "@/app/actions/admin";
import { startJobFromQuote } from "@/app/actions/sheets";
import { SHEET_COLUMNS, euro, sheetKind, sheetNumber, sheetTotals, type Sheet } from "@/lib/quote-sheet";
import ConfirmedForm from "@/components/admin/ConfirmedForm";
import History from "@/components/admin/History";
import Comments from "@/components/admin/Comments";
import SharePanel from "@/components/admin/SharePanel";
import AvailabilityTable from "@/components/admin/AvailabilityTable";
import { CHIMNEY, CONTACT_PREFERENCE, FUEL, HOME_TYPE, QUOTE_STATUS, WORK_TYPE, formatDate, one, quoteRef, toLocalInput } from "@/lib/labels";
import Directions from "@/components/admin/Directions";
import LocationRequest from "@/components/admin/LocationRequest";
import { whatsappNumber } from "@/lib/notify";
import { panel } from "@/lib/panel";
import { signedPhotoUrls } from "@/lib/quote-photos";

export default async function AdminQuoteDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: q } = await supabase
    .from("quote_requests")
    .select("*, profiles!quote_requests_user_id_fkey(id, full_name, email, phone)")
    .eq("id", id)
    .maybeSingle();
  if (!q) notFound();

  const [photos, { data: sheetRows }, { data: job }] = await Promise.all([
    signedPhotoUrls(q.photos),
    supabase.from("quote_sheets").select(SHEET_COLUMNS).eq("quote_id", id).order("number", { ascending: false }),
    supabase.from("jobs").select("id, title, status").eq("quote_id", id).limit(1).maybeSingle(),
  ]);
  const sheets = (sheetRows ?? []) as Sheet[];
  const sent = sheets.filter((sh) => sh.sent_at);
  const newSheet = panel(`/orcamentos/${q.id}/folha/nova`);
  const account = one(q.profiles) as { id: string; full_name: string; email: string; phone: string } | null;
  const name = account?.full_name || q.name;
  const phone = q.phone || account?.phone || "";
  const email = q.email || account?.email || "";
  const place = q.lat != null ? q.address : [q.address, q.municipality].filter(Boolean).join(", ");
  const wa = whatsappNumber(phone);

  return (
    <>
      <p style={{ margin: "0 0 12px" }}>
        <Link href={panel("/orcamentos")} className="tab">← Pedidos de orçamento</Link>
      </p>
      <div className="grid-2">
        <section className="panel">
          <span className="eyebrow">{quoteRef(q.ref)} · {QUOTE_STATUS[q.status] ?? q.status}</span>
          <h2>{q.category}{q.work_type && ` · ${WORK_TYPE[q.work_type]}`}</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Pedido a {formatDate(q.created_at, true)} ·{" "}
            <Link className="link" href={panel(`/orcamentos/${q.id}/comprovativo`)}>ver comprovativo do cliente</Link>
          </p>

          <dl className="summary">
            <div><dt>Casa</dt><dd>{HOME_TYPE[q.home_type] ?? "—"}{q.area_m2 && ` · ${q.area_m2} m²`}</dd></div>
            <div><dt>Chaminé</dt><dd>{CHIMNEY[q.chimney] ?? "Não indicado"}</dd></div>
            <div><dt>Combustível</dt><dd>{FUEL[q.fuel] ?? "Não indicado"}</dd></div>
            <div>
              <dt>Disponibilidade</dt>
              <dd><AvailabilityTable slots={q.availability} /></dd>
            </div>
            <div><dt>Contactar por</dt><dd>{CONTACT_PREFERENCE[q.contact_preference] ?? "—"}</dd></div>
          </dl>
          {q.message && <p className="reply" style={{ whiteSpace: "pre-wrap" }}>{q.message}</p>}

          {photos.length > 0 && (
            <>
              <h3 style={{ fontSize: 15, margin: "20px 0 8px" }}>Fotos ({photos.length})</h3>
              <div className="photo-grid">
                {photos.map((url, i) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="photo-thumb" title="Abrir em tamanho real">
                    <img src={url} alt={`Foto ${i + 1} do cliente`} />
                  </a>
                ))}
              </div>
            </>
          )}

          <h3 style={{ fontSize: 15, margin: "24px 0 8px" }}>Orçamento</h3>
          {job ? (
            <p className="info-box" style={{ marginTop: 0 }}>
              ✓ O cliente confirmou — obra iniciada:{" "}
              <Link className="link" href={panel(`/obras/${job.id}`)}>{job.title}</Link>
            </p>
          ) : q.status === "orcamento_enviado" && sent.length > 0 ? (
            <div className="info-box" style={{ marginTop: 0 }}>
              <strong>Aguarda confirmação do cliente.</strong> Quando o cliente confirmar (na visita ou por mensagem), inicie a obra —
              fica ligada a este orçamento e a equipa pode adicionar notas.
              <div style={{ marginTop: 12 }}>
                <ConfirmedForm action={startJobFromQuote} labels={{}} mode="create" submitLabel="✓ Cliente confirmou — iniciar obra" confirmTitle="O cliente confirmou o orçamento? Vai ser criada a obra.">
                  <input type="hidden" name="quote_id" value={q.id} />
                </ConfirmedForm>
              </div>
            </div>
          ) : sheets.length === 0 ? (
            <div className="variants">
              <Link className="variant" href={newSheet}>
                <strong>Fazer orçamento já</strong>
                <span>Sem visita — o cliente já sabe o que quer.</span>
              </Link>
              <a className="variant" href="#gerir">
                <strong>Marcar visita técnica</strong>
                <span>Indique a data abaixo e notifique o cliente. Depois da visita, faça o orçamento.</span>
              </a>
              <Link className="variant" href={newSheet}>
                <strong>A visita já foi feita</strong>
                <span>Passe diretamente à folha de orçamento.</span>
              </Link>
            </div>
          ) : null}
          {sheets.length > 0 && (
            <ul className="list" style={{ gap: 6, marginTop: 12 }}>
              {sheets.map((sh) => (
                <li key={sh.id} className="item">
                  <div className="item-head">
                    <Link className="link" href={panel(`/orcamentos/${q.id}/folha/${sh.id}`)}><strong>{sheetKind(sh)} n.º {sheetNumber(sh.number)}</strong></Link>
                    <span className="badge">{sh.sent_at ? `Enviado a ${formatDate(sh.sent_at)}` : "Rascunho"}</span>
                  </div>
                  <div className="muted">{sh.items.length} linha{sh.items.length === 1 ? "" : "s"} · Total {euro(sheetTotals(sh).total)}</div>
                </li>
              ))}
            </ul>
          )}
          {sheets.length > 0 && !job && (
            <p style={{ margin: "10px 0 0" }}>
              <Link className="link" href={newSheet}>+ Nova folha de orçamento</Link>
            </p>
          )}

          <h3 id="gerir" style={{ fontSize: 15, margin: "24px 0 8px" }}>Gerir</h3>
          <ConfirmedForm
            action={updateQuote}
            labels={{ status: "Estado", visit_at: "Visita técnica", admin_reply: "Mensagem / orçamento" }}
          >
            <input type="hidden" name="id" value={q.id} />
            <label className="field">
              Estado
              <select name="status" defaultValue={q.status}>
                {Object.entries(QUOTE_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="field">
              Data e hora da visita técnica
              <input type="datetime-local" name="visit_at" defaultValue={toLocalInput(q.visit_at)} />
            </label>
            <label className="field">
              Mensagem / orçamento <span className="hint">Visível para o cliente na área de cliente, se tiver conta</span>
              <textarea name="admin_reply" defaultValue={q.admin_reply ?? ""} style={{ minHeight: 90 }} />
            </label>
          </ConfirmedForm>
        </section>

        <section className="panel">
          <h2>Cliente</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            <strong>
              {account ? <Link className="link" href={panel(`/clientes/${account.id}`)}>{name}</Link> : name}
            </strong>
            {!account && <span className="pref" style={{ marginLeft: 8 }}>Sem conta</span>}
            {phone && <><br /><a className="link" href={`tel:${phone}`}>{phone}</a></>}
            {email && <><br /><a className="link" href={`mailto:${email}`}>{email}</a></>}
          </p>
          <div className="row">
            {phone && <a className="btn btn-ink btn-sm" href={`tel:${phone}`}>Ligar</a>}
            {wa && <a className="btn btn-whatsapp btn-sm" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer">WhatsApp</a>}
          </div>

          <h2 style={{ marginTop: 24 }}>Morada da obra</h2>
          <p style={{ marginTop: 0 }}>
            {place || "—"}
            {q.address_details && <><br /><span className="muted">{q.address_details}</span></>}
            {q.lat != null && q.municipality && <><br /><span className="muted">Concelho: {q.municipality}</span></>}
            {q.outside_area && <><br /><span className="pref pref-fora">Fora da zona de visita gratuita</span></>}
          </p>
          {place && <Directions address={place} lat={q.lat} lng={q.lng} />}
          <LocationRequest entity="quote_requests" id={q.id} hasLocation={q.lat != null || Boolean(place)} />

          <h2 style={{ marginTop: 24 }}>Obra</h2>
          {job ? (
            <Link className="link" href={panel(`/obras/${job.id}`)}>Abrir a obra: {job.title}</Link>
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              A obra é criada quando o cliente confirmar o orçamento (botão “Cliente confirmou — iniciar obra”).
            </p>
          )}
        </section>
      </div>
      <div className="grid-2" style={{ marginTop: 20 }}>
        <Comments quoteId={q.id} isAdmin />
        {account ? (
          <section className="panel">
            <h2>Partilhar com a equipa</h2>
            <p className="muted" style={{ margin: 0 }}>
              Este pedido é de um cliente com conta. Partilhe a ficha do cliente — inclui este pedido:{" "}
              <Link className="link" href={panel(`/clientes/${account.id}`)}>abrir ficha de {name}</Link>.
            </p>
          </section>
        ) : (
          <SharePanel quoteId={q.id} />
        )}
      </div>
      <div style={{ marginTop: 20 }}>
        <History entityId={q.id} />
      </div>
    </>
  );
}
