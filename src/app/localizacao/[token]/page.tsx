import Shell from "@/components/account/Shell";
import { createAdminClient } from "@/lib/supabase/server";
import LocationShare from "./LocationShare";

export const metadata = { title: "Partilhar localização — Lareiras Pachinha", robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Página que o cliente abre a partir do link enviado pela Lareiras Pachinha.
// Não mostra dados do cliente: só pede a localização.
export default async function LocationRequestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { data: req } = UUID.test(token)
    ? await createAdminClient().from("location_requests").select("expires_at, fulfilled_at").eq("token", token).maybeSingle()
    : { data: null };

  const problem = !req
    ? { title: "Este link não existe", text: "Confirme que abriu o link completo que lhe enviámos. Se o problema continuar, responda à nossa mensagem e enviamos um novo." }
    : req.fulfilled_at
      ? { title: "✓ Já recebemos a sua localização", text: "Obrigado! Não precisa de fazer mais nada. Se a morada mudou, responda à nossa mensagem." }
      : new Date(req.expires_at) < new Date()
        ? { title: "Este link expirou", text: "Por segurança, os links de localização só funcionam durante alguns dias. Responda à nossa mensagem e enviamos um novo." }
        : null;

  return (
    <Shell>
      <div className="panel auth-card">
        <span className="eyebrow">Lareiras Pachinha · Localização</span>
        {problem ? (
          <>
            <h1>{problem.title}</h1>
            <p className="muted" style={{ marginBottom: 0 }}>{problem.text}</p>
          </>
        ) : (
          <>
            <h1>Partilhe a localização da morada</h1>
            <p className="muted" style={{ marginTop: 0 }}>
              Assim a nossa equipa chega diretamente à sua porta. Se estiver no local, use a localização do telemóvel;
              se não, pesquise a morada.
            </p>
            <LocationShare token={token} />
            <p className="hint" style={{ margin: "16px 0 0" }}>
              A localização é lida uma única vez e serve apenas para esta visita — nunca seguimos a sua posição.
            </p>
          </>
        )}
      </div>
    </Shell>
  );
}
