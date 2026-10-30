import Shell from "@/components/account/Shell";
import { PRIVACY_VERSION } from "@/lib/legal";
import { formatDate } from "@/lib/labels";

export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Shell>
      <article className="panel legal" style={{ margin: "0 auto" }}>
        <span className="eyebrow">Informação legal</span>
        <h1 className="page-title">{title}</h1>
        <p className="muted">Última atualização: {formatDate(PRIVACY_VERSION)}</p>
        {children}
      </article>
    </Shell>
  );
}
