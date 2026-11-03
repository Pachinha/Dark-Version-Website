import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePanel } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import AvailabilityTable from "@/components/admin/AvailabilityTable";
import Comments from "@/components/admin/Comments";
import Directions from "@/components/admin/Directions";
import { CHIMNEY, CONTACT_PREFERENCE, FUEL, HOME_TYPE, QUOTE_STATUS, WORK_TYPE, formatDate, formatTime, one, quoteRef } from "@/lib/labels";
import { whatsappNumber } from "@/lib/notify";
import { panel } from "@/lib/panel";
import { signedPhotoUrls } from "@/lib/quote-photos";

// Pedido de orçamento partilhado — só leitura. A base de dados (RLS) só o devolve
// se foi partilhado com quem está a ver (diretamente ou através do cliente).
export default async function SharedQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requirePanel();
  const { id } = await params;
  const supabase = await createClient();

  const { data: q } = await supabase
    .from("quote_requests")
    .select("*, profiles!quote_requests_user_id_fkey(id, full_name, email, phone)")
    .eq("id", id)
    .maybeSingle();
  if (!q) notFound();

  // Só depois de a base de dados confirmar o acesso é que se geram os links das fotos.
  const photos = await signedPhotoUrls(q.photos);
  const account = one(q.profiles) as { id: string; full_name: string; email: string; phone: string } | null;
  const name = account?.full_name || q.name;
  const phone = q.phone || account?.phone || "";
  const email = q.email || account?.email || "";
  const place = q.lat != null ? q.address : [q.address, q.municipality].filter(Boolean).join(", ");
  const wa = whatsappNumber(phone);

  return (
    <>
      <p style={{ margin: "0 0 12px" }}>
        <Link href={panel("/partilhados")} className="tab">← Partilhados comigo</Link>
      </p>
      <div className="grid-2">
        <section className="panel">
          <span className="eyebrow">{quoteRef(q.ref)} · {QUOTE_STATUS[q.status] ?? q.status} · só consulta</span>
          <h2>{q.category}{q.work_type && ` · ${WORK_TYPE[q.work_type]}`}</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Pedido a {formatDate(q.created_at, true)}
            {q.visit_at && <> · visita a {formatDate(q.visit_at)} às {formatTime(q.visit_at)}</>}
          </p>
          <dl className="summary">
            <div><dt>Casa</dt><dd>{HOME_TYPE[q.home_type] ?? "—"}{q.area_m2 && ` · ${q.area_m2} m²`}</dd></div>
            <div><dt>Chaminé</dt><dd>{CHIMNEY[q.chimney] ?? "Não indicado"}</dd></div>
            <div><dt>Combustível</dt><dd>{FUEL[q.fuel] ?? "Não indicado"}</dd></div>
            <div><dt>Disponibilidade</dt><dd><AvailabilityTable slots={q.availability} /></dd></div>
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
        </section>

        <section className="panel">
          <h2>Cliente</h2>
          <p style={{ marginTop: 0, lineHeight: 1.7 }}>
            <strong>{name}</strong>
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
          </p>
          {place && <Directions address={place} lat={q.lat} lng={q.lng} />}
        </section>
      </div>

      <div style={{ marginTop: 20 }}>
        <Comments quoteId={q.id} isAdmin={profile.role === "admin"} />
      </div>
    </>
  );
}
