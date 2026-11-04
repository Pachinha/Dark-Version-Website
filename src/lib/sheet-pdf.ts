import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { glammPng, logoPng } from "./pdf-images";
import { DOCUMENT_HEADER } from "@/lib/company";
import { formatDate } from "@/lib/labels";
import { euro, lineTotal, sheetKind, sheetNumber, sheetTotals, type Sheet } from "@/lib/quote-sheet";

// Folha de orçamento / nota de encomenda em PDF — réplica da folha em papel da
// Glamm Fire | Lareiras Pachinha: mesmos campos, mesma ordem, mesmos textos (PT / FR / EN).
// Desenhada com pdf-lib (JavaScript puro): corre em Node e na Cloudflare, sem WebAssembly nem disco.
// As medidas são em pontos, de cima para baixo (y = 0 no topo da folha).
export type SheetClient = { name: string; address: string; phone: string; email: string; nif: string };

const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const INK = hex("#262019");
const FIRE = hex("#bf5b2d");
const LINE = hex("#c9bfb2");
const SOFT = hex("#7a6f64");
const MUTED = hex("#4d443c");
const HEAD_BG = hex("#f2ece2");
const DIVIDER = hex("#3b342e");
const MIN_ROWS = 12; // a folha em papel tem as linhas todas desenhadas

const W = 595.28; // A4
const H = 841.89;
const X0 = 30;
const X1 = W - 30;
const BOTTOM = H - 40; // limite do conteúdo (o rodapé fica por baixo)

// Colunas da tabela: Quant. | Quant. | Designação | Preço unit. | Importância
const COL = [31, 69, 107, 402.3, 480.3, 564.3];
const ROW_H = 20.4;
const ROW_LINE = 10.4; // altura de cada linha de texto (9 pt) dentro de uma linha da tabela
const TH_H = 25.9;

type Fonts = { regular: PDFFont; bold: PDFFont; italic: PDFFont };
type Run = { text: string; font: PDFFont; size: number; color: ReturnType<typeof rgb> };

class Sheetwriter {
  page!: PDFPage;
  constructor(
    private doc: PDFDocument,
    public f: Fonts,
    private footer: string,
  ) {
    this.newPage();
  }

  newPage() {
    this.page = this.doc.addPage([W, H]);
    this.text(this.footer, (X0 + X1) / 2 - this.width(this.footer, this.f.regular, 6.8) / 2, 822.5, this.f.regular, 6.8, SOFT);
  }

  // Só os caracteres que a Helvetica do PDF conhece (WinAnsi); o resto é aproximado.
  private charsets = new Map<PDFFont, Set<number>>();
  clean(s: string, font: PDFFont) {
    let known = this.charsets.get(font);
    if (!known) this.charsets.set(font, (known = new Set(font.getCharacterSet())));
    return Array.from(s.replace(/[   ]/g, " ").replace(/−/g, "–"))
      .map((c) => {
        if (c === "\n" || known.has(c.codePointAt(0)!)) return c;
        const base = c.normalize("NFD").replace(/[̀-ͯ]/g, "");
        return base && Array.from(base).every((b) => known!.has(b.codePointAt(0)!)) ? base : "?";
      })
      .join("");
  }

  width(s: string, font: PDFFont, size: number) {
    return font.widthOfTextAtSize(this.clean(s, font), size);
  }

  text(s: string, x: number, baseline: number, font: PDFFont, size: number, color = INK) {
    if (!s.trim()) return;
    // O pdf-lib mede com kerning ("TA", "AV"…) mas desenha sem ele: parte-se o texto nos pares
    // com kerning e cada pedaço vai para a posição medida — fica igual à folha anterior.
    const text = this.clean(s, font);
    const w = (t: string) => font.widthOfTextAtSize(t, size);
    let start = 0;
    for (let i = 1; i <= text.length; i++) {
      const kerned = i < text.length && Math.abs(w(text[i - 1] + text[i]) - w(text[i - 1]) - w(text[i])) > 0.001;
      if (i === text.length || kerned) {
        this.page.drawText(text.slice(start, i), { x: x + w(text.slice(0, start)), y: H - baseline, size, font, color });
        start = i;
      }
    }
  }

  // Texto com estilos mistos na mesma linha ("CLIENTE / CLIENT / CLIENT").
  runs(runs: Run[], x: number, baseline: number) {
    for (const r of runs) {
      this.text(r.text, x, baseline, r.font, r.size, r.color);
      x += this.width(r.text, r.font, r.size);
    }
    return x;
  }

  runsWidth(runs: Run[]) {
    return runs.reduce((w, r) => w + this.width(r.text, r.font, r.size), 0);
  }

