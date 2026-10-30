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

export const isInFreeArea = (municipality: string) => FREE_VISIT_MUNICIPALITIES.includes(municipality);
