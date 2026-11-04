import Tabs from "@/components/account/Tabs";
import { requireAdmin } from "@/lib/auth";
import { panel } from "@/lib/panel";

// Catálogo do site (só administração): produtos, marcas e categorias.
export default async function CatalogLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <div className="subtabs">
        <Tabs
          items={[
            { href: panel("/catalogo"), label: "Produtos" },
            { href: panel("/catalogo/marcas"), label: "Marcas" },
            { href: panel("/catalogo/categorias"), label: "Categorias" },
          ]}
        />
      </div>
      {children}
    </>
  );
}
