import Link from "next/link";
import BrandForm from "@/components/admin/catalog/BrandForm";
import { panel } from "@/lib/panel";

export default function NewBrandPage() {
  return (
    <section className="panel">
      <Link href={panel("/catalogo/marcas")} className="link">← Marcas</Link>
      <h2>Nova marca</h2>
      <BrandForm />
    </section>
  );
}
