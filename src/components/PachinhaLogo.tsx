interface PachinhaLogoProps {
  dark?: boolean;
  scale?: number;
}

export default function PachinhaLogo({ dark = false, scale = 1 }: PachinhaLogoProps) {
  const charcoal = dark ? "#ede6dc" : "#33322d";
  const flame = dark ? "#d84a2b" : "#b0260e";

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "left center",
        display: "inline-block",
        lineHeight: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          lineHeight: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "4px",
            marginBottom: "-9px",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-great-vibes), cursive",
              fontSize: "42px",
              color: charcoal,
              lineHeight: 0.9,
            }}
          >
            Lareiras
          </span>
          <span
            style={{
              position: "relative",
              width: "16px",
              height: "20px",
              flexShrink: 0,
              marginTop: "0px",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: "4px",
                bottom: "4px",
                width: "12px",
                height: "12px",
                background: flame,
                borderRadius: "0 50% 50% 50%",
                transform: "rotate(45deg)",
              }}
            />
            <span
              style={{
                position: "absolute",
                left: "-1px",
                bottom: "3px",
                width: "7px",
                height: "7px",
                background: flame,
                borderRadius: "0 50% 50% 50%",
                transform: "rotate(90deg)",
              }}
            />
          </span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-bree-serif), serif",
            fontSize: "38px",
            fontWeight: 700,
            color: charcoal,
            letterSpacing: "0.01em",
          }}
        >
          Pachinha
        </span>
      </div>
    </div>
  );
}
