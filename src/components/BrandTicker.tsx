import { MULTI_BRANDS } from "@/lib/brands";

function BrandItem({ name }: { name: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "0 34px", flexShrink: 0 }}>
      <span
        style={{
          fontFamily: "var(--font-archivo-expanded), system-ui, sans-serif",
          fontSize: "15px",
          fontWeight: 700,
          letterSpacing: "0.02em",
          color: "rgba(255,255,255,0.72)",
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </span>
    </div>
  );
}

export default function BrandTicker() {
  return (
    // Faixa "Multimarcas" no rodapé de todas as páginas (pedido da Sandra, 28/10/2026).
    <div className="ticker-band" aria-label="Marcas com que trabalhamos">
      {/* Etiqueta fixa à esquerda */}
      <span
        style={{
          position: "relative",
          zIndex: 3,
          flexShrink: 0,
          padding: "0 22px 0 clamp(16px, 4vw, 52px)",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#e2a276",
          background: "linear-gradient(to right, #1f150b 75%, transparent 100%)",
          alignSelf: "stretch",
          display: "flex",
          alignItems: "center",
        }}
      >
        Multimarcas
      </span>

      <div style={{ position: "relative", overflow: "hidden", flex: 1 }}>
        {/* Fade edges */}
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "60px", zIndex: 2, background: "linear-gradient(to right, #1f150b 0%, transparent 100%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "80px", zIndex: 2, background: "linear-gradient(to left, #1f150b 0%, transparent 100%)", pointerEvents: "none" }} />

        {/*
          Two identical sets side-by-side, each animating translateX(-100%) of its own width.
          Set1 slides from [0,W] to [-W,0] and resets off-screen.
          Set2 starts at [W,2W] and slides into [0,W] exactly as Set1 exits.
          The reset of each set is always off-screen → zero visible jump.
        */}
        <div style={{ display: "flex" }}>
          <div className="ticker-set">
            {MULTI_BRANDS.map((name) => <BrandItem key={name} name={name} />)}
          </div>
          <div className="ticker-set" aria-hidden="true">
            {MULTI_BRANDS.map((name) => <BrandItem key={name} name={name} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
