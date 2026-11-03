import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = { title: "Página não encontrada — Lareiras Pachinha", robots: { index: false } };

// Endereço que não existe no site. Não menciona o painel da equipa (o endereço dele é secreto).
const base = { color: "#fff", fontSize: "13.5px", fontWeight: 600, padding: "13px 22px", borderRadius: "999px", textDecoration: "none", whiteSpace: "nowrap", display: "inline-block" } as const;
const primary = { ...base, background: "#bf5b2d" };
const outline = { ...base, background: "transparent", border: "1.5px solid rgba(255,255,255,0.45)" };

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main style={{ background: "#1a1108", color: "#f2ece2", minHeight: "60vh", display: "grid", placeItems: "center" }}>
        <section className="sec" style={{ textAlign: "center", maxWidth: 560 }}>
          <span className="eyebrow">Erro 404</span>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 40px)", margin: "8px 0 12px" }}>Esta página não existe.</h1>
          <p style={{ opacity: 0.75, marginTop: 0 }}>
            O link pode estar incompleto ou a página pode ter mudado de sítio.
          </p>
          <div className="row" style={{ justifyContent: "center", marginTop: 24 }}>
            <Link href="/" className="btn-primary" style={primary}>Voltar ao início</Link>
            <Link href="/produtos" className="btn-outline" style={outline}>Ver produtos</Link>
            <Link href="/pedir-orcamento" className="btn-outline" style={outline}>Pedir orçamento</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
