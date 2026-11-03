import Link from "next/link";
import { FOUNDED, yearsInBusiness } from "@/lib/company";
import { IMPORTED_BRANDS, MULTI_BRANDS } from "@/lib/brands";

// Só números que conseguimos sustentar. O nº de instalações entra quando a Sandra o confirmar.
const brandCount = Math.floor((IMPORTED_BRANDS.length + MULTI_BRANDS.length) / 5) * 5;
const stats = [
  { value: `${yearsInBusiness()}`, label: "anos de experiência" },
  { value: `${brandCount}+`, label: "marcas" },
  { value: "Grátis", label: "visita técnica no Alto Minho" },
];

// Imagem principal: a Sandra quer uma lareira instalada pela Pachinha (ex.: a do convento).
// Basta substituir /public/images/hero.png pela fotografia real.
export default function Hero() {
  return (
    <section style={{ height: "100svh", minHeight: "620px", position: "relative", overflow: "hidden" }}>
      <img
        src="/images/hero.png"
        alt="Sala de estar com recuperador aceso"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
        loading="eager"
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to right, rgba(14,9,4,0.92) 0%, rgba(14,9,4,0.86) 36%, rgba(14,9,4,0.40) 58%, rgba(14,9,4,0.05) 74%, transparent 84%), linear-gradient(to top, rgba(14,9,4,0.85) 0%, transparent 45%)",
          pointerEvents: "none",
        }}
      />

      <div className="hero-copy">
        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "#e2a276" }}>
          Desde {FOUNDED} &middot; Monção, Alto Minho
        </span>

        <h1 className="hero-title">Aquecimento com quem sabe.</h1>

        <p style={{ fontSize: "14px", lineHeight: 1.6, color: "rgba(255,255,255,0.68)", margin: 0 }}>
          Lareiras, recuperadores e salamandras a lenha, pellets, gás, elétricas e bioetanol — com aconselhamento técnico e
          instalação incluída.
        </p>

        <div className="hero-buttons" style={{ display: "flex", gap: "10px" }}>
          <Link
            href="/pedir-orcamento"
            className="btn-primary"
            style={{ background: "#bf5b2d", color: "#fff", fontSize: "13.5px", fontWeight: 600, padding: "13px 22px", borderRadius: "999px", textDecoration: "none", whiteSpace: "nowrap", display: "inline-block" }}
          >
            Pedir orçamento grátis →
          </Link>
          <Link
            href="/produtos"
            className="btn-outline"
            style={{ background: "transparent", color: "#fff", fontSize: "13.5px", fontWeight: 600, padding: "13px 22px", borderRadius: "999px", textDecoration: "none", border: "1.5px solid rgba(255,255,255,0.45)", whiteSpace: "nowrap", display: "inline-block" }}
          >
            Ver produtos
          </Link>
        </div>

        <Link href="/apoio-ao-cliente" className="cliente-link" style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none", marginTop: "-2px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(226,162,118,0.80)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>
            Já é cliente?{" "}
            <span style={{ color: "rgba(226,162,118,0.9)", textDecoration: "underline", textUnderlineOffset: "3px" }}>
              Peça manutenção ou limpeza
            </span>
          </span>
        </Link>

        <div className="hero-stats" style={{ display: "flex", alignItems: "stretch", marginTop: "4px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "3px",
                paddingRight: i < stats.length - 1 ? "24px" : 0,
                paddingLeft: i > 0 ? "24px" : 0,
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.15)" : "none",
              }}
            >
              <span style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "20px", fontWeight: 700, color: "#fff", lineHeight: 1.1, whiteSpace: "nowrap" }}>
                {stat.value}
              </span>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
