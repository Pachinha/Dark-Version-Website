import Shell from "@/components/account/Shell";
import Tabs from "@/components/account/Tabs";
import { requirePanel } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/labels";
import { panel } from "@/lib/panel";

export const metadata = { title: "Painel — Lareiras Pachinha", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requirePanel();
  const isAdmin = profile.role === "admin";

  // Colaborador: só consulta os clientes que a administração partilhou com ele.
  const tabs = profile.role === "colaborador" ? [
    { href: panel("/partilhados"), label: "Partilhados comigo" },
    { href: "/conta", label: "← A minha conta" },
  ] : [
    { href: panel(), label: "Início" },
    ...(isAdmin ? [{ href: panel("/novo"), label: "+ Novo" }] : []),
    { href: panel("/agenda"), label: "Agenda" },
    ...(isAdmin ? [{ href: panel("/orcamentos"), label: "Orçamentos" }] : []),
    { href: panel("/manutencao"), label: "Limpezas & manutenções" },
    { href: panel("/obras"), label: "Obras" },
    ...(isAdmin ? [] : [{ href: panel("/partilhados"), label: "Partilhados comigo" }]),
    ...(isAdmin
      ? [
          { href: panel("/clientes"), label: "Clientes" },
          { href: panel("/equipa"), label: "Equipa" },
        ]
      : []),
    { href: "/conta", label: "← A minha conta" },
  ];

  return (
    <Shell signedIn panelHome={panel()}>
      <div className="no-print">
        <span className="eyebrow">Painel · {ROLE_LABEL[profile.role]}</span>
        <h1 className="page-title" style={{ marginBottom: 20 }}>Lareiras Pachinha</h1>
        <Tabs items={tabs} />
      </div>
      {children}
    </Shell>
  );
}
