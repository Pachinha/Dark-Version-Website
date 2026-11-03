// Telefones com indicativo do país (+351912345678). Partilhado pelo browser e pelo servidor.

export type Country = { iso: string; name: string; dial: string };

// Portugal primeiro; depois os países mais prováveis (Espanha, emigração, PALOP, Europa).
export const COUNTRIES: Country[] = [
  { iso: "PT", name: "Portugal", dial: "351" },
  { iso: "ES", name: "Espanha", dial: "34" },
  { iso: "FR", name: "França", dial: "33" },
  { iso: "CH", name: "Suíça", dial: "41" },
  { iso: "LU", name: "Luxemburgo", dial: "352" },
  { iso: "DE", name: "Alemanha", dial: "49" },
  { iso: "GB", name: "Reino Unido", dial: "44" },
  { iso: "BE", name: "Bélgica", dial: "32" },
  { iso: "NL", name: "Países Baixos", dial: "31" },
  { iso: "IE", name: "Irlanda", dial: "353" },
  { iso: "IT", name: "Itália", dial: "39" },
  { iso: "AD", name: "Andorra", dial: "376" },
  { iso: "AT", name: "Áustria", dial: "43" },
  { iso: "DK", name: "Dinamarca", dial: "45" },
  { iso: "SE", name: "Suécia", dial: "46" },
  { iso: "NO", name: "Noruega", dial: "47" },
  { iso: "PL", name: "Polónia", dial: "48" },
  { iso: "BR", name: "Brasil", dial: "55" },
  { iso: "AO", name: "Angola", dial: "244" },
  { iso: "MZ", name: "Moçambique", dial: "258" },
  { iso: "CV", name: "Cabo Verde", dial: "238" },
  { iso: "GW", name: "Guiné-Bissau", dial: "245" },
  { iso: "ST", name: "São Tomé e Príncipe", dial: "239" },
  { iso: "TL", name: "Timor-Leste", dial: "670" },
  { iso: "US", name: "Estados Unidos", dial: "1" },
  { iso: "CA", name: "Canadá", dial: "1" },
  { iso: "VE", name: "Venezuela", dial: "58" },
  { iso: "ZA", name: "África do Sul", dial: "27" },
  { iso: "AU", name: "Austrália", dial: "61" },
];

export const byIso = (iso: string | null | undefined) => COUNTRIES.find((c) => c.iso === iso?.toUpperCase());
// Itália mantém o 0 inicial nos fixos; nos outros países o 0 nacional cai no formato internacional.
export const national = (digits: string, iso: string) => (iso === "IT" ? digits : digits.replace(/^0+/, ""));

// "+33612345678" → { country: FR, rest: "612345678" } (indicativo mais longo primeiro).
export function split(value: string): { country: Country | null; rest: string } {
  const v = value.trim();
  if (!v.startsWith("+") && !v.startsWith("00")) return { country: null, rest: v.replace(/\D/g, "") };
  const digits = v.replace(/\D/g, "").replace(/^00/, "");
  const match = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length).find((c) => digits.startsWith(c.dial));
  return match ? { country: match, rest: digits.slice(match.dial.length) } : { country: null, rest: digits };
}

// Validação: com indicativo, Portugal tem 9 algarismos (começa por 2 ou 9); os outros países
// entre 6 e 13. Números antigos sem indicativo: pelo menos 9 algarismos.
export function isValidPhone(value: string) {
  const v = value.trim();
  if (!v) return false;
  const { country, rest } = split(v);
  if (!v.startsWith("+") && !v.startsWith("00")) return rest.length >= 9 && rest.length <= 15;
  if (!country) return false;
  if (country.iso === "PT") return /^[29]\d{8}$/.test(rest);
  return rest.length >= 6 && rest.length <= 13;
}
