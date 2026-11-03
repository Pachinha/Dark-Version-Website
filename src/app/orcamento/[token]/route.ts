import { loadSheet } from "@/lib/sheet-data";
import { renderSheetPdf, sheetFileName } from "@/lib/sheet-pdf";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// PDF do orçamento para o cliente (link enviado por WhatsApp/email). O token é aleatório
// e impossível de adivinhar; só as folhas já enviadas ficam acessíveis.
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const found = UUID.test(token) ? await loadSheet({ token }) : null;
  if (!found || !found.sheet.sent_at) {
    return new Response("Este orçamento não existe ou já não está disponível. Contacte a Lareiras Pachinha.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
  const pdf = await renderSheetPdf(found.sheet, found.client);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${sheetFileName(found.sheet)}"`,
      "cache-control": "private, no-store",
      "x-robots-tag": "noindex",
    },
  });
}
