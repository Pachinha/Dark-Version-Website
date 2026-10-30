import { redirect } from "next/navigation";
import Shell from "@/components/account/Shell";
import { MfaVerifyForm } from "@/components/account/MfaForms";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Verificação — Lareiras Pachinha" };

export default async function VerificarPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const current = await getCurrentUser();
  if (!current) redirect("/entrar");
  if (!current.hasMfa || current.mfaVerified) redirect("/conta");
  const { next } = await searchParams;

  return (
    <Shell signedIn>
      <div className="panel auth-card">
        <span className="eyebrow">Verificação em dois passos</span>
        <h1>Introduza o código</h1>
        <p className="muted" style={{ marginTop: 0, marginBottom: 20 }}>
          Abra a app de autenticação no seu telemóvel e escreva o código de 6 dígitos de “Lareiras Pachinha”.
        </p>
        <MfaVerifyForm next={next?.startsWith("/") && !next.startsWith("//") ? next : "/conta"} />
      </div>
    </Shell>
  );
}
