import Link from "next/link";
import Shell from "@/components/account/Shell";
import { getCurrentUser } from "@/lib/auth";
import QuoteWizard from "./QuoteWizard";

export const metadata = {
  title: "Pedir orçamento — Lareiras Pachinha",
  description: "Peça o seu orçamento em 2 minutos. Visita técnica gratuita e sem compromisso no Alto Minho.",
};

export default async function PedirOrcamentoPage() {
  const current = await getCurrentUser();
  const profile = current?.profile;

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
            contact={{ name: profile?.full_name ?? "", phone: profile?.phone ?? "", email: profile?.email ?? "" }}
          />
        </section>
      </div>
    </Shell>
  );
}
