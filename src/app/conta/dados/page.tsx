import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/labels";
import ProfileForm from "./ProfileForm";
import DeleteAccountForm from "./DeleteAccountForm";
import { MfaDisable, MfaEnroll } from "@/components/account/MfaForms";

const CONSENT_LABEL: Record<string, string> = {
  privacy: "Política de Privacidade",
  terms: "Termos de Utilização",
  marketing: "Comunicações de marketing",
};

export default async function DadosPage() {
  const { user, profile, hasMfa } = await requireUser();
  const staff = profile.role !== "client";
  const supabase = await createClient();
  const { data: consents } = await supabase
    .from("consent_events")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <div className="grid-2">
        <section className="panel">
          <h2>Os meus dados</h2>
          <p className="muted" style={{ marginTop: 0 }}>Email: <strong>{user.email}</strong></p>
          <ProfileForm profile={profile} />
          <p style={{ marginBottom: 0 }}>
            <Link className="link" href="/conta/nova-password">Alterar palavra-passe</Link>
          </p>
        </section>

        <section className="panel">
          <h2>Privacidade</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Aceitou a <Link className="link" href="/privacidade">Política de Privacidade</Link> (versão{" "}
            {profile.privacy_version}) em {formatDate(profile.privacy_accepted_at, true)}.
          </p>
          <h3 style={{ fontSize: 15, marginBottom: 8 }}>Descarregar os meus dados</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            Receba uma cópia de todos os dados que temos sobre si, em formato JSON (direito de acesso e portabilidade).
          </p>
          <a className="btn btn-ink btn-sm" href="/conta/exportar" download>
            Descarregar dados
          </a>
          <h3 style={{ fontSize: 15, margin: "24px 0 8px" }}>Histórico de consentimentos</h3>
          <ul className="list" style={{ gap: 6 }}>
            {consents?.map((c) => (
              <li key={c.id} className="muted">
                {formatDate(c.created_at, true)} — {CONSENT_LABEL[c.kind]}:{" "}
                <strong>{c.granted ? "aceite" : "recusado"}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 20 }}>
        <h2>Verificação em dois passos</h2>
        {hasMfa ? (
          <>
            <p className="alert alert-success" style={{ marginTop: 0 }}>
              Ativa — ao entrar num dispositivo novo é pedido um código da app no seu telemóvel.
            </p>
            {staff ? (
              <p className="hint" style={{ marginBottom: 0 }}>Obrigatória para contas da equipa.</p>
            ) : (
              <MfaDisable />
            )}
          </>
        ) : (
          <>
            <p className="muted" style={{ marginTop: 0 }}>
              Recomendado. Mesmo que alguém descubra a sua palavra-passe, não consegue entrar sem o código do seu telemóvel.
            </p>
            <MfaEnroll />
          </>
        )}
      </section>

      <section className="panel" style={{ marginTop: 20, border: "2px solid #9b2c1f" }}>
        <h2>Apagar conta</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Apaga definitivamente a sua conta, moradas, pedidos e histórico. Esta ação não pode ser desfeita.
          Documentos fiscais (faturas) são guardados à parte durante o prazo exigido por lei.
        </p>
        <DeleteAccountForm />
      </section>
    </>
  );
}
