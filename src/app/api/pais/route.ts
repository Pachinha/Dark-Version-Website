// País de onde o visitante está a aceder (pelo IP), para escolher o indicativo do telefone.
// Na Vercel vem no cabeçalho x-vercel-ip-country (em Cloudflare, cf-ipcountry). Em local não há: devolve "".
export function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry") ?? "";
  return Response.json({ country: /^[A-Z]{2}$/.test(country) ? country : "" }, { headers: { "cache-control": "private, no-store" } });
}
