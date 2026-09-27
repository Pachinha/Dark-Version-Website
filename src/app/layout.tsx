import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lareiras Pachinha — Aquecimento com quem sabe, desde 1990",
  description:
    "Lareiras, recuperadores e salamandras a lenha, gás, pellets e bioetanol — com aconselhamento técnico e instalação incluída, em Monção.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700&family=Archivo+Expanded:wght@600;700;800&family=Great+Vibes&family=Bree+Serif&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
