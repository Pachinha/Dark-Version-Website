import Shell from "@/components/account/Shell";
import Tabs from "@/components/account/Tabs";
import { requireUser } from "@/lib/auth";
import { panel } from "@/lib/panel";

export const metadata = { title: "A minha conta — Lareiras Pachinha" };

export default async function ContaLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireUser();
  const firstName = profile.full_name.split(" ")[0] || "cliente";

  const tabs = [
    { href: "/conta", label: "Resumo" },
    { href: "/conta/orcamentos", label: "Orçamentos" },
    { href: "/conta/manutencao", label: "Manutenção" },
    { href: "/conta/moradas", label: "Moradas" },
    { href: "/conta/dados", label: "Dados & privacidade" },
    ...(profile.role !== "client" ? [{ href: panel(), label: "Painel →" }] : []),
  ];

  return (
    <Shell signedIn>
      <span className="eyebrow">Área de cliente</span>
      <h1 className="page-title" style={{ marginBottom: 20 }}>Olá, {firstName}</h1>
      <Tabs items={tabs} />
      {children}
    </Shell>
  );
}
