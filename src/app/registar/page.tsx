import Link from "next/link";
import Shell from "@/components/account/Shell";
import SignupForm from "./SignupForm";

export const metadata = { title: "Criar conta — Lareiras Pachinha" };

export default function RegistarPage() {
  return (
    <Shell>
      <div className="panel auth-card">
        <span className="eyebrow">Área de cliente</span>
        <h1>Criar conta</h1>
        <p className="muted" style={{ marginTop: 0, marginBottom: 20 }}>
          Só pedimos os dados necessários para o contactar e prestar o serviço.
        </p>
        <SignupForm />
        <p className="muted" style={{ marginTop: 20, marginBottom: 0 }}>
          Já tem conta? <Link className="link" href="/entrar">Entrar</Link>
        </p>
      </div>
    </Shell>
  );
}
