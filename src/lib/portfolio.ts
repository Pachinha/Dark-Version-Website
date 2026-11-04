// Portfólio — obras realizadas pela Pachinha.
// Para acrescentar uma obra: guardar a foto em /public/images/obras/ e juntar uma entrada aqui.
// As entradas abaixo usam fotos provisórias (Unsplash, ver /images/orcamento/CREDITOS.md) até chegarem as fotos reais (ex.: obra do convento).
export type Project = {
  title: string;
  type: "Lareiras" | "Recuperadores" | "Salamandras" | "Fogões" | "Churrasqueiras";
  location?: string;
  equipment?: string;
  img: string;
};

// "Lareiras" → "lareiras", para ir buscar o nome do tipo traduzido.
const TYPE_SLUGS = { Lareiras: "lareiras", Recuperadores: "recuperadores", Salamandras: "salamandras", "Fogões": "fogoes", Churrasqueiras: "churrasqueiras" } as const;
export const projectTypeSlug = (type: Project["type"]) => TYPE_SLUGS[type];

export const PROJECTS: Project[] = [
  { title: "Lareira em sala de estar", type: "Lareiras", img: "/images/orcamento/lareira.jpg" },
  { title: "Recuperador a lenha em moradia", type: "Recuperadores", img: "/images/orcamento/recuperador.jpg" },
  { title: "Salamandra em casa de campo", type: "Salamandras", img: "/images/orcamento/salamandra.jpg" },
  { title: "Lareira de design", type: "Lareiras", img: "/images/hero.png" },
  { title: "Fogão de cozinha a lenha", type: "Fogões", img: "/images/orcamento/fogao.jpg" },
  { title: "Churrasqueira de exterior", type: "Churrasqueiras", img: "/images/orcamento/churrasqueira.jpg" },
];
