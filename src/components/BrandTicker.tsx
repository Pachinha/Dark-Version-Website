import { getCatalog, type Brand } from "@/lib/catalog-data";
import { getI18n } from "@/lib/i18n/server";

function BrandItem({ brand }: { brand: Brand }) {
  return (
    <div className="ticker-item">
      {brand.logo ? (
        // --h: altura afinada por logo (no painel); o CSS reduz em ecrãs pequenos.
        <img src={brand.logo} alt={brand.name} className="ticker-logo" style={{ "--h": `${brand.logoHeight}px` } as React.CSSProperties} />
      ) : (
        // Marca ainda sem logótipo: o nome escrito, até a Sandra carregar o logo.
        <span className="ticker-name">{brand.name}</span>
      )}
    </div>
  );
}

// Faixa "Multimarcas" no fundo do hero da página inicial: marca a separação
// entre o hero e o resto do site, como no desenho original.
// Marcas e ordem vêm do painel (Catálogo → Marcas, "Mostrar na faixa").
export default async function BrandTicker() {
  const { locale, t } = await getI18n();
  const brands = (await getCatalog(locale)).brands.filter((b) => b.inTicker);
  if (!brands.length) return null;
  return (
    <div className="ticker-band" aria-label={t.hero.tickerAria}>
      <span className="ticker-label">{t.hero.tickerLabel}</span>

      <div className="ticker-track">
        {/*
          Two identical sets side-by-side, each animating translateX(-100%) of its own width.
          Set1 slides from [0,W] to [-W,0] and resets off-screen.
          Set2 starts at [W,2W] and slides into [0,W] exactly as Set1 exits.
          The reset of each set is always off-screen → zero visible jump.
        */}
        <div style={{ display: "flex" }}>
          <div className="ticker-set">
            {brands.map((brand) => <BrandItem key={brand.slug} brand={brand} />)}
          </div>
          <div className="ticker-set" aria-hidden="true">
            {brands.map((brand) => <BrandItem key={brand.slug} brand={brand} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
