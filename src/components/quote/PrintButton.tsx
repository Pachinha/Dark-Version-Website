"use client";

export default function PrintButton() {
  return (
    <button type="button" className="btn btn-ink btn-sm" onClick={() => window.print()}>
      Imprimir / guardar PDF
    </button>
  );
}
