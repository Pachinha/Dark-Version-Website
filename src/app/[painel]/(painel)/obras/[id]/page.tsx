import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteJob, updateJob } from "@/app/actions/admin";
import ConfirmedForm from "@/components/admin/ConfirmedForm";
import History from "@/components/admin/History";
import ClientCard from "@/components/admin/ClientCard";
import JobFields, { JOB_LABELS } from "@/components/admin/JobFields";
import { JOB_STATUS, formatDate } from "@/lib/labels";
import { panel } from "@/lib/panel";

export default async function AdminJobDetail({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireStaff();
  const isAdmin = profile.role === "admin";
  const { id } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*, client:profiles!jobs_user_id_fkey(id, full_name, email, phone), addresses(*)")
    .eq("id", id)
    .maybeSingle();
  if (!job) notFound();

  const [{ data: addresses }, { data: staff }] = isAdmin
    ? await Promise.all([
        supabase.from("addresses").select("id, label, address").eq("user_id", job.user_id).order("created_at"),
        supabase.from("profiles").select("id, full_name").in("role", ["admin", "tecnico"]).order("full_name"),
      ])
    : [{ data: [] }, { data: [] }];

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
          <ClientCard client={job.client} address={job.addresses} linkToClient={isAdmin} />
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
        <History entityId={job.id} />
      </div>
    </>
  );
}
