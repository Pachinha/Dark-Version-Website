import Link from "next/link";
import { logout } from "@/app/actions/auth";

export default function Shell({
  children,
  signedIn = false,
}: {
  children: React.ReactNode;
  signedIn?: boolean;
}) {
  return (
    <div className="shell">
      <header className="shell-header">
        <Link href="/" style={{ display: "block", lineHeight: 0 }}>
          <img
            src="/images/logo.png"
            alt="Lareiras Pachinha — voltar ao site"
            style={{ height: "56px", width: "auto", filter: "brightness(0) invert(1)" }}
          />
        </Link>
        {signedIn ? (
          <form action={logout}>
            <button className="btn btn-ghost btn-sm" style={{ color: "#f2ece2" }}>
              Terminar sessão
            </button>
          </form>
        ) : (
          <Link href="/" className="btn btn-ghost btn-sm" style={{ color: "#f2ece2" }}>
            ← Voltar ao site
          </Link>
        )}
      </header>
      <main className="shell-main">{children}</main>
    </div>
  );
}
