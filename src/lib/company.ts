// Ano de fundação da Lareiras Pachinha em Monção.
// Fonte: Crunchbase (1992). Bate certo com o percurso do Marcelo Alves Inácio,
// que veio para Monção aos 25 anos (nasceu em 1968) — Jornal de Negócios, 12/05/2018.
export const FOUNDED = 1992;
export const yearsInBusiness = () => new Date().getFullYear() - FOUNDED;

// Contactos públicos. A confirmar com a Sandra (cartão de visita) — campos vazios não aparecem no site.
export const CONTACT = {
  address: ["Parque Industrial da Lagoa", "4950 Monção"],
  phone: "", // ex.: "+351 251 000 000"
  email: "info@lareiraspachinha.pt",
  maintenanceEmail: "manutencao@lareiraspachinha.pt",
  hours: "Seg–Sex 9h00–18h30 · Sáb 9h00–12h30",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Lareiras+Pachinha+Mon%C3%A7%C3%A3o",
};

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

// Dados da empresa nos documentos (folha de orçamento em PDF) — tal como na folha em papel.
export const DOCUMENT_HEADER = {
  brands: "Glamm Fire | Lareiras Pachinha",
  nif: "513 760 857",
  phones: ["(00351) 251 649 900", "(00351) 932 724 619", "(0034) 662 099 524"],
  email: "sandra.oliveira@pachinha.com",
  address: "Polo Emp. da Lagoa, Rua da Suíça 213, 4950-850 MONÇÃO",
};
