import Link from "next/link";
import Shell from "@/components/account/Shell";
import { getCurrentUser } from "@/lib/auth";
import { FUEL, QUOTE_PRODUCTS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { fmt } from "@/lib/i18n/config";
import { getI18n, pageMetadata } from "@/lib/i18n/server";
import QuoteWizard, { type SavedAddress } from "./QuoteWizard";

export async function generateMetadata() {
  const { t } = await getI18n();
  return pageMetadata((d) => d.quote.meta, { description: t.quote.metaDescription });
}

export default async function PedirOrcamentoPage({ searchParams }: { searchParams: Promise<{ tipo?: string; combustivel?: string; modelo?: string }> }) {
  const { t } = await getI18n();
  const q = t.quote;
  const { tipo, combustivel, modelo } = await searchParams;
  const current = await getCurrentUser();
  const profile = current?.profile;

  // Quem tem conta pode usar uma das moradas já guardadas (verificadas) na área de cliente.
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
        <span className="eyebrow">{q.eyebrow}</span>
        <h1 className="page-title" style={{ color: "#f2ece2" }}>{q.title}</h1>
        <p className="muted-light" style={{ margin: "0 0 20px", lineHeight: 1.6 }}>
          {q.lead}
        </p>
        {!current && (
          <div className="account-hint">
            <p>
              <strong>{q.noAccount}</strong> {q.signInHint} <Link href="/entrar?next=/pedir-orcamento">{q.signInLink}</Link>.
            </p>
            <p>
              {q.registerHint} <Link href="/registar">{q.registerLink}</Link>.{q.accountPtOnly && <> {q.accountPtOnly}</>}
            </p>
          </div>
        )}
        <section className="panel">
          <QuoteWizard
            signedIn={!!current}
            savedAddresses={savedAddresses}
            // Vindo de um produto do catálogo, o tipo e o combustível já vêm escolhidos.
            initial={{
              category: tipo && tipo in QUOTE_PRODUCTS ? tipo : "",
              fuel: combustivel && combustivel in FUEL ? combustivel : "",
              // Vindo da página de um produto: o modelo já fica escrito na mensagem.
              message: modelo ? fmt(t.product.modelPrefill, { model: modelo.slice(0, 160) }) : "",
            }}
            contact={{ name: profile?.full_name ?? "", phone: profile?.phone ?? "", email: profile?.email ?? "" }}
          />
        </section>
      </div>
    </Shell>
  );
}
