import Link from "next/link";
import { logout } from "@/app/actions/auth";
import Footer from "@/components/Footer";

// panelHome: no painel da equipa o logótipo leva ao início do painel (não ao site),
// e terminar sessão volta ao login do painel.
export default function Shell({
  children,
  signedIn = false,
  panelHome,
}: {
  children: React.ReactNode;
  signedIn?: boolean;
  panelHome?: string;
}) {
  return (
    <div className="shell">
      <header className="shell-header">
        <Link href={panelHome ?? "/"} style={{ display: "block", lineHeight: 0 }}>
          <img
            src="/images/logo.png"
            alt={panelHome ? "Lareiras Pachinha — início do painel" : "Lareiras Pachinha — voltar ao site"}
            style={{ height: "56px", width: "auto", filter: "brightness(0) invert(1)" }}
          />
        </Link>
        {signedIn ? (
          <form action={logout}>
            {panelHome && <input type="hidden" name="next" value={`${panelHome}/entrar`} />}
            <button className="btn btn-ghost btn-sm" style={{ color: "#f2ece2" }}>
              Terminar sessão
            </button>
          </form>
        ) : panelHome ? null : (
          <Link href="/" className="btn btn-ghost btn-sm" style={{ color: "#f2ece2" }}>
            ← Voltar ao site
          </Link>
        )}
      </header>
      <main className="shell-main">{children}</main>
      {/* O rodapé do site aparece em todas as páginas públicas; o painel da equipa não o tem. */}
      {!panelHome && <Footer />}
    </div>
  );
}
