// Portfólio — obras realizadas pela Pachinha.
// Para acrescentar uma obra: guardar a foto em /public/images/obras/ e juntar uma entrada aqui.
// As entradas abaixo usam fotos provisórias até chegarem as fotos reais (ex.: obra do convento).
export type Project = {
  title: string;
  type: "Lareiras" | "Recuperadores" | "Salamandras" | "Fogões" | "Churrasqueiras";
  location?: string;
  equipment?: string;
  img: string;
};

export const PROJECTS: Project[] = [
  { title: "Lareira em sala de estar", type: "Lareiras", img: "/images/lareira.jpg" },
  { title: "Recuperador a lenha em moradia", type: "Recuperadores", img: "/images/recuperador.jpg" },
  { title: "Salamandra em casa de campo", type: "Salamandras", img: "/images/salamandra.jpg" },
  { title: "Lareira de design", type: "Lareiras", img: "/images/hero.png" },
  { title: "Fogão de cozinha a lenha", type: "Fogões", img: "/images/fogao.jpg" },
  { title: "Churrasqueira de exterior", type: "Churrasqueiras", img: "/images/churrasqueira.jpg" },
];
