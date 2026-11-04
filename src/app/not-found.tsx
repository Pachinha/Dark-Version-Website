import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getI18n, pageMetadata } from "@/lib/i18n/server";

export const generateMetadata = () => pageMetadata((t) => t.notFound.meta, { robots: { index: false } });

// Endereço que não existe no site. Não menciona o painel da equipa (o endereço dele é secreto).
const base = { color: "#fff", fontSize: "13.5px", fontWeight: 600, padding: "13px 22px", borderRadius: "999px", textDecoration: "none", whiteSpace: "nowrap", display: "inline-block" } as const;
const primary = { ...base, background: "#bf5b2d" };
const outline = { ...base, background: "transparent", border: "1.5px solid rgba(255,255,255,0.45)" };

export default async function NotFound() {
  const { t, href } = await getI18n();
  const n = t.notFound;
  return (
    <>
      <Navbar />
      <main style={{ background: "#1a1108", color: "#f2ece2", minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <section className="sec" style={{ textAlign: "center", maxWidth: 560 }}>
          <span className="eyebrow">{n.eyebrow}</span>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", margin: "8px 0 12px" }}>{n.title}</h1>
          <p style={{ opacity: 0.75, marginTop: 0 }}>
            {n.lead}
          </p>
          <div className="row" style={{ justifyContent: "center", marginTop: 24 }}>
            <Link href={href("/")} className="btn-primary" style={primary}>{n.home}</Link>
            <Link href={href("/produtos")} className="btn-outline" style={outline}>{t.common.seeProducts}</Link>
            <Link href={href("/pedir-orcamento")} className="btn-outline" style={outline}>{t.common.requestQuote}</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
