import AnimateIn from "./AnimateIn";

const steps = [
  { num: "01", title: "Fale connosco",   body: "Online, por telefone ou no show-room. Diga-nos o espaço que quer aquecer." },
  { num: "02", title: "Visita técnica",  body: "Avaliamos a instalação existente e propomos a solução certa." },
  { num: "03", title: "Orçamento claro", body: "Equipamento, tubagem e mão-de-obra, sem surpresas." },
  { num: "04", title: "Instalação",      body: "Equipa própria, obra limpa e equipamento a funcionar." },
];

export default function ProcessBand() {
  return (
    <section style={{ background: "#1a1108", padding: "0 52px 80px" }}>
      <div style={{ background: "#262019", color: "#f2ece2", borderRadius: "20px", padding: "56px 52px" }}>
        <AnimateIn style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "48px" }}>
          <h2 style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "30px", fontWeight: 700, margin: 0, color: "#f2ece2" }}>
            Do orçamento à chama
          </h2>
          <a href="#" style={{ fontSize: "13px", fontWeight: 600, color: "#e2a276", textDecoration: "none" }}>
            Pedir orçamento →
          </a>
        </AnimateIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "32px" }}>
          {steps.map((step, i) => (
            <AnimateIn key={step.num} delay={i * 100}>
              <div style={{ borderTop: "1px solid rgba(226,162,118,0.25)", paddingTop: "24px" }}>
                <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: "12px", color: "#e2a276", marginBottom: "14px", letterSpacing: "0.05em" }}>
                  {step.num}
                </div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#f2ece2", marginBottom: "10px" }}>
                  {step.title}
                </div>
                <div style={{ fontSize: "13px", lineHeight: 1.6, color: "rgba(242,236,226,0.55)" }}>
                  {step.body}
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
