import Link from "next/link";
import AnimateIn from "./AnimateIn";
import { getI18n } from "@/lib/i18n/server";

export default async function ProcessBand() {
  const { t, href } = await getI18n();
  const steps = t.home.steps.map((s, i) => ({ ...s, num: String(i + 1).padStart(2, "0") }));
  return (
    <section className="sec" style={{ background: "#1a1108", padding: "0 52px 80px" }}>
      <div className="band" style={{ background: "#262019", color: "#f2ece2", borderRadius: "20px", padding: "56px 52px" }}>
        <AnimateIn className="head-row" style={{ marginBottom: "40px" }}>
          <h2 className="sec-title" style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "30px", fontWeight: 700, margin: 0, color: "#f2ece2" }}>
            {t.home.processTitle}
          </h2>
          <Link href={href("/pedir-orcamento")} style={{ fontSize: "13px", fontWeight: 600, color: "#e2a276", textDecoration: "none" }}>
            {t.common.requestQuoteArrow}
          </Link>
        </AnimateIn>

        <div className="grid-steps">
          {steps.map((step, i) => (
            <AnimateIn key={step.num} delay={i * 100}>
              <div style={{ borderTop: "1px solid rgba(226,162,118,0.25)", paddingTop: "24px" }}>
                <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: "12px", color: "#e2a276", marginBottom: "14px", letterSpacing: "0.05em" }}>
                  {step.num}
                </div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#f2ece2", marginBottom: "10px" }}>
                  {step.title}
                </div>
                <div style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(242,236,226,0.55)" }}>
                  {step.body}
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
