import Link from "next/link";
import { redirect } from "next/navigation";
import Shell from "@/components/account/Shell";
import { logout } from "@/app/actions/auth";
import { getCurrentUser, isPanelMember } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/labels";
import { panel } from "@/lib/panel";

export const metadata = { title: "Sem acesso — Lareiras Pachinha", robots: { index: false, follow: false } };

// Para onde vai quem chega ao painel sem poder ver a página: explica o que se passou
// e como sair (em vez de um 404 sem saída, que se repete a cada refresh).
export default async function NoAccessPage({ searchParams }: { searchParams: Promise<{ motivo?: string }> }) {
  const current = await getCurrentUser();
  if (!current) redirect(panel("/entrar"));
  const { profile } = current;
  const { motivo } = await searchParams;
  const role = ROLE_LABEL[profile.role] ?? profile.role;

  // Pessoa da equipa numa página só para administradores
  if (isPanelMember(profile)) {
    if (motivo !== "admin") redirect(panel());
    const home = profile.role === "colaborador" ? panel("/partilhados") : panel();
    return (
      <Shell signedIn panelHome={panel()}>
        <div className="panel auth-card">
          <span className="eyebrow">Painel · {role}</span>
          <h1>Esta página é só para administradores</h1>
          <p style={{ marginTop: 0 }}>
            Está a usar a conta <strong>{profile.email}</strong>, com o papel <strong>{role}</strong>. A página que
            tentou abrir (por exemplo, Orçamentos, Clientes ou Equipa) só está disponível para administradores.
          </p>
          <p className="muted">Se precisa de ver essa informação, peça a um administrador para a partilhar consigo ou para mudar o seu papel em Painel → Equipa.</p>
          <div className="row" style={{ marginTop: 20 }}>
            <Link href={home} className="btn btn-ink">← Voltar ao painel</Link>
          </div>
        </div>
      </Shell>
    );
  }

  // Conta de cliente no endereço do painel
  return (
    <Shell signedIn panelHome={panel()}>
      <div className="panel auth-card">
        <span className="eyebrow">Acesso restrito · Equipa</span>
        <h1>Esta conta não tem acesso ao painel</h1>
        <p style={{ marginTop: 0 }}>
          Tem a sessão iniciada com <strong>{profile.email}</strong>, que é uma conta de <strong>{role}</strong>. O painel
          é só para a equipa da Lareiras Pachinha.
        </p>

        <h2 style={{ fontSize: 16, margin: "20px 0 6px" }}>Porque está a ver esta página?</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Entrou no painel com uma conta de cliente — por exemplo, o seu email pessoal em vez do email da equipa.
          Como a sessão fica guardada neste navegador, esta mensagem volta a aparecer até terminar a sessão.
        </p>

        <h2 style={{ fontSize: 16, margin: "20px 0 6px" }}>O que fazer</h2>
        <div className="row" style={{ marginTop: 8 }}>
          <form action={logout}>
            <input type="hidden" name="next" value={panel("/entrar")} />
            <button className="btn btn-ink">Terminar sessão e entrar com outra conta</button>
          </form>
          <Link href="/conta" className="btn btn-ghost">Ir para a minha área de cliente</Link>
        </div>
        <p className="hint" style={{ marginTop: 16, marginBottom: 0 }}>
          Esta conta devia ter acesso? Um administrador pode mudar o papel dela em Painel → Equipa.
        </p>
      </div>
    </Shell>
  );
}
