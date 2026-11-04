// Gera src/lib/pdf-images.ts com as imagens do PDF do orçamento embutidas em base64.
// Na Cloudflare não há disco: o PDF não pode ler ficheiros de public/. Correr depois de mudar as imagens.
import { readFileSync, writeFileSync } from "node:fs";

const images = { logo: "public/images/logo-doc.png", glamm: "public/images/glammfire-doc.png" };
const lines = Object.entries(images).map(
  ([name, file]) => `export const ${name}Png = "${readFileSync(file).toString("base64")}";`,
);
writeFileSync(
  "src/lib/pdf-images.ts",
  `// Gerado por scripts/pdf-images.mjs a partir de public/images — não editar à mão.\n${lines.join("\n")}\n`,
);
