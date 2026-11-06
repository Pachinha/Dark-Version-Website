import Link from "next/link";
import Navbar from "@/components/Navbar";
import AnimateIn from "@/components/AnimateIn";
import Footer from "@/components/Footer";
import { CONTACT } from "@/lib/company";
import { getI18n, pageMetadata } from "@/lib/i18n/server";

export const generateMetadata = () => pageMetadata((t) => t.support.meta);

const ICONS = [
  (
    <svg key="maintenance" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e2a276" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  (
    <svg key="chimney" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e2a276" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  (
    <svg key="repair" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e2a276" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/>
    </svg>
  ),
  (
    <svg key="contract" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e2a276" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
];

export default async function ApoioClientePage() {
  const { locale, t, href } = await getI18n();
  const sp = t.support;
  const services = sp.services.map((s, i) => ({ ...s, icon: ICONS[i] }));
  return (
    <>
      {/* Hero */}
      <div style={{ position: "relative", height: "62svh" }}>
        <section style={{ height: "62svh", position: "relative", overflow: "hidden", background: "#1a1108" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 60%, rgba(191,91,45,0.18) 0%, transparent 65%)", pointerEvents: "none" }} />
          <div className="hero-inline" style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: "52px", maxWidth: "560px", zIndex: 1 }}>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#e2a276", display: "block", marginBottom: "12px" }}>
              {sp.eyebrow}
            </span>
            <h1 className="hero-inline-title" style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "44px", lineHeight: 1.08, fontWeight: 700, margin: "0 0 16px", color: "#f2ece2" }}>
              {sp.title}
            </h1>
            <p style={{ fontSize: "14.5px", lineHeight: 1.65, color: "rgba(242,236,226,0.60)", margin: 0 }}>
              {sp.lead}
            </p>
            <div style={{ display: "flex", gap: "10px", marginTop: "24px", flexWrap: "wrap" }}>
              <Link href={href("/pedir-orcamento")} className="btn-primary" style={{ background: "#bf5b2d", color: "#fff", fontSize: "13.5px", fontWeight: 600, padding: "13px 22px", borderRadius: "999px", textDecoration: "none" }}>
                {sp.ctaQuote}
              </Link>
              <Link href={href("/pedir-servico")} className="btn-outline" style={{ color: "#fff", fontSize: "13.5px", fontWeight: 600, padding: "13px 22px", borderRadius: "999px", textDecoration: "none", border: "1.5px solid rgba(255,255,255,0.45)" }}>
                {sp.ctaService}
              </Link>
            </div>
          </div>
        </section>
        <Navbar current="apoio" />
      </div>

      <main style={{ background: "#1a1108" }}>
        {/* Serviços */}
        <section className="sec" style={{ padding: "72px 52px 0" }}>
          <div className="grid-split" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "18px" }}>
            {services.map((s, i) => (
              <AnimateIn key={s.title} delay={i * 80}>
                <div
                  className="card-hover"
                  style={{ background: "#2a1a0c", borderRadius: "16px", padding: "32px", display: "flex", gap: "20px", alignItems: "flex-start" }}
                >
                  <div style={{ flexShrink: 0, marginTop: "2px" }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "#f2ece2", marginBottom: "8px" }}>{s.title}</div>
                    <p style={{ fontSize: "13.5px", lineHeight: 1.65, color: "rgba(242,236,226,0.55)", margin: 0 }}>{s.desc}</p>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </section>

        {/* Pedido de manutenção */}
        <section className="sec" style={{ padding: "72px 52px 80px" }}>
          <AnimateIn>
            <div className="grid-split band" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", background: "#262019", borderRadius: "20px", padding: "56px 52px", alignItems: "start" }}>

              {/* Texto */}
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "#e2a276", display: "block", marginBottom: "12px" }}>
                  {sp.visitEyebrow}
                </span>
                <h2 style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "30px", fontWeight: 700, color: "#f2ece2", margin: "0 0 16px", lineHeight: 1.15 }}>
                  {sp.visitTitle}
                </h2>
                <p style={{ fontSize: "14px", lineHeight: 1.65, color: "rgba(242,236,226,0.55)", margin: "0 0 32px" }}>
                  {sp.visitLead}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {[
                    ...(CONTACT.phone ? [{ icon: "📞", text: CONTACT.phone }] : []),
                    { icon: "✉️", text: CONTACT.maintenanceEmail },
                    { icon: "🕐", text: t.common.hours },
                  ].map((item) => (
                    <div key={item.text} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <span style={{ fontSize: "14px" }}>{item.icon}</span>
                      <span style={{ fontSize: "13.5px", color: "rgba(242,236,226,0.70)" }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Como funciona */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {sp.steps.map((step, i) => (
                  <div key={step.title} style={{ display: "flex", gap: "16px", alignItems: "flex-start", background: "rgba(242,236,226,0.05)", border: "1px solid rgba(242,236,226,0.10)", borderRadius: "14px", padding: "18px 20px" }}>
                    <span style={{ flexShrink: 0, width: "30px", height: "30px", borderRadius: "50%", background: i === 0 ? "#bf5b2d" : "rgba(242,236,226,0.10)", color: "#f2ece2", display: "grid", placeItems: "center", fontSize: "13px", fontWeight: 700 }}>
                      {i + 1}
                    </span>
                    <div>
                      <div style={{ fontSize: "14.5px", fontWeight: 600, color: "#f2ece2", marginBottom: "4px" }}>{step.title}</div>
                      <p style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(242,236,226,0.55)", margin: 0 }}>{step.desc}</p>
                    </div>
                  </div>
                ))}
                <Link
                  href={href("/pedir-servico")}
                  className="btn-primary"
                  style={{ background: "#bf5b2d", color: "#fff", fontSize: "14px", fontWeight: 600, padding: "14px 24px", borderRadius: "999px", textDecoration: "none", textAlign: "center", marginTop: "6px", display: "block" }}
                >
                  {t.common.makeRequest}
                </Link>
                <p style={{ fontSize: "12.5px", color: "rgba(242,236,226,0.45)", margin: 0, textAlign: "center" }}>
                  {sp.needsAccount}
                  {locale !== "pt" && <> {sp.accountOnlyPt}</>}
                </p>
              </div>
            </div>
          </AnimateIn>

          {/* Perguntas frequentes */}
          <AnimateIn style={{ marginTop: "56px" }}>
            <h2 style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "26px", fontWeight: 700, color: "#f2ece2", margin: "0 0 20px" }}>
              {sp.faqTitle}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {sp.faqs.map((f) => (
                <details key={f.q} className="faq">
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </AnimateIn>

          <AnimateIn style={{ marginTop: "20px" }}>
            <a href={href("/")} style={{ fontSize: "13px", fontWeight: 600, color: "#e2a276", textDecoration: "none" }}>
              {t.common.backHome}
            </a>
          </AnimateIn>
        </section>
      </main>

      <Footer />
    </>
  );
}
