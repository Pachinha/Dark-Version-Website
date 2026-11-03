import Link from "next/link";
import { panel } from "@/lib/panel";

// Registo do painel que não existe (ou que deixou de estar partilhado) — aparece dentro do painel, com saída.
export default function PanelNotFound() {
  return (
    <section className="panel" style={{ maxWidth: 640 }}>
      <span className="eyebrow">Registo não encontrado</span>
      <h2 style={{ marginTop: 4 }}>Não encontrámos o que procura</h2>
      <p style={{ marginTop: 0 }}>Isto costuma acontecer quando:</p>
      <ul className="muted" style={{ marginTop: 0, lineHeight: 1.7 }}>
        <li>o cliente ou pedido foi apagado;</li>
        <li>a partilha consigo foi retirada por um administrador;</li>
        <li>o link está incompleto ou foi copiado com erros.</li>
      </ul>
      <div className="row" style={{ marginTop: 16 }}>
        <Link href={panel()} className="btn btn-ink">← Voltar ao início do painel</Link>
      </div>
    </section>
  );
}
