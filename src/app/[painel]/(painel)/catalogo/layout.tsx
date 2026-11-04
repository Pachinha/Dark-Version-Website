import { requireAdmin } from "@/lib/auth";

// Zona "Site" do painel (produtos, marcas, categorias): só administração.
// A navegação entre as três está na barra lateral.
export default async function CatalogLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}
