import Link from "next/link";
import CategoryForm from "@/components/admin/catalog/CategoryForm";
import { panel } from "@/lib/panel";

export default function NewCategoryPage() {
  return (
    <section className="panel">
      <Link href={panel("/catalogo/categorias")} className="link">← Categorias</Link>
      <h2>Nova categoria</h2>
      <CategoryForm />
    </section>
  );
}
