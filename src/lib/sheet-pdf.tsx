import "server-only";
import { glammPng, logoPng } from "./pdf-images";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer, type Styles } from "@react-pdf/renderer";
import { DOCUMENT_HEADER } from "@/lib/company";
import { formatDate } from "@/lib/labels";
import { euro, lineTotal, sheetKind, sheetNumber, sheetTotals, type Sheet } from "@/lib/quote-sheet";

// Folha de orçamento / nota de encomenda em PDF — réplica da folha em papel da
// Glamm Fire | Lareiras Pachinha: mesmos campos, mesma ordem, mesmos textos (PT / FR / EN).
export type SheetClient = { name: string; address: string; phone: string; email: string; nif: string };

const INK = "#262019";
const FIRE = "#bf5b2d";
const LINE = "#c9bfb2";
const SOFT = "#7a6f64";
const MIN_ROWS = 12; // a folha em papel tem as linhas todas desenhadas

const s = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 40, paddingHorizontal: 30, fontSize: 9, fontFamily: "Helvetica", color: INK },
  // Cabeçalho
  header: { flexDirection: "row", gap: 10 },
  brandCol: { flex: 1.25 },
  logos: { flexDirection: "row", alignItems: "center", gap: 10 },
  glamm: { width: 118, height: 46 }, // 704×274
  divider: { width: 1, height: 44, backgroundColor: "#3b342e" },
  logo: { width: 118, height: 42 },
  company: { marginTop: 8, fontSize: 7.1, lineHeight: 1.45, color: "#4d443c" },
  midCol: { width: 134, gap: 6 },
  rightCol: { width: 146, gap: 6 },
  // Caixas com legenda
  field: { borderWidth: 1, borderColor: LINE, borderRadius: 6, paddingHorizontal: 7, paddingTop: 4, paddingBottom: 5, minHeight: 30 },
  value: { fontSize: 10, marginTop: 2 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 6, marginVertical: 2 },
  checkbox: { width: 11, height: 11, borderWidth: 1, borderColor: INK, borderRadius: 2, alignItems: "center", justifyContent: "center" },
  checkMark: { fontFamily: "Helvetica-Bold", fontSize: 9, lineHeight: 1 },
  checkLabel: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  checkSub: { fontSize: 5.8, color: SOFT },
  number: { flexDirection: "row", alignItems: "baseline", gap: 10, paddingVertical: 4 },
  numberValue: { fontFamily: "Helvetica-Bold", fontSize: 14, color: FIRE, letterSpacing: 1 },
  // Cliente
  clientRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  // Tabela
  table: { marginTop: 10, borderWidth: 1, borderColor: LINE, borderRadius: 6 },
  th: { flexDirection: "row", backgroundColor: "#f2ece2", borderBottomWidth: 1, borderColor: LINE },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: LINE, minHeight: 20 },
  cell: { paddingHorizontal: 5, paddingVertical: 5, borderRightWidth: 0.5, borderColor: LINE },
  cQty: { width: 38, textAlign: "center" },
  cDesc: { flex: 1 },
  cUnit: { width: 78, textAlign: "right" },
  cTotal: { width: 84, textAlign: "right", borderRightWidth: 0 },
  // Rodapé da folha
  bottom: { flexDirection: "row", marginTop: 10, gap: 12 },
  left: { flex: 1, gap: 8 },
  totals: { width: 220, gap: 1 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingVertical: 3.5, borderBottomWidth: 0.5, borderColor: LINE, borderStyle: "dashed" },
  totalLabel: { fontFamily: "Helvetica-Bold", fontSize: 9.5 },
  grand: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 3, paddingTop: 5, paddingBottom: 3, borderTopWidth: 1.2, borderColor: INK },
  accept: { marginTop: 12, fontSize: 7.4, lineHeight: 1.4, color: "#4d443c" },
  signRow: { flexDirection: "row", gap: 12, marginTop: 6 },
  signBox: { flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 6, paddingHorizontal: 7, paddingTop: 4, height: 52 },
  footer: { position: "absolute", bottom: 18, left: 30, right: 30, fontSize: 6.8, color: SOFT, textAlign: "center" },
  bold: { fontFamily: "Helvetica-Bold" },
});

// Legenda trilingue da folha: "CLIENTE / CLIENT / CLIENT" (português em destaque).
function Caption({ pt, rest, size = 7 }: { pt: string; rest: string; size?: number }) {
  return (
    <Text style={{ fontSize: size, color: SOFT }}>
      <Text style={{ fontFamily: "Helvetica-Bold", color: "#4d443c" }}>{pt}</Text>
      <Text style={{ fontFamily: "Helvetica-Oblique", fontSize: size - 1.2 }}> / {rest}</Text>
    </Text>
  );
}

function Field({ pt, rest, value, style }: { pt: string; rest: string; value?: string; style?: Styles[string] }) {
  return (
    <View style={[s.field, style ?? {}]}>
      <Caption pt={pt} rest={rest} />
      <Text style={s.value}>{value || " "}</Text>
    </View>
  );
}

