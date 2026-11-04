import AnimateIn from "./AnimateIn";
import { CONTACT, telHref } from "@/lib/company";
import { getI18n } from "@/lib/i18n/server";

export default async function ShowroomBand() {
  const { t } = await getI18n();
  const details = [
    { label: t.home.address, value: CONTACT.address.join(", ") },
    { label: t.home.hoursLabel, value: t.common.hours },
    ...(CONTACT.phone ? [{ label: t.home.phone, value: CONTACT.phone, href: telHref(CONTACT.phone) }] : []),
    { label: t.home.email, value: CONTACT.email, href: `mailto:${CONTACT.email}` },
  ];

  return (
    <section id="contactos" className="sec" style={{ background: "#1a1108", padding: "0 52px 80px", scrollMarginTop: "24px" }}>
      <AnimateIn>
        <div className="grid-split" style={{ borderRadius: "20px", overflow: "hidden", background: "#2a1a0c", minHeight: "420px" }}>
          <div className="band" style={{ padding: "52px 48px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "#e2a276" }}>
              {t.home.showroomEyebrow}
            </span>
            <h2 className="sec-title" style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "32px", fontWeight: 700, color: "#f2ece2", margin: "8px 0 14px", lineHeight: 1.15 }}>
              {t.home.showroomTitle}
            </h2>
            <p style={{ fontSize: "14.5px", lineHeight: 1.65, color: "rgba(242,236,226,0.60)", margin: "0 0 24px", maxWidth: "40ch" }}>
              {t.home.showroomLead}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {details.map((d) => (
                <div key={d.label} style={{ display: "flex", gap: "12px", alignItems: "baseline", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(242,236,226,0.35)", minWidth: "76px" }}>
                    {d.label}
                  </span>
                  {"href" in d && d.href ? (
                    <a href={d.href} style={{ fontSize: "13.5px", color: "#f2ece2", textDecoration: "none" }}>{d.value}</a>
                  ) : (
                    <span style={{ fontSize: "13.5px", color: "#f2ece2" }}>{d.value}</span>
                  )}
                </div>
              ))}
            </div>

            <a
              href={CONTACT.mapUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
              style={{ marginTop: "26px", background: "#bf5b2d", color: "#fff", fontSize: "13.5px", fontWeight: 600, padding: "13px 24px", borderRadius: "999px", textDecoration: "none", display: "inline-block", alignSelf: "flex-start" }}
            >
              {t.home.seeMap}
            </a>
          </div>

          <div className="product-img-zoom split-media" style={{ background: "#3d2a18", position: "relative", overflow: "hidden" }}>
            <img
              src="/images/orcamento/lareira.jpg"
              alt={t.home.showroomAlt}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
              loading="lazy"
            />
          </div>
        </div>
      </AnimateIn>
    </section>
  );
}
