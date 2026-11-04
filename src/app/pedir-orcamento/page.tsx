import Link from "next/link";
import Shell from "@/components/account/Shell";
import { getCurrentUser } from "@/lib/auth";
import { FUEL, QUOTE_PRODUCTS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { QUOTE_CATEGORY_BY_SLUG } from "@/lib/catalog";
import { getCatalog } from "@/lib/catalog-data";
import { getI18n, pageMetadata } from "@/lib/i18n/server";
import QuoteWizard, { type SavedAddress } from "./QuoteWizard";

export async function generateMetadata() {
  const { t } = await getI18n();
  return pageMetadata((d) => d.quote.meta, { description: t.quote.metaDescription });
}

export default async function PedirOrcamentoPage({ searchParams }: { searchParams: Promise<{ tipo?: string; combustivel?: string; produto?: string }> }) {
  const { locale, t } = await getI18n();
  const q = t.quote;
  const { tipo, combustivel, produto } = await searchParams;
  // Vindo da página de um modelo: o pedido já abre com esse equipamento.
  const product = produto ? (await getCatalog(locale)).products.find((p) => p.slug === produto) : undefined;
  const nextHere = `/pedir-orcamento${product ? `?produto=${encodeURIComponent(product.slug)}` : ""}`;
  const current = await getCurrentUser();
  const profile = current?.profile;

  // Quem tem conta pode usar uma das moradas já guardadas (verificadas) na área de cliente.
  let savedAddresses: SavedAddress[] = [];
  if (current) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("addresses")
      .select("id, label, address, details, postcode, locality, lat, lng")
      .eq("user_id", current.user.id)
      .order("created_at");
    savedAddresses = data ?? [];
  }

  return (
    <Shell signedIn={!!current} languages>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <span className="eyebrow">{q.eyebrow}</span>
        <h1 className="page-title" style={{ color: "#f2ece2" }}>{q.title}</h1>
        <p className="muted-light" style={{ margin: "0 0 20px", lineHeight: 1.6 }}>
          {q.lead}
        </p>
        {!current && (
          <div className="account-hint">
            <p>
              <strong>{q.noAccount}</strong> {q.signInHint} <Link href={`/entrar?next=${encodeURIComponent(nextHere)}`}>{q.signInLink}</Link>.
            </p>
            <p>
              {q.registerHint} <Link href="/registar">{q.registerLink}</Link>.{q.accountPtOnly && <> {q.accountPtOnly}</>}
            </p>
          </div>
        )}
        <section className="panel">
          <QuoteWizard
            signedIn={!!current}
            savedAddresses={savedAddresses}
            // Vindo de uma categoria, o tipo e o combustível já vêm escolhidos; vindo de um modelo,
            // o próprio equipamento (tipo de categorias novas sem equivalente → "Aconselhamento").
            initial={
              product
                ? {
                    category: QUOTE_CATEGORY_BY_SLUG[product.category.slug] ?? "Aconselhamento",
                    fuel: product.fuel in FUEL ? product.fuel : "",
                  }
                : {
                    category: tipo && tipo in QUOTE_PRODUCTS ? tipo : "",
                    fuel: combustivel && combustivel in FUEL ? combustivel : "",
                  }
            }
            product={
              product && {
                slug: product.slug,
                name: product.name,
                brand: product.brand.name,
                category: product.category.name,
                photo: product.photos[0] ?? "",
              }
            }
            contact={{ name: profile?.full_name ?? "", phone: profile?.phone ?? "", email: profile?.email ?? "" }}
          />
        </section>
      </div>
    </Shell>
  );
}
