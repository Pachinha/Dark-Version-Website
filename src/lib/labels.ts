export const QUOTE_STATUS: Record<string, string> = {
  novo: "Pedido recebido",
  visita_marcada: "Visita marcada",
  visita_feita: "Visita feita",
  orcamento_enviado: "Orçamento enviado · aguarda confirmação",
  em_obra: "Em obra",
  recusado: "Recusado",
  cancelado: "Cancelado",
};

// Pedido de orçamento — o que o cliente procura e como é a obra
// Fotografias em /public/images/orcamento (Unsplash, licença livre — ver CREDITOS.md).
// `pos` é o enquadramento da foto dentro do cartão.
export const QUOTE_PRODUCTS: Record<string, { img: string; pos: string; desc: string }> = {
  Lareiras: { img: "/images/orcamento/lareira.jpg", pos: "50% 50%", desc: "Lareira nova, de raiz ou por medida." },
  Recuperadores: { img: "/images/orcamento/recuperador.jpg", pos: "50% 45%", desc: "Para instalar numa lareira existente." },
  Salamandras: { img: "/images/orcamento/salamandra.jpg", pos: "50% 60%", desc: "Independente, a lenha ou pellets." },
  "Fogões": { img: "/images/orcamento/fogao.jpg", pos: "50% 70%", desc: "Fogão de cozinha a lenha." },
  Churrasqueiras: { img: "/images/orcamento/churrasqueira.jpg", pos: "50% 55%", desc: "Churrasqueira de exterior, em alvenaria." },
  Aconselhamento: { img: "/images/orcamento/aconselhamento.jpg", pos: "50% 40%", desc: "Ainda não sabe? Ajudamos a escolher." },
};

export const WORK_TYPE: Record<string, string> = {
  nova: "Instalação nova",
  substituir: "Substituir equipamento antigo",
  converter: "Converter lareira aberta",
  nao_sei: "Ainda não sei",
};

export const HOME_TYPE: Record<string, string> = {
  moradia: "Moradia",
  apartamento: "Apartamento",
  outro: "Outro (loja, restaurante…)",
};

export const CHIMNEY: Record<string, string> = {
  sim: "Sim",
  nao: "Não",
  nao_sei: "Não sei",
};

export const FUEL: Record<string, string> = {
  lenha: "Lenha",
  pellets: "Pellets",
  gas: "Gás",
  eletrico: "Elétrico",
  bioetanol: "Bioetanol",
  aconselhar: "Aconselhem-me",
};

