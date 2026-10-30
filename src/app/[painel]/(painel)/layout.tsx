import Shell from "@/components/account/Shell";
import Tabs from "@/components/account/Tabs";
import { requireStaff } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/labels";
import { panel } from "@/lib/panel";

export const metadata = { title: "Painel — Lareiras Pachinha", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireStaff();
  const isAdmin = profile.role === "admin";

  const tabs = [
    { href: panel(), label: "Início" },
    { href: panel("/agenda"), label: "Agenda" },
    ...(isAdmin ? [{ href: panel("/orcamentos"), label: "Orçamentos" }] : []),
    { href: panel("/manutencao"), label: "Limpezas & manutenções" },
    { href: panel("/obras"), label: "Obras" },
    ...(isAdmin
      ? [
          { href: panel("/clientes"), label: "Clientes" },
          { href: panel("/equipa"), label: "Equipa" },
        ]
      : []),
    { href: "/conta", label: "← A minha conta" },
  ];

  return (
    <Shell signedIn>
      <span className="eyebrow">Painel · {ROLE_LABEL[profile.role]}</span>
      <h1 className="page-title" style={{ marginBottom: 20 }}>Lareiras Pachinha</h1>
      <Tabs items={tabs} />
      {children}
    </Shell>
  );
}
