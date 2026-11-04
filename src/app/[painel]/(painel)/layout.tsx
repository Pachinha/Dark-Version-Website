import PanelNav, { type NavGroup, type NavItem } from "@/components/admin/PanelNav";
import { requirePanel } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/labels";
import { panel } from "@/lib/panel";

export const metadata = { title: "Painel — Lareiras Pachinha", robots: { index: false } };

// O painel está dividido em duas zonas:
//   Gestão — o dia a dia (pedidos, agenda, limpezas, obras, clientes)
//   Site   — o que aparece ao público (produtos, marcas, categorias), só administração
// A conta e a equipa ficam no fundo da barra lateral.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requirePanel();
  const role = profile.role;
  const isAdmin = role === "admin";

  let groups: NavGroup[];
  if (role === "colaborador") {
    // Colaborador: só consulta os clientes que a administração partilhou com ele.
    groups = [{ items: [{ href: panel("/partilhados"), label: "Partilhados comigo", icon: "share" }] }];
  } else {
    groups = [
      {
        title: "Gestão",
        items: [
          { href: panel(), label: "Início", icon: "home" },
          { href: panel("/agenda"), label: "Agenda", icon: "calendar" },
          ...(isAdmin ? [{ href: panel("/orcamentos"), label: "Pedidos de orçamento", icon: "quote" }] : []),
          { href: panel("/manutencao"), label: "Limpezas & manutenções", icon: "wrench" },
          { href: panel("/obras"), label: "Obras", icon: "job" },
          isAdmin
            ? { href: panel("/clientes"), label: "Clientes", icon: "clients" }
            : { href: panel("/partilhados"), label: "Partilhados comigo", icon: "share" },
        ],
      },
      ...(isAdmin
        ? [
            {
              title: "Site",
              items: [
                { href: panel("/catalogo"), label: "Produtos", icon: "product" },
                { href: panel("/catalogo/marcas"), label: "Marcas", icon: "brand" },
                { href: panel("/catalogo/categorias"), label: "Categorias", icon: "category" },
              ],
            },
          ]
        : []),
    ];
  }

  const footer: NavItem[] = [
    ...(isAdmin ? [{ href: panel("/equipa"), label: "Equipa", icon: "team" }] : []),
    { href: "/conta", label: "A minha conta", icon: "account" },
  ];

  return (
    <div className="shell admin">
      <PanelNav
        home={panel()}
        groups={groups}
        footer={footer}
        newEntry={isAdmin ? panel("/novo") : undefined}
        user={{ name: profile.full_name || profile.email, role: ROLE_LABEL[role] }}
        logoutNext={panel("/entrar")}
      />
      <main className="admin-main">{children}</main>
    </div>
  );
}