export const MAINTENANCE_STATUS: Record<string, string> = {
  pendente: "Pedido recebido",
  agendado: "Agendado",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const MAINTENANCE_SERVICE: Record<string, string> = {
  manutencao: "Manutenção anual",
  limpeza: "Limpeza de chaminé",
  assistencia: "Assistência técnica",
};

// Preferências de horário do cliente (o secretariado é que marca a visita)
export const WEEKDAYS: Record<string, string> = {
  seg: "Segunda",
  ter: "Terça",
  qua: "Quarta",
  qui: "Quinta",
  sex: "Sexta",
};

export const PERIODS: Record<string, { label: string; hours: string }> = {
  manha: { label: "Manhã", hours: "9h–13h" },
  tarde: { label: "Tarde", hours: "14h–18h30" },
};

export const AVAILABILITY_SLOTS = Object.keys(WEEKDAYS).flatMap((d) => Object.keys(PERIODS).map((p) => `${d}-${p}`));

export const URGENCY: Record<string, { label: string; hint: string }> = {
  flexivel: { label: "Sem pressa", hint: "Nas próximas semanas" },
  normal: { label: "Brevemente", hint: "Nos próximos dias" },
  urgente: { label: "Urgente", hint: "Equipamento parado ou avaria" },
};

export const CONTACT_PREFERENCE: Record<string, string> = {
  telefone: "Chamada telefónica",
  whatsapp: "WhatsApp",
  email: "Email",
};

// Frases da disponibilidade. Em português por defeito; o site público passa as da língua do visitante.
export type AvailabilityWords = {
  weekdays: Record<string, string>;
  periods: Record<string, string>;
  anyWeekday: string;
  anyDayIn: string; // "Qualquer dia, de {period}"
  allDay: string; // "{day} (todo o dia)"
  dayIn: string; // "{day} de {period}"
};

const PT_AVAILABILITY: AvailabilityWords = {
  weekdays: WEEKDAYS,
  periods: Object.fromEntries(Object.entries(PERIODS).map(([k, v]) => [k, v.label])),
  anyWeekday: "Qualquer dia útil",
  anyDayIn: "Qualquer dia, de {period}",
  allDay: "{day} (todo o dia)",
  dayIn: "{day} de {period}",
};

const fill = (text: string, vars: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

// {seg-manha, seg-tarde, qua-manha} → "Segunda (todo o dia) · Quarta de manhã"
export function describeAvailability(slots: string[] | null | undefined, words: AvailabilityWords = PT_AVAILABILITY) {
  if (!slots?.length || slots.length === AVAILABILITY_SLOTS.length) return words.anyWeekday;
  const periods = Object.keys(PERIODS);
  const allDaysFor = periods.find((p) => Object.keys(WEEKDAYS).every((d) => slots.includes(`${d}-${p}`)));
  if (allDaysFor && slots.length === Object.keys(WEEKDAYS).length) {
    return fill(words.anyDayIn, { period: words.periods[allDaysFor].toLowerCase() });
  }
  return Object.keys(WEEKDAYS)
    .map((d) => {
      const chosen = periods.filter((p) => slots.includes(`${d}-${p}`));
      if (!chosen.length) return null;
      const day = words.weekdays[d];
      return chosen.length === periods.length ? fill(words.allDay, { day }) : fill(words.dayIn, { day, period: words.periods[chosen[0]].toLowerCase() });
    })
    .filter(Boolean)
    .join(" · ");
}

export const ORDER_STATUS: Record<string, string> = {
  encomendado: "Encomendado",
  instalado: "Instalado",
  concluido: "Concluído",
};

export const JOB_STATUS: Record<string, string> = {
  por_agendar: "Por agendar",
  agendado: "Agendada",
  em_curso: "Em curso",
  concluido: "Concluída",
  cancelado: "Cancelada",
};

export const JOB_NOTE_KIND: Record<string, string> = {
  material: "Material adicionado",
  alteracao: "Alteração ao trabalho",
  nota: "Nota",
};

export const ROLE_LABEL: Record<string, string> = {
  client: "Cliente",
  colaborador: "Colaborador (só consulta)",
  tecnico: "Técnico",
  admin: "Administrador",
};

export function formatDate(value: string | null | undefined, withTime = false, localeTag = "pt-PT") {
  if (!value) return "—";
  return new Date(value).toLocaleString(localeTag, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Europe/Lisbon",
  });
}

export const TZ = "Europe/Lisbon";

// "2026-11-03" for a timestamp, in Lisbon time
export function lisbonDay(value: string | Date) {
  return new Date(value).toLocaleDateString("sv-SE", { timeZone: TZ });
}

export function formatTime(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

// ISO → value for <input type="datetime-local"> in Lisbon time
export function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("sv-SE", { timeZone: TZ }).slice(0, 16).replace(" ", "T");
}

// "2026-11-03T14:30" (Lisbon wall-clock) → ISO string with the right UTC offset
export function fromLocalInput(local: string) {
  if (!local) return null;
  const asUtc = new Date(`${local}:00Z`);
  const lisbon = new Date(asUtc.toLocaleString("en-US", { timeZone: TZ }));
  const utc = new Date(asUtc.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(asUtc.getTime() - (lisbon.getTime() - utc.getTime())).toISOString();
}

// Supabase types embedded rows loosely (object or array); normalise to one object.
export function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

// 42 → "PCH-00042"
export const quoteRef = (ref: number | null | undefined) => (ref ? `PCH-${String(ref).padStart(5, "0")}` : "—");
