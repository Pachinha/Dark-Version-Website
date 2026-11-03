import { getCurrentUser } from "@/lib/auth";
import { PANEL_SLUG } from "@/lib/panel";
import { loadSheet } from "@/lib/sheet-data";
import { renderSheetPdf, sheetFileName } from "@/lib/sheet-pdf";

// Pré-visualização do PDF no painel (também para rascunhos). Só administradores com 2FA.
// (As rotas não passam pelo layout do painel, por isso o endereço secreto é verificado aqui.)
export async function GET(_: Request, { params }: { params: Promise<{ painel: string; sheet: string }> }) {
  const { painel, sheet: id } = await params;
  if (!PANEL_SLUG || painel !== PANEL_SLUG) return new Response("Not found", { status: 404 });
  const current = await getCurrentUser();
  if (!current || current.profile.role !== "admin" || !current.mfaVerified) {
    return new Response("Sem acesso.", { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  const found = /^[0-9a-f-]{36}$/i.test(id) ? await loadSheet({ id }) : null;
  if (!found) return new Response("Folha não encontrada.", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  const pdf = await renderSheetPdf(found.sheet, found.client);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${sheetFileName(found.sheet)}"`,
      "cache-control": "private, no-store",
    },
  });
}
