import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateQuote } from "@/app/actions/admin";
import ConfirmedForm from "@/components/admin/ConfirmedForm";
import History from "@/components/admin/History";
import AvailabilityTable from "@/components/admin/AvailabilityTable";
import { CHIMNEY, CONTACT_PREFERENCE, FUEL, HOME_TYPE, QUOTE_STATUS, WORK_TYPE, formatDate, one, quoteRef, toLocalInput } from "@/lib/labels";
import { googleMapsSearchUrl, wazeSearchUrl } from "@/lib/geo";
import { whatsappNumber } from "@/lib/notify";
import { panel } from "@/lib/panel";
import { signedPhotoUrls } from "@/lib/quote-photos";

export default async function AdminQuoteDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: q } = await supabase
    .from("quote_requests")
    .select("*, profiles(id, full_name, email, phone)")
    .eq("id", id)
    .maybeSingle();
  if (!q) notFound();

  const photos = await signedPhotoUrls(q.photos);
  const account = one(q.profiles) as { id: string; full_name: string; email: string; phone: string } | null;
  const name = account?.full_name || q.name;
  const phone = q.phone || account?.phone || "";
  const email = q.email || account?.email || "";
  const place = [q.address, q.municipality].filter(Boolean).join(", ");
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
            <Link className="link" href={`/pedido/${q.id}`} target="_blank">ver comprovativo do cliente ↗</Link>
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

          <h3 style={{ fontSize: 15, margin: "24px 0 8px" }}>Gerir</h3>
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
            {q.outside_area && <><br /><span className="pref pref-fora">Fora da zona de visita gratuita</span></>}
          </p>
          {place && (
            <div className="row">
              <a className="btn btn-fire btn-sm" href={googleMapsSearchUrl(place)} target="_blank" rel="noreferrer">Abrir no Google Maps</a>
              <a className="btn btn-ink btn-sm" href={wazeSearchUrl(place)} target="_blank" rel="noreferrer">Navegar com Waze</a>
            </div>
          )}

          <h2 style={{ marginTop: 24 }}>Obra</h2>
          {account ? (
            <Link className="link" href={panel(`/obras/nova?cliente=${account.id}&orcamento=${q.id}`)}>
              + Criar obra a partir deste orçamento
            </Link>
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              Para criar a obra no painel, o cliente precisa de conta.{" "}
              {email ? (
                <>Quando se registar com o email <strong>{email}</strong>, este pedido passa automaticamente para a conta.</>
              ) : (
                <>Este pedido foi feito sem email, por isso não passa sozinho para uma conta nova.</>
              )}
            </p>
          )}
        </section>
      </div>
      <div style={{ marginTop: 20 }}>
        <History entityId={q.id} />
      </div>
    </>
  );
}