function Check({ on, label, sub }: { on: boolean; label: string; sub: string }) {
  return (
    <View style={s.checkRow}>
      <View style={s.checkbox}><Text style={s.checkMark}>{on ? "X" : " "}</Text></View>
      <View>
        <Text style={s.checkLabel}>{label}</Text>
        <Text style={s.checkSub}>{sub}</Text>
      </View>
    </View>
  );
}

// As imagens vêm embutidas (scripts/pdf-images.mjs): no servidor da Cloudflare não há ficheiros para ler.
let logo: Buffer | null = null;
let glamm: Buffer | null = null;
const getLogo = () => (logo ??= Buffer.from(logoPng, "base64"));
// Logótipo Glamm Fire (de glammfire.com, recolorido em grafite para fundo branco).
const getGlamm = () => (glamm ??= Buffer.from(glammPng, "base64"));

const num = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(Number(n)).replace(".", ","));
const pct = (n: number) => String(Number(n)).replace(".", ",");

function SheetDocument({ sheet, client }: { sheet: Sheet; client: SheetClient }) {
  const t = sheetTotals(sheet);
  const blanks = Math.max(0, MIN_ROWS - sheet.items.length);
  return (
    <Document title={`${sheetKind(sheet)} N.º ${sheetNumber(sheet.number)} — Lareiras Pachinha`} author="Glamm Fire | Lareiras Pachinha">
      <Page size="A4" style={s.page}>
        {/* ── Cabeçalho: marcas e contactos | Data, Entrega, N.I.F. | Orçamento / Nota encomenda, N.º ── */}
        <View style={s.header}>
          <View style={s.brandCol}>
            <View style={s.logos}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- imagem de um PDF, não de uma página web */}
              <Image src={{ data: getGlamm(), format: "png" }} style={s.glamm} />
              <View style={s.divider} />
              {/* eslint-disable-next-line jsx-a11y/alt-text -- imagem de um PDF, não de uma página web */}
              <Image src={{ data: getLogo(), format: "png" }} style={s.logo} />
            </View>
            <Text style={s.company}>
              NIF: {DOCUMENT_HEADER.nif}
              {"\n"}Tel. {DOCUMENT_HEADER.phones.join(" | ")}
              {"\n"}E-mail: {DOCUMENT_HEADER.email}
              {"\n"}{DOCUMENT_HEADER.address}
            </Text>
          </View>

          <View style={s.midCol}>
            <Field pt="DATA" rest="DATE / DATE" value={formatDate(sheet.sent_at ?? sheet.created_at)} />
            <Field pt="ENTREGA" rest="LIVRAISON / DELIVERY" value={sheet.delivery} />
            <Field pt="N.I.F." rest="N.I.F. / TAX NUMBER" value={client.nif} />
          </View>

          <View style={s.rightCol}>
            <View style={[s.field, { paddingVertical: 6 }]}>
              <Check on={sheet.is_quote} label="ORÇAMENTO" sub="DEVIS / BUDGET" />
              <Check on={sheet.is_order} label="NOTA ENCOMENDA" sub="BON DE COMMANDE / ORDER NOTE" />
            </View>
            <View style={[s.field, s.number]}>
              <Text style={s.bold}>N.º</Text>
              <Text style={s.numberValue}>{sheetNumber(sheet.number)}</Text>
            </View>
          </View>
        </View>

        {/* ── Cliente, Morada, Telefone ── */}
        <View style={s.clientRow}>
          <Field pt="CLIENTE" rest="CLIENT / CLIENT" value={client.name} style={{ flex: 1 }} />
        </View>
        <View style={s.clientRow}>
          <Field pt="MORADA" rest="ADRESSE / ADRESS" value={client.address} style={{ flex: 1 }} />
          <Field pt="TLEF." rest="TEL / TEL" value={client.phone} style={{ width: 150 }} />
        </View>

        {/* ── Linhas: Quant. | Quant. | Designação | Preço unit. | Importância ── */}
        <View style={s.table}>
          <View style={s.th} fixed>
            <View style={[s.cell, s.cQty]}><Text style={[s.bold, { fontSize: 7 }]}>QUANT.</Text></View>
            <View style={[s.cell, s.cQty]}><Text style={[s.bold, { fontSize: 7 }]}>QUANT.</Text></View>
            <View style={[s.cell, s.cDesc, { alignItems: "center" }]}><Caption pt="DESIGNAÇÃO" rest="DÉSIGNATION / DESCRIPTION" /></View>
            <View style={[s.cell, s.cUnit]}>
              <Text style={[s.bold, { fontSize: 7, color: "#4d443c", textAlign: "center" }]}>PREÇO UNIT.</Text>
              <Text style={{ fontSize: 5.6, color: SOFT, fontFamily: "Helvetica-Oblique", textAlign: "center" }}>PRIX UNIT. / UNIT PRICE</Text>
            </View>
            <View style={[s.cell, s.cTotal]}>
              <Text style={[s.bold, { fontSize: 7, color: "#4d443c", textAlign: "center" }]}>IMPORTÂNCIA</Text>
              <Text style={{ fontSize: 5.6, color: SOFT, fontFamily: "Helvetica-Oblique", textAlign: "center" }}>MONTANT HT / AMOUNT</Text>
            </View>
          </View>
          {sheet.items.map((item, i) => (
            <View key={i} style={s.tr} wrap={false}>
              <Text style={[s.cell, s.cQty]}>{num(item.qty)}</Text>
              <Text style={[s.cell, s.cQty]}>{num(item.qty2)}</Text>
              <Text style={[s.cell, s.cDesc]}>{item.description}</Text>
              <Text style={[s.cell, s.cUnit]}>{euro(item.unit_price)}</Text>
              <Text style={[s.cell, s.cTotal]}>{euro(lineTotal(item))}</Text>
            </View>
          ))}
          {Array.from({ length: blanks }, (_, i) => (
            <View key={`b${i}`} style={s.tr}>
              <Text style={[s.cell, s.cQty]}> </Text>
              <Text style={[s.cell, s.cQty]}> </Text>
              <Text style={[s.cell, s.cDesc]}> </Text>
              <Text style={[s.cell, s.cUnit]}> </Text>
              <Text style={[s.cell, s.cTotal]}> </Text>
            </View>
          ))}
        </View>

        {/* ── Condições de pagamento, Observações | Soma, IVA, Sub-soma, Desc., Total ── */}
        <View style={s.bottom} wrap={false}>
          <View style={s.left}>
            <Field pt="CONDIÇÕES DE PAGAMENTO" rest="MODE DE RÈGLEMENT / PAYEMENT CONDITIONS" value={sheet.payment_terms} style={{ minHeight: 44 }} />
            <Field pt="OBSERVAÇÕES" rest="OBSERVATIONS / OBSERVACIONS" value={sheet.notes} style={{ minHeight: 54 }} />
          </View>
          <View style={s.totals}>
            <View style={s.totalRow}>
              <Caption pt="SOMA" rest="TOTAL HT / SUM" size={8} />
              <Text>{euro(t.sum)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={{ fontSize: 8, color: SOFT }}>
                <Text style={{ fontFamily: "Helvetica-Bold", color: "#4d443c" }}>IVA</Text>
                <Text style={{ fontFamily: "Helvetica-Oblique", fontSize: 6.8 }}> / TVA / VAT </Text>
                <Text style={{ fontFamily: "Helvetica-Bold", color: INK }}>{pct(sheet.vat_rate)} %</Text>
              </Text>
              <Text>{euro(t.vat)}</Text>
            </View>
            <View style={s.totalRow}>
              <Caption pt="SUB-SOMA" rest="TOTAL TTC / SUB-TOTAL" size={8} />
              <Text>{euro(t.subtotal)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={{ fontSize: 8, color: SOFT }}>
                <Text style={{ fontFamily: "Helvetica-Bold", color: "#4d443c" }}>DESC.</Text>
                <Text style={{ fontFamily: "Helvetica-Oblique", fontSize: 6.8 }}> / REMISE / DISCOUNT </Text>
                <Text style={{ fontFamily: "Helvetica-Bold", color: INK }}>{pct(sheet.discount_pct)} %</Text>
              </Text>
              <Text>{Number(sheet.discount_pct) > 0 ? `− ${euro(t.discount)}` : euro(0)}</Text>
            </View>
            <View style={s.grand}>
              <Caption pt="TOTAL" rest="TOTAL / TOTAL" size={10} />
              <Text style={[s.bold, { fontSize: 12 }]}>{euro(t.total)}</Text>
            </View>
          </View>
        </View>

        {/* ── Aceitação das condições gerais e assinaturas ── */}
        <View wrap={false}>
          <Text style={s.accept}>
            Li e aceito as condições gerais de vendas descritas no verso deste documento.
            {"\n"}<Text style={{ fontFamily: "Helvetica-Oblique" }}>J&apos;accepte les conditions générales de ventes décrites au verso de ce document.</Text>
            {"\n"}<Text style={{ fontFamily: "Helvetica-Oblique" }}>I read and I accept the general sales conditions described in the verse of this document.</Text>
          </Text>
          <View style={s.signRow}>
            <View style={s.signBox}><Caption pt="O CLIENTE" rest="CLIENT / CLIENT" /></View>
            <View style={s.signBox}><Text style={[s.bold, { fontSize: 7, color: "#4d443c" }]}>GLAMM FIRE</Text></View>
          </View>
        </View>

        <Text style={s.footer} fixed>
          Este documento não serve de fatura. · Glamm Fire | Lareiras Pachinha · NIF {DOCUMENT_HEADER.nif}
        </Text>
      </Page>
    </Document>
  );
}

export function renderSheetPdf(sheet: Sheet, client: SheetClient) {
  return renderToBuffer(<SheetDocument sheet={sheet} client={client} />);
}

export const sheetFileName = (sheet: Pick<Sheet, "number" | "is_quote" | "is_order">) =>
  `${sheet.is_quote ? "Orcamento" : "Nota-encomenda"}-${sheetNumber(sheet.number)}-Lareiras-Pachinha.pdf`;
