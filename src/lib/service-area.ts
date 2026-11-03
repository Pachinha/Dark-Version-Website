// Zona de visita técnica gratuita: os 10 concelhos do Alto Minho (até ~50 km de Monção).
// Fora desta zona a visita continua possível, mas a deslocação pode ter custo —
// a equipa indica-o ao cliente antes de marcar.
export const FREE_VISIT_MUNICIPALITIES = [
  "Monção",
  "Melgaço",
  "Valença",
  "Paredes de Coura",
  "Arcos de Valdevez",
  "Vila Nova de Cerveira",
  "Ponte da Barca",
  "Ponte de Lima",
  "Caminha",
  "Viana do Castelo",
];

export const OTHER_MUNICIPALITY = "Outro";

// Código postal (CP4) → concelho, para os concelhos da zona gratuita.
// Serve para preencher o concelho sozinho quando o cliente escolhe a morada.
const POSTCODE_MUNICIPALITY: Record<string, string> = {
  "4950": "Monção",
  "4960": "Melgaço",
  "4930": "Valença",
  "4940": "Paredes de Coura",
  "4970": "Arcos de Valdevez",
  "4974": "Arcos de Valdevez",
  "4920": "Vila Nova de Cerveira",
  "4980": "Ponte da Barca",
  "4990": "Ponte de Lima",
  "4910": "Caminha",
  "4900": "Viana do Castelo",
  "4925": "Viana do Castelo",
  "4935": "Viana do Castelo",
};

export const municipalityFromPostcode = (postcode: string) => POSTCODE_MUNICIPALITY[postcode.trim().slice(0, 4)] ?? "";

export const isInFreeArea = (municipality: string) => FREE_VISIT_MUNICIPALITIES.includes(municipality);
