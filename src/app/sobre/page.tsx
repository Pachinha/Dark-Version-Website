import Link from "next/link";
import Navbar from "@/components/Navbar";
import AnimateIn from "@/components/AnimateIn";
import Footer from "@/components/Footer";
import { FOUNDED, yearsInBusiness } from "@/lib/company";
import { getCatalog } from "@/lib/catalog-data";
import { fmt } from "@/lib/i18n/config";
import { getI18n, pageMetadata } from "@/lib/i18n/server";

export const generateMetadata = () => pageMetadata((t) => t.about.meta);

const h2 = { fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "32px", fontWeight: 700, margin: "0 0 16px", color: "#f2ece2", lineHeight: 1.15 } as const;
const eyebrow = { fontSize: "11px", fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "#e2a276", display: "block", marginBottom: "12px" } as const;
const body = { fontSize: "15px", lineHeight: 1.7, color: "rgba(242,236,226,0.65)", margin: "0 0 14px" } as const;

export default async function SobrePage() {
  const { locale, t, href } = await getI18n();
  const { brands } = await getCatalog(locale);
  const a = t.about;
  // Factos verificados online (out. 2026): Crunchbase (fundação, a confirmar com a Sandra), Racius (2007),
  // Homify e glammfire.com (2008, 2013), Cheminées Magazine, A' Design Award, COTEC.
  const timeline = [
    { year: String(FOUNDED), text: a.timeline.founded },
    { year: "2007", text: a.timeline.y2007 },
    { year: "2008", text: a.timeline.y2008 },
    { year: "2009", text: a.timeline.y2009 },
    { year: "2013", text: a.timeline.y2013 },
    { year: "2017", text: a.timeline.y2017 },
    { year: "2026", text: a.timeline.y2026 },
  ];
  const awards = [
    { title: "Flamme d'Or de la Cheminée à l'Éthanol", by: a.awards.flammeEthanolBy, year: "2009" },
    { title: "Flamme d'Or des Nouvelles Énergies", by: a.awards.flammeEnergiesBy, year: "2010" },
    { title: a.awards.designAward, by: a.awards.designAwardBy, year: "2017" },
    { title: a.awards.innovation, by: a.awards.innovationBy, year: "2026" },
    { title: a.awards.pmeLider, by: "IAPMEI", year: "GlammFire" },
    { title: a.awards.iso, by: a.awards.isoBy, year: "GlammFire" },
  ];
  const stats = [
    { value: String(FOUNDED), label: a.stats.founded },
    { value: `${yearsInBusiness()}`, label: a.stats.years },
    { value: `${brands.length}`, label: a.stats.brands },
    { value: "50+", label: a.stats.countries },
  ];
  return (
    <>
      {/* Hero */}
      <div style={{ position: "relative", height: "70svh" }}>
        <section style={{ height: "70svh", position: "relative", overflow: "hidden" }}>
          <img src="/images/sobre/moncao.jpg" alt={a.heroAlt} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} loading="eager" />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(14,9,4,0.92) 0%, rgba(14,9,4,0.80) 42%, rgba(14,9,4,0.35) 75%, rgba(14,9,4,0.2) 100%)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "30%", background: "linear-gradient(to bottom, transparent, #1a1108)" }} />
          <div className="hero-inline" style={{ position: "absolute", top: "55%", transform: "translateY(-50%)", left: "52px", maxWidth: "560px", zIndex: 1 }}>
            <span style={eyebrow}>{a.eyebrow}</span>
            <h1 className="hero-inline-title" style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "48px", lineHeight: 1.06, fontWeight: 700, margin: "0 0 18px", color: "#fff" }}>
              {fmt(a.title, { years: yearsInBusiness() })}
            </h1>
            <p style={{ fontSize: "15px", lineHeight: 1.65, color: "rgba(255,255,255,0.7)", margin: 0 }}>
              {a.lead}
            </p>
          </div>
        </section>
        <Navbar />
      </div>

      <main style={{ background: "#1a1108" }}>
        {/* Números */}
        <section className="sec" style={{ padding: "56px 52px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
            {stats.map((s, i) => (
              <AnimateIn key={s.label} delay={i * 80}>
                <div style={{ background: "#2a1a0c", borderRadius: "16px", padding: "26px 24px" }}>
                  <div style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "38px", fontWeight: 700, color: "#e2a276", lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: "13.5px", color: "rgba(242,236,226,0.6)", marginTop: "10px" }}>{s.label}</div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </section>

        {/* A nossa história */}
        <section className="sec" style={{ padding: "80px 52px 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))", gap: "56px", alignItems: "start" }}>
          <AnimateIn>
            <span style={eyebrow}>{a.historyEyebrow}</span>
            <h2 style={h2}>{a.historyTitle}</h2>
            <p style={body}>{fmt(a.history1, { year: FOUNDED })}</p>
            <p style={body}>{a.history2}</p>
            <p style={body}>{fmt(a.history3, { count: brands.filter((b) => !b.imported).length })}</p>
          </AnimateIn>

          <AnimateIn delay={100}>
            <ol style={{ listStyle: "none", margin: 0, padding: 0, borderLeft: "2px solid rgba(226,162,118,0.25)" }}>
              {timeline.map((t) => (
                <li key={t.year} style={{ position: "relative", padding: "0 0 26px 28px" }}>
                  <span style={{ position: "absolute", left: "-7px", top: "4px", width: "12px", height: "12px", borderRadius: "50%", background: "#bf5b2d", boxShadow: "0 0 0 4px #1a1108" }} />
                  <div style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "18px", fontWeight: 700, color: "#f2ece2" }}>{t.year}</div>
                  <div style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(242,236,226,0.62)", marginTop: "4px" }}>{t.text}</div>
                </li>
              ))}
            </ol>
          </AnimateIn>
        </section>

        {/* Prémios */}
        <section className="sec" style={{ padding: "64px 52px 0" }}>
          <AnimateIn>
            <span style={eyebrow}>{a.awardsEyebrow}</span>
            <h2 style={h2}>{a.awardsTitle}</h2>
            <p style={{ ...body, maxWidth: "62ch", marginBottom: "28px" }}>
              {a.awardsLead}
            </p>
          </AnimateIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
            {awards.map((a, i) => (
              <AnimateIn key={a.title} delay={(i % 3) * 80}>
                <div style={{ background: "#2a1a0c", border: "1px solid rgba(226,162,118,0.15)", borderRadius: "16px", padding: "22px 24px", height: "100%", display: "flex", gap: "16px" }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e2a276" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }} aria-hidden>
                    <circle cx="12" cy="8" r="6" />
                    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                  </svg>
                  <div>
                    <div style={{ fontSize: "11.5px", fontWeight: 700, color: "#e2a276", letterSpacing: "0.05em" }}>{a.year}</div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#f2ece2", margin: "4px 0" }}>{a.title}</div>
                    <div style={{ fontSize: "13px", color: "rgba(242,236,226,0.5)" }}>{a.by}</div>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </section>

        {/* Grupo Pachinha / GlammFire */}
        <section className="sec" style={{ padding: "80px 52px 0" }}>
          <AnimateIn>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))", borderRadius: "20px", overflow: "hidden", background: "#2a1a0c" }}>
              <div className="band" style={{ padding: "52px 48px" }}>
                <span style={eyebrow}>{a.groupEyebrow}</span>
                <h2 style={h2}>{a.groupTitle}</h2>
                <p style={body}>{a.group1}</p>
                <p style={body}>{a.group2}</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "360px" }}>
                <img src="/images/sobre/fabrica.jpg" alt={a.factoryAlt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
                <img src="/images/sobre/glammfire-kivo.jpg" alt={a.kivoAlt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} loading="lazy" />
              </div>
            </div>
          </AnimateIn>
        </section>

        {/* CTA */}
        <section className="sec" style={{ padding: "64px 52px 80px" }}>
          <AnimateIn>
            <div className="band" style={{ background: "#262019", borderRadius: "20px", padding: "48px 52px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
              <div>
                <h2 style={{ ...h2, fontSize: "26px", margin: "0 0 8px" }}>{a.ctaTitle}</h2>
                <p style={{ fontSize: "14.5px", color: "rgba(242,236,226,0.60)", margin: 0 }}>{a.ctaLead}</p>
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <Link href={href("/obras")} className="btn-outline" style={{ color: "#fff", fontSize: "14px", fontWeight: 600, padding: "13px 24px", borderRadius: "999px", textDecoration: "none", border: "1.5px solid rgba(255,255,255,0.45)" }}>
                  {t.nav.works}
                </Link>
                <Link href={href("/apoio-ao-cliente")} className="btn-primary" style={{ background: "#bf5b2d", color: "#fff", fontSize: "14px", fontWeight: 600, padding: "13px 24px", borderRadius: "999px", textDecoration: "none" }}>
                  {t.common.makeRequest}
                </Link>
              </div>
            </div>
          </AnimateIn>
        </section>
      </main>
      <Footer />
    </>
  );
}
