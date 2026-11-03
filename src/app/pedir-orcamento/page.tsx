import Link from "next/link";
import Shell from "@/components/account/Shell";
import { getCurrentUser } from "@/lib/auth";
import { FUEL, QUOTE_PRODUCTS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import QuoteWizard, { type SavedAddress } from "./QuoteWizard";

export const metadata = {
  title: "Pedir orçamento — Lareiras Pachinha",
  description: "Peça o seu orçamento em 2 minutos. Visita técnica gratuita e sem compromisso no Alto Minho.",
};

export default async function PedirOrcamentoPage({ searchParams }: { searchParams: Promise<{ tipo?: string; combustivel?: string }> }) {
  const { tipo, combustivel } = await searchParams;
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
    <Shell signedIn={!!current}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <span className="eyebrow">Orçamento gratuito</span>
        <h1 className="page-title" style={{ color: "#f2ece2" }}>Pedir orçamento</h1>
        <p className="muted-light" style={{ margin: "0 0 20px", lineHeight: 1.6 }}>
          Responda a umas perguntas rápidas — leva cerca de 2 minutos. Depois marcamos uma visita técnica, sem
          compromisso, e enviamos o orçamento feito à medida da sua casa.
        </p>
        {!current && (
          <div className="account-hint">
            <p>
              <strong>Não precisa de conta para pedir orçamento.</strong> Se quiser guardar e acompanhar o histórico dos
              seus pedidos, <Link href="/entrar?next=/pedir-orcamento">entre aqui</Link>.
            </p>
            <p>
              Ainda não tem conta? <Link href="/registar">Registe-se aqui</Link>.
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
            }}
            contact={{ name: profile?.full_name ?? "", phone: profile?.phone ?? "", email: profile?.email ?? "" }}
          />
        </section>
      </div>
    </Shell>
  );
}
