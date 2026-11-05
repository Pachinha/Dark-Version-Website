import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteJob, updateJob } from "@/app/actions/admin";
import ConfirmedForm from "@/components/admin/ConfirmedForm";
import History from "@/components/admin/History";
import ClientCard from "@/components/admin/ClientCard";
import LocationRequest from "@/components/admin/LocationRequest";
import JobFields, { JOB_LABELS } from "@/components/admin/JobFields";
import JobNotes from "@/components/admin/JobNotes";
import { SHEET_COLUMNS, euro, lineTotal, sheetKind, sheetNumber, sheetTotals, type Sheet } from "@/lib/quote-sheet";
import { JOB_STATUS, formatDate } from "@/lib/labels";
import { panel } from "@/lib/panel";

export default async function AdminJobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireStaff();
  const isAdmin = profile.role === "admin";
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*, client:profiles!jobs_user_id_fkey(id, full_name, email, phone), addresses(*), quote:quote_requests(id, name, email, phone, address, address_details, municipality, lat, lng)")
    .eq("id", id)
    .maybeSingle();
  if (!job) notFound();

  // Obra de um pedido feito sem conta: contactos e morada vêm do pedido.
  const quote = job.quote as { id: string; name: string; email: string; phone: string; address: string; address_details: string; municipality: string; lat: number | null; lng: number | null } | null;
  // Sem conta: primeiro os contactos registados na própria obra, depois os do pedido de orçamento.
  const found = job.client
    ?? (job.name ? { id: "", full_name: job.name, email: job.email, phone: job.phone } : null)
    ?? (quote ? { id: "", full_name: quote.name, email: quote.email, phone: quote.phone } : null);
  // A ligação abre a ficha do cliente (com ou sem conta).
  const client = found && { ...found, id: job.customer_id ?? found.id };
  const address = job.addresses
    ?? (job.address ? { label: "Obra", address: job.address, details: job.address_details, lat: job.lat, lng: job.lng } : null)
    ?? (quote && (quote.address || quote.municipality)
    ? { label: "Obra", address: quote.address || quote.municipality, details: quote.address_details, lat: quote.lat, lng: quote.lng }
    : null);

  const [{ data: addresses }, { data: staff }, { data: sheet }] = await Promise.all([
    isAdmin && job.user_id
      ? supabase.from("addresses").select("id, label, address").eq("user_id", job.user_id).order("created_at")
      : Promise.resolve({ data: [] }),
    isAdmin
      ? supabase.from("profiles").select("id, full_name").in("role", ["admin", "tecnico"]).order("full_name")
      : Promise.resolve({ data: [] }),
    job.quote_id
      ? supabase.from("quote_sheets").select(SHEET_COLUMNS).eq("quote_id", job.quote_id).not("sent_at", "is", null)
          .order("sent_at", { ascending: false }).limit(1).maybeSingle<Sheet>()
      : Promise.resolve({ data: null }),
  ]);
  return (
    <>
      <p style={{ margin: "0 0 12px" }}>
        <Link href={panel("/obras")} className="tab">← Obras</Link>
      </p>
      <div className="grid-2">
        <section className="panel">
          <span className="eyebrow">{JOB_STATUS[job.status]}</span>
          <h2>{job.title}</h2>
          <p className="muted" style={{ marginTop: 0 }}>Criada a {formatDate(job.created_at)}</p>
          <ConfirmedForm action={updateJob} labels={JOB_LABELS}>
            <input type="hidden" name="id" value={job.id} />
            <JobFields job={job} addresses={addresses ?? []} staff={staff ?? []} isAdmin={isAdmin} />
          </ConfirmedForm>
        </section>
        <div>
          <ClientCard client={client} address={address} linkToClient={isAdmin && Boolean(job.customer_id || job.client)}>
          {isAdmin && <LocationRequest entity="jobs" id={job.id} hasLocation={Boolean(address)} />}
        </ClientCard>
          {sheet && (
            <section className="panel" style={{ marginTop: 20 }}>
              <h2>Orçamento confirmado</h2>
              <p className="muted" style={{ marginTop: 0 }}>
                {sheetKind(sheet)} n.º {sheetNumber(sheet.number)} · Total {euro(sheetTotals(sheet).total)} (IVA incl.) ·{" "}
                <a className="link" href={`/orcamento/${sheet.token}`} target="_blank" rel="noreferrer">ver PDF ↗</a>
              </p>
              <ul className="list" style={{ gap: 4 }}>
                {sheet.items.map((item, i) => (
                  <li key={i} className="muted" style={{ display: "flex", gap: 8 }}>
                    <span style={{ minWidth: 34 }}>{String(item.qty).replace(".", ",")} ×</span>
                    <span style={{ flex: 1 }}>{item.description}</span>
                    {isAdmin && <span style={{ fontVariantNumeric: "tabular-nums" }}>{euro(lineTotal(item))}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {isAdmin && (
            <section className="panel" style={{ marginTop: 20 }}>
              <h2>Apagar obra</h2>
              <ConfirmedForm
                action={deleteJob}
                labels={{}}
                mode="create"
                danger
                submitLabel="Apagar obra"
                confirmTitle="Apagar esta obra? Esta ação não pode ser desfeita."
              >
                <input type="hidden" name="id" value={job.id} />
              </ConfirmedForm>
            </section>
          )}
        </div>
      </div>
      <div style={{ marginTop: 20 }}>
        <JobNotes jobId={job.id} isAdmin={isAdmin} />
      </div>
      <div style={{ marginTop: 20 }}>
        <History entityId={job.id} />
      </div>
    </>
  );
}
