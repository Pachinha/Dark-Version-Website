import AnimateIn from "./AnimateIn";
import { getCatalog } from "@/lib/catalog-data";
import { fmt } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

const h2 = { fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "32px", fontWeight: 700, margin: 0, color: "#f2ece2" } as const;
const eyebrow = { fontSize: "11px", fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "#e2a276", display: "block", marginBottom: "10px" } as const;

export default async function Brands() {
  const { locale, t } = await getI18n();
  const imported = (await getCatalog(locale)).brands.filter((b) => b.imported);
  if (!imported.length) return null;
  return (
    <section id="marcas" className="sec" style={{ background: "#1a1108", padding: "0 52px 80px" }}>
      {/* Importador oficial */}
      <AnimateIn style={{ marginBottom: "28px" }}>
        <span style={eyebrow}>{t.home.importerEyebrow}</span>
        <h2 className="sec-title" style={h2}>{t.home.importerTitle}</h2>
      </AnimateIn>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: "18px" }}>
        {imported.map((brand, i) => (
          <AnimateIn key={brand.name} delay={i * 100}>
            <div
              style={{
                background: "linear-gradient(135deg, #2a1a0c 0%, #3a2414 100%)",
                border: "1px solid rgba(226,162,118,0.22)",
                borderRadius: "18px",
                padding: "32px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                height: "100%",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(242,236,226,0.45)" }}>
                {brand.origin ? fmt(t.home.importedBrand, { origin: brand.origin }) : t.catalog.badges.importador}
              </span>
              <span style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "28px", fontWeight: 700, color: "#f2ece2", letterSpacing: "-0.01em" }}>
                {brand.name}
              </span>
              <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(242,236,226,0.6)", margin: "0 0 8px" }}>{brand.description}</p>
              {brand.catalogUrl && (
                <a
                  href={brand.catalogUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ alignSelf: "flex-start", marginTop: "auto", background: "#bf5b2d", color: "#fff", fontSize: "13.5px", fontWeight: 600, padding: "11px 20px", borderRadius: "999px", textDecoration: "none" }}
                >
                  {t.home.seeCatalog}{brand.catalogLabel && ` ${brand.catalogLabel}`} →
                </a>
              )}
            </div>
          </AnimateIn>
        ))}
      </div>

    </section>
  );
}
