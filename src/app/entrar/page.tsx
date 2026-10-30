import Link from "next/link";
import Shell from "@/components/account/Shell";
import LoginForm from "./LoginForm";

export const metadata = { title: "Entrar — Lareiras Pachinha" };

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const { next, erro } = await searchParams;

  return (
    <Shell>
      <div className="panel auth-card">
        <span className="eyebrow">Área de cliente</span>
        <h1>Entrar</h1>
        <p className="muted" style={{ marginTop: 0, marginBottom: 20 }}>
          Peça orçamentos, solicite manutenções e acompanhe as suas encomendas.
        </p>
        {erro === "link" && (
          <p className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>
            O link expirou ou já foi usado. Inicie sessão ou peça um novo link.
          </p>
        )}
        <LoginForm next={next ?? "/conta"} />
        <p className="muted" style={{ marginTop: 20, marginBottom: 0 }}>
          <Link className="link" href="/recuperar">Esqueceu-se da palavra-passe?</Link>
          <br />
          Ainda não tem conta? <Link className="link" href="/registar">Criar conta</Link>
        </p>
      </div>
    </Shell>
  );
}
