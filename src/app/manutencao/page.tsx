import Navbar from "@/components/Navbar";
import AnimateIn from "@/components/AnimateIn";
import Footer from "@/components/Footer";

export const metadata = { title: "Manutenção & Limpeza — Lareiras Pachinha" };

const services = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e2a276" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
    title: "Manutenção anual",
    desc: "Revisão completa do equipamento, verificação de vedações, regulação da tiragem e lubrificação de componentes móveis.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e2a276" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    title: "Limpeza de chaminé",
    desc: "Desobstrução e limpeza profunda da chaminé e condutas. Emissão de certificado de conformidade.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e2a276" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/>
      </svg>
    ),
    title: "Assistência técnica",
    desc: "Diagnóstico e reparação de avarias em lareiras a gás, recuperadores a lenha e salamandras a pellets.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e2a276" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: "Contrato de manutenção",
    desc: "Plano anual com visitas programadas, prioridade no agendamento e desconto em peças e mão-de-obra.",
  },
];

export default function ManutencaoPage() {
  return (
    <>
      {/* Hero */}
      <div style={{ position: "relative", height: "50svh" }}>
        <section style={{ height: "50svh", position: "relative", overflow: "hidden", background: "#1a1108" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 60%, rgba(191,91,45,0.18) 0%, transparent 65%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: "52px", maxWidth: "560px", zIndex: 1 }}>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: "#e2a276", display: "block", marginBottom: "12px" }}>
              Área de cliente
            </span>
            <h1 style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "44px", lineHeight: 1.08, fontWeight: 700, margin: "0 0 16px", color: "#f2ece2" }}>
              Manutenção & Limpeza
            </h1>
            <p style={{ fontSize: "14.5px", lineHeight: 1.65, color: "rgba(242,236,226,0.60)", margin: 0 }}>
              Já instalou connosco? Mantenha o seu equipamento em perfeito estado. Equipa própria, resposta rápida.
            </p>
          </div>
        </section>
        <Navbar />
      </div>

      <main style={{ background: "#1a1108" }}>
        {/* Serviços */}
        <section style={{ padding: "72px 52px 0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "18px" }}>
            {services.map((s, i) => (
              <AnimateIn key={s.title} delay={i * 80}>
                <div
                  className="card-hover"
                  style={{ background: "#2a1a0c", borderRadius: "16px", padding: "32px", display: "flex", gap: "20px", alignItems: "flex-start" }}
                >
                  <div style={{ flexShrink: 0, marginTop: "2px" }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 600, color: "#f2ece2", marginBottom: "8px" }}>{s.title}</div>
                    <p style={{ fontSize: "13.5px", lineHeight: 1.65, color: "rgba(242,236,226,0.55)", margin: 0 }}>{s.desc}</p>
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </section>

        {/* Formulário de agendamento */}
        <section style={{ padding: "72px 52px 80px" }}>
          <AnimateIn>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", background: "#262019", borderRadius: "20px", padding: "56px 52px", alignItems: "start" }}>

              {/* Texto */}
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase", color: "#e2a276", display: "block", marginBottom: "12px" }}>
                  Agendamento
                </span>
                <h2 style={{ fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif", fontSize: "30px", fontWeight: 700, color: "#f2ece2", margin: "0 0 16px", lineHeight: 1.15 }}>
                  Marque a sua visita
                </h2>
                <p style={{ fontSize: "14px", lineHeight: 1.65, color: "rgba(242,236,226,0.55)", margin: "0 0 32px" }}>
                  Preencha o formulário e entraremos em contacto nas próximas 24 horas para confirmar data e hora.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {[
                    { icon: "📞", text: "+351 251 652 XXX" },
                    { icon: "✉️", text: "manutencao@lareiraspachinha.pt" },
                    { icon: "🕐", text: "Seg–Sex 9h00–18h30" },
                  ].map((item) => (
                    <div key={item.text} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <span style={{ fontSize: "14px" }}>{item.icon}</span>
                      <span style={{ fontSize: "13.5px", color: "rgba(242,236,226,0.70)" }}>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form */}
              <form style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  { label: "Nome completo", type: "text", placeholder: "João Silva" },
                  { label: "Telefone", type: "tel", placeholder: "+351 9XX XXX XXX" },
                  { label: "Email", type: "email", placeholder: "joao@email.com" },
                ].map((field) => (
                  <div key={field.label} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(242,236,226,0.45)" }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      style={{
                        background: "rgba(242,236,226,0.06)",
                        border: "1px solid rgba(242,236,226,0.12)",
                        borderRadius: "10px",
                        padding: "12px 14px",
                        fontSize: "13.5px",
                        color: "#f2ece2",
                        outline: "none",
                        width: "100%",
                      }}
                    />
                  </div>
                ))}

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(242,236,226,0.45)" }}>
                    Tipo de serviço
                  </label>
                  <select
                    style={{
                      background: "rgba(242,236,226,0.06)",
                      border: "1px solid rgba(242,236,226,0.12)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      fontSize: "13.5px",
                      color: "#f2ece2",
                      outline: "none",
                      width: "100%",
                    }}
                  >
                    <option value="" style={{ background: "#262019" }}>Selecionar...</option>
                    <option value="manutencao" style={{ background: "#262019" }}>Manutenção anual</option>
                    <option value="limpeza" style={{ background: "#262019" }}>Limpeza de chaminé</option>
                    <option value="assistencia" style={{ background: "#262019" }}>Assistência técnica</option>
                    <option value="contrato" style={{ background: "#262019" }}>Contrato de manutenção</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11.5px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(242,236,226,0.45)" }}>
                    Observações (opcional)
                  </label>
                  <textarea
                    placeholder="Descreva o equipamento e o problema se houver..."
                    rows={3}
                    style={{
                      background: "rgba(242,236,226,0.06)",
                      border: "1px solid rgba(242,236,226,0.12)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      fontSize: "13.5px",
                      color: "#f2ece2",
                      outline: "none",
                      width: "100%",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    background: "#bf5b2d",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: 600,
                    padding: "14px 24px",
                    borderRadius: "999px",
                    border: "none",
                    cursor: "pointer",
                    marginTop: "6px",
                    display: "block",
                    width: "100%",
                  }}
                >
                  Solicitar agendamento →
                </button>
              </form>
            </div>
          </AnimateIn>

          <AnimateIn style={{ marginTop: "20px" }}>
            <a href="/" style={{ fontSize: "13px", fontWeight: 600, color: "#e2a276", textDecoration: "none" }}>
              ← Voltar à página inicial
            </a>
          </AnimateIn>
        </section>
      </main>

      <Footer />
    </>
  );
}
