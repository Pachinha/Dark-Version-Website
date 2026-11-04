import Link from "next/link";
import { logout } from "@/app/actions/auth";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getI18n } from "@/lib/i18n/server";

// panelHome: no painel da equipa o logótipo leva ao início do painel (não ao site),
// e terminar sessão volta ao login do painel.
// languages: páginas traduzidas (orçamento, comprovativo, legais) mostram o seletor de língua.
export default async function Shell({
  children,
  signedIn = false,
  panelHome,
  languages = false,
}: {
  children: React.ReactNode;
  signedIn?: boolean;
  panelHome?: string;
  languages?: boolean;
}) {
  const { t, href } = await getI18n();
  const actions = signedIn ? (
    <form action={logout}>
      {panelHome && <input type="hidden" name="next" value={`${panelHome}/entrar`} />}
      <button className="btn btn-ghost btn-sm" style={{ color: "#f2ece2" }}>
        Terminar sessão
      </button>
    </form>
  ) : panelHome ? null : (
    <Link href={href("/")} className="btn btn-ghost btn-sm" style={{ color: "#f2ece2" }}>
      {t.shell.backToSite}
    </Link>
  );
  return (
    <div className="shell">
      <header className="shell-header">
        <Link href={panelHome ?? href("/")} style={{ display: "block", lineHeight: 0 }}>
          <img
            src="/images/logo.png"
            alt={panelHome ? "Lareiras Pachinha — início do painel" : t.shell.logoAlt}
            style={{ height: "56px", width: "auto", filter: "brightness(0) invert(1)" }}
          />
        </Link>
        {languages ? (
          <div className="row" style={{ gap: 10 }}>
            <LanguageSwitcher />
            {actions}
          </div>
        ) : (
          actions
        )}
      </header>
      <main className="shell-main">{children}</main>
    </div>
  );
}
