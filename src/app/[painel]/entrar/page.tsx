import { notFound, redirect } from "next/navigation";
import Shell from "@/components/account/Shell";
import LoginForm from "@/app/entrar/LoginForm";
import { MfaEnroll, MfaVerifyForm } from "@/components/account/MfaForms";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { panel } from "@/lib/panel";

export const metadata = { title: "Acesso da equipa", robots: { index: false, follow: false } };

// Staff entrance: password → (first time) set up the authenticator app → 6-digit code.
export default async function StaffLoginPage() {
  const current = await getCurrentUser();
  const home = panel();

  if (current && !isStaff(current.profile)) notFound();
  if (current?.mfaVerified) redirect(home);

  return (
    <Shell signedIn={Boolean(current)}>
      <div className="panel auth-card">
        <span className="eyebrow">Acesso restrito · Equipa</span>
        {!current && (
          <>
            <h1>Entrar no painel</h1>
            <p className="muted" style={{ marginTop: 0, marginBottom: 20 }}>
              Passo 1 de 2 — email e palavra-passe.
            </p>
            <LoginForm next={panel("/entrar")} />
          </>
        )}
        {current && current.hasMfa && (
          <>
            <h1>Código de verificação</h1>
            <p className="muted" style={{ marginTop: 0, marginBottom: 20 }}>
              Passo 2 de 2 — abra a app de autenticação e escreva o código de “Lareiras Pachinha”.
            </p>
            <MfaVerifyForm next={home} />
          </>
        )}
        {current && !current.hasMfa && (
          <>
            <h1>Proteja a sua conta</h1>
            <p className="muted" style={{ marginTop: 0, marginBottom: 20 }}>
              Para aceder ao painel, a verificação em dois passos é obrigatória: além da palavra-passe, será
              pedido um código do seu telemóvel. Só precisa de configurar isto uma vez.
            </p>
            <MfaEnroll next={home} startLabel="Configurar agora" />
          </>
        )}
      </div>
    </Shell>
  );
}
