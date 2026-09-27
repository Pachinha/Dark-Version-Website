"use client";
import { useState } from "react";

const navLinks = [
  { label: "Lareiras",       href: "/lareiras" },
  { label: "Recuperadores",  href: "/recuperadores" },
  { label: "Salamandras",    href: "/salamandras" },
  { label: "Fogões",         href: "/fogoes" },
  { label: "Churrasqueiras", href: "/churrasqueiras" },
];
const languages = ["PT", "ES", "FR", "EN"];

export default function Navbar() {
  const [activeLang, setActiveLang] = useState("PT");

  return (
    <nav
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        background: "transparent",
        padding: "20px 52px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        zIndex: 10,
      }}
    >
      <a href="/" style={{ display: "block", lineHeight: 0 }}>
        <img
          src="/images/logo.png"
          alt="Lareiras Pachinha"
          style={{
            height: "80px",
            width: "auto",
            display: "block",
            filter: "brightness(0) invert(1)",
          }}
        />
      </a>

      <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
        {navLinks.map((link) => (
          <a key={link.label} href={link.href} className="nav-link-hero">
            {link.label}
          </a>
        ))}
        <a href="/outlet" className="nav-link-hero-outlet">
          Outlet
        </a>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: "1px solid rgba(255,255,255,0.30)",
            borderRadius: "999px",
            padding: "3px",
            gap: "2px",
          }}
        >
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => setActiveLang(lang)}
              className={`lang-pill${activeLang === lang ? " lang-pill-active" : ""}`}
            >
              {lang}
            </button>
          ))}
        </div>

        <a
          href="#orcamento"
          className="btn-primary"
          style={{
            background: "#bf5b2d",
            color: "#fff",
            fontSize: "13.5px",
            fontWeight: 600,
            padding: "11px 20px",
            borderRadius: "999px",
            textDecoration: "none",
            whiteSpace: "nowrap",
            display: "inline-block",
          }}
        >
          Pedir Orçamento
        </a>
      </div>
    </nav>
  );
}