  // Quebra o texto em linhas que cabem na largura (respeita as mudanças de linha do utilizador).
  wrap(s: string, font: PDFFont, size: number, max: number) {
    const lines: string[] = [];
    for (const para of (s ?? "").split(/\r?\n/)) {
      let line = "";
      for (const word of para.split(/\s+/).filter(Boolean)) {
        const next = line ? `${line} ${word}` : word;
        if (this.width(next, font, size) <= max) {
          line = next;
          continue;
        }
        if (line) lines.push(line);
        // Palavra maior que a largura (ex.: um link): parte-se à letra.
        line = "";
        for (const ch of word) {
          if (this.width(line + ch, font, size) > max && line) {
            lines.push(line);
            line = "";
          }
          line += ch;
        }
      }
      lines.push(line);
    }
    return lines.length ? lines : [""];
  }

  roundRect(x: number, y: number, w: number, h: number, r: number, opts: { border?: ReturnType<typeof rgb>; fill?: ReturnType<typeof rgb>; width?: number }) {
    const path = `M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;
    this.page.drawSvgPath(path, {
      x: 0,
      y: H,
      borderColor: opts.border,
      borderWidth: opts.border ? (opts.width ?? 1) : 0,
      color: opts.fill,
    });
  }

  line(x1: number, y1: number, x2: number, y2: number, thickness: number, color = LINE, dashArray?: number[]) {
    this.page.drawLine({ start: { x: x1, y: H - y1 }, end: { x: x2, y: H - y2 }, thickness, color, dashArray });
  }

  rect(x: number, y: number, w: number, h: number, color: ReturnType<typeof rgb>) {
    this.page.drawRectangle({ x, y: H - y - h, width: w, height: h, color });
  }

  image(img: PDFImage, x: number, y: number, w: number, h: number) {
    this.page.drawImage(img, { x, y: H - y - h, width: w, height: h });
  }

  caption(pt: string, rest: string, size = 7): Run[] {
    return [
      { text: pt, font: this.f.bold, size, color: MUTED },
      { text: ` / ${rest}`, font: this.f.italic, size: size - 1.2, color: SOFT },
    ];
  }

  // Caixa com legenda e valor (10 pt). Devolve a altura usada; o valor quebra linha se for longo.
  field(x: number, y: number, w: number, pt: string, rest: string, value: string, minH = 31.7) {
    const lines = this.wrap(value, this.f.regular, 10, w - 16);
    const h = Math.max(minH, 31.7 + (lines.length - 1) * 11.56);
    this.roundRect(x + 0.5, y + 0.5, w - 1, h - 1, 6, { border: LINE });
    this.runs(this.caption(pt, rest), x + 8, y + 11.33);
    lines.forEach((l, i) => this.text(l, x + 8, y + 23.75 + i * 11.56, this.f.regular, 10));
    return h;
  }

  fieldHeight(w: number, value: string, minH = 31.7) {
    return Math.max(minH, 31.7 + (this.wrap(value, this.f.regular, 10, w - 16).length - 1) * 11.56);
  }

  check(on: boolean, label: string, sub: string, boxTop: number) {
    this.roundRect(427.8, boxTop + 0.5, 10, 10, 2, { border: INK });
    if (on) this.text("X", 432.8 - this.width("X", this.f.bold, 9) / 2, boxTop + 9.18, this.f.bold, 9);
    this.text(label, 444.3, boxTop + 5.58, this.f.bold, 9);
    this.text(sub, 444.3, boxTop + 12.54, this.f.regular, 5.8, SOFT);
  }
}

const num = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(Number(n)).replace(".", ","));
const pct = (n: number) => String(Number(n)).replace(".", ",");
const b64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function renderSheetPdf(sheet: Sheet, client: SheetClient) {
  const doc = await PDFDocument.create();
  doc.setTitle(`${sheetKind(sheet)} N.º ${sheetNumber(sheet.number)} — Lareiras Pachinha`);
  doc.setAuthor("Glamm Fire | Lareiras Pachinha");
  const f: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };
  // Logótipo Glamm Fire (de glammfire.com, recolorido em grafite para fundo branco) e Pachinha.
  const glamm = await doc.embedPng(b64(glammPng));
  const logo = await doc.embedPng(b64(logoPng));
  const w = new Sheetwriter(doc, f, `Este documento não serve de fatura. · Glamm Fire | Lareiras Pachinha · NIF ${DOCUMENT_HEADER.nif}`);
  const t = sheetTotals(sheet);

  // ── Cabeçalho: marcas e contactos | Data, Entrega, N.I.F. | Orçamento / Nota encomenda, N.º ──
  w.image(glamm, 30, 30, 107.2, 46);
  w.rect(147.2, 31, 0.9, 44, DIVIDER);
  w.image(logo, 158.1, 32, 107.2, 42);
  [
    `NIF: ${DOCUMENT_HEADER.nif}`,
    `Tel. ${DOCUMENT_HEADER.phones.join(" | ")}`,
    `E-mail: ${DOCUMENT_HEADER.email}`,
    DOCUMENT_HEADER.address,
  ].forEach((l, i) => w.text(l, 30, 90.43 + i * 10.3, f.regular, 7.1, MUTED));

  w.field(275.3, 30, 134, "DATA", "DATE / DATE", formatDate(sheet.sent_at ?? sheet.created_at));
  w.field(275.3, 67.7, 134, "ENTREGA", "LIVRAISON / DELIVERY", sheet.delivery, 31.7);
  w.field(275.3, 105.4, 134, "N.I.F.", "N.I.F. / TAX NUMBER", client.nif);

  w.roundRect(419.8, 30.5, 145, 53.6, 6, { border: LINE });
  w.check(sheet.is_quote, "ORÇAMENTO", "DEVIS / BUDGET", 41.6);
  w.check(sheet.is_order, "NOTA ENCOMENDA", "BON DE COMMANDE / ORDER NOTE", 61.9);
  w.roundRect(419.8, 91.1, 145, 29, 6, { border: LINE });
  w.text("N.º", 427.3, 109.18, f.bold, 9);
  // Número com espaçamento entre algarismos, a cor de fogo.
  let nx = 449.6;
  for (const ch of sheetNumber(sheet.number)) {
    w.text(ch, nx, 108.25, f.bold, 14, FIRE);
    nx += w.width(ch, f.bold, 14) + 1;
  }

  // ── Cliente, Morada, Telefone ──
  let y = 145.1;
  y += w.field(X0, y, X1 - X0, "CLIENTE", "CLIENT / CLIENT", client.name) + 8;
  const rowH = Math.max(w.fieldHeight(377.3, client.address), w.fieldHeight(150, client.phone));
  w.field(X0, y, 377.3, "MORADA", "ADRESSE / ADRESS", client.address, rowH);
  w.field(415.3, y, 150, "TLEF.", "TEL / TEL", client.phone, rowH);
  y += rowH + 10;

  // ── Linhas da tabela (o cabeçalho repete-se se a tabela passar para outra página) ──
  const head = (top: number) => {
    w.page.drawSvgPath(
      `M ${COL[0] + 5} ${top + 1} H ${COL[5] - 5} Q ${COL[5]} ${top + 1} ${COL[5]} ${top + 6} V ${top + TH_H} H ${COL[0]} V ${top + 6} Q ${COL[0]} ${top + 1} ${COL[0] + 5} ${top + 1} Z`,
      { x: 0, y: H, color: HEAD_BG },
    );
    w.line(COL[0], top + TH_H, COL[5], top + TH_H, 1);
    for (const x of COL.slice(1, 5)) w.line(x, top + 1, x, top + TH_H - 1, 0.5);
    const base = top + 12.3;
    w.text("QUANT.", 36.8, base, f.bold, 7);
    w.text("QUANT.", 74.8, base, f.bold, 7);
    const desc = w.caption("DESIGNAÇÃO", "DÉSIGNATION / DESCRIPTION");
    w.runs(desc, (COL[2] + COL[3]) / 2 - w.runsWidth(desc) / 2, base);
    const twoLine = (pt: string, sub: string, a: number, b: number) => {
      w.text(pt, (a + b) / 2 - w.width(pt, f.bold, 7) / 2, base, f.bold, 7, MUTED);
      w.text(sub, (a + b) / 2 - w.width(sub, f.italic, 5.6) / 2, top + 18.7, f.italic, 5.6, SOFT);
    };
    twoLine("PREÇO UNIT.", "PRIX UNIT. / UNIT PRICE", COL[3], COL[4]);
    twoLine("IMPORTÂNCIA", "MONTANT HT / AMOUNT", COL[4], COL[5]);
    return top + TH_H;
  };

  const rows = [
    ...sheet.items.map((item) => ({
      qty: num(item.qty),
      qty2: num(item.qty2),
      desc: w.wrap(item.description, f.regular, 9, COL[3] - COL[2] - 10),
      unit: euro(item.unit_price),
      total: euro(lineTotal(item)),
    })),
    ...Array.from({ length: Math.max(0, MIN_ROWS - sheet.items.length) }, () => ({ qty: "", qty2: "", desc: [""], unit: "", total: "" })),
  ];

  let tableTop = y;
  let cy = head(tableTop);
  const closeTable = (bottom: number) => w.roundRect(X0 + 0.5, tableTop + 0.5, X1 - X0 - 1, bottom + 1 - tableTop - 1, 6, { border: LINE });
  for (const r of rows) {
    const h = Math.max(ROW_H, 10 + r.desc.length * ROW_LINE);
    if (cy + h > BOTTOM) {
      closeTable(cy);
      w.newPage();
      tableTop = 30;
      cy = head(tableTop);
    }
    const base = cy + 13.08;
    const center = (s: string, a: number, b: number) => w.text(s, (a + b) / 2 - w.width(s, f.regular, 9) / 2, base, f.regular, 9);
    const right = (s: string, edge: number) => w.text(s, edge - w.width(s, f.regular, 9), base, f.regular, 9);
    center(r.qty, COL[0], COL[1]);
    center(r.qty2, COL[1], COL[2]);
    r.desc.forEach((l, i) => w.text(l, COL[2] + 5, base + i * ROW_LINE, f.regular, 9));
    right(r.unit, COL[4] - 5.5);
    right(r.total, COL[5] - 5);
    for (const x of COL.slice(1, 5)) w.line(x, cy, x, cy + h - 0.5, 0.5);
    cy += h;
    w.line(COL[0], cy, COL[5], cy, 0.5);
  }
  closeTable(cy);
  y = cy + 1 + 10;

  // ── Condições de pagamento, Observações | Soma, IVA, Sub-soma, Desc., Total ──
  const payH = w.fieldHeight(303.3, sheet.payment_terms, 44);
  const notesH = w.fieldHeight(303.3, sheet.notes, 54);
  const bottomH = Math.max(payH + 8 + notesH, 100);
  // Aceitação e assinaturas (≈ 101 pt) ficam juntas com os totais, como na folha em papel.
  if (y + bottomH + 12 + 89 > BOTTOM) {
    w.newPage();
    y = 30;
  }
  w.field(X0, y, 303.3, "CONDIÇÕES DE PAGAMENTO", "MODE DE RÈGLEMENT / PAYEMENT CONDITIONS", sheet.payment_terms, payH);
  w.field(X0, y + payH + 8, 303.3, "OBSERVAÇÕES", "OBSERVATIONS / OBSERVACIONS", sheet.notes, notesH);

  const TX = 345.3;
  const totalRow = (i: number, label: Run[], value: string) => {
    const base = y + 11.7 + i * 18.4;
    w.runs(label, TX, base);
    w.text(value, X1 - w.width(value, f.regular, 9), base, f.regular, 9);
    w.line(TX, y + 17.4 + i * 18.4, X1, y + 17.4 + i * 18.4, 0.5, LINE, [1, 0.6]);
  };
  const withPct = (pt: string, rest: string, p: number): Run[] => [
    { text: pt, font: f.bold, size: 8, color: MUTED },
    { text: ` / ${rest}`, font: f.italic, size: 6.8, color: SOFT },
    { text: ` ${pct(p)} %`, font: f.bold, size: 8, color: INK },
  ];
  totalRow(0, w.caption("SOMA", "TOTAL HT / SUM", 8), euro(t.sum));
  totalRow(1, withPct("IVA", "TVA / VAT", sheet.vat_rate), euro(t.vat));
  totalRow(2, w.caption("SUB-SOMA", "TOTAL TTC / SUB-TOTAL", 8), euro(t.subtotal));
  totalRow(3, withPct("DESC.", "REMISE / DISCOUNT", sheet.discount_pct), Number(sheet.discount_pct) > 0 ? `− ${euro(t.discount)}` : euro(0));
  w.line(TX, y + 77.2, X1, y + 77.2, 1.2, INK);
  w.runs(w.caption("TOTAL", "TOTAL / TOTAL", 10), TX, y + 94.05);
  const grand = euro(t.total);
  w.text(grand, X1 - w.width(grand, f.bold, 12), y + 93.6, f.bold, 12);
  y += bottomH + 12;

  // ── Aceitação das condições gerais e assinaturas ──
  w.text("Li e aceito as condições gerais de vendas descritas no verso deste documento.", X0, y + 6.66, f.regular, 7.4, MUTED);
  w.text("J'accepte les conditions générales de ventes décrites au verso de ce document.", X0, y + 17.0, f.italic, 7.4, MUTED);
  w.text("I read and I accept the general sales conditions described in the verse of this document.", X0, y + 27.3, f.italic, 7.4, MUTED);
  y += 37;
  w.roundRect(X0 + 0.5, y + 0.5, 260.6, 51, 6, { border: LINE });
  w.runs(w.caption("O CLIENTE", "CLIENT / CLIENT"), X0 + 8, y + 11.33);
  w.roundRect(304.1, y + 0.5, 260.7, 51, 6, { border: LINE });
  w.text("GLAMM FIRE", 311.6, y + 11.33, f.bold, 7, MUTED);

  return Buffer.from(await doc.save());
}

export const sheetFileName = (sheet: Pick<Sheet, "number" | "is_quote" | "is_order">) =>
  `${sheet.is_quote ? "Orcamento" : "Nota-encomenda"}-${sheetNumber(sheet.number)}-Lareiras-Pachinha.pdf`;
