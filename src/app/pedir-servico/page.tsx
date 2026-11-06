import Link from "next/link";
import Shell from "@/components/account/Shell";
import { getCurrentUser } from "@/lib/auth";
import { MAINTENANCE_SERVICE } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { getI18n, pageMetadata } from "@/lib/i18n/server";
import ServiceWizard, { type SavedAddress } from "./ServiceWizard";

export async function generateMetadata() {
  const { t } = await getI18n();
  return pageMetadata((d) => d.service.meta, { description: t.service.metaDescription });
}

// Pedir limpeza, manutenção ou assistência — não é preciso conta. Com sessão iniciada,
// os contactos e as moradas guardadas já vêm preenchidos e o pedido aparece na área de cliente.
export default async function PedirServicoPage({ searchParams }: { searchParams: Promise<{ servico?: string }> }) {
  const { t } = await getI18n();
  const s = t.service;
  const q = t.quote;
  const { servico } = await searchParams;
  const current = await getCurrentUser();
  const profile = current?.profile;

  let savedAddresses: SavedAddress[] = [];
  if (current) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("addresses")
      .select("id, label, address, details, postcode, locality, lat, lng")
      .eq("user_id", current.user.id)
      .order("created_at");
    savedAddresses = data ?? [];
  }

  return (
    <Shell signedIn={!!current} languages>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <span className="eyebrow">{s.eyebrow}</span>
        <h1 className="page-title" style={{ color: "#f2ece2" }}>{s.title}</h1>
        <p className="muted-light" style={{ margin: "0 0 20px", lineHeight: 1.6 }}>{s.lead}</p>
        {!current && (
          <div className="account-hint">
            <p>
              <strong>{s.noAccount}</strong> {q.signInHint} <Link href={`/entrar?next=${encodeURIComponent("/pedir-servico")}`}>{q.signInLink}</Link>.
            </p>
            <p>
              {q.registerHint} <Link href="/registar">{q.registerLink}</Link>.{q.accountPtOnly && <> {q.accountPtOnly}</>}
            </p>
          </div>
        )}
        <section className="panel">
          <ServiceWizard
            signedIn={!!current}
            savedAddresses={savedAddresses}
            initialService={servico && servico in MAINTENANCE_SERVICE ? servico : ""}
            contact={{ name: profile?.full_name ?? "", phone: profile?.phone ?? "", email: profile?.email ?? "" }}
          />
        </section>
      </div>
    </Shell>
  );
}
