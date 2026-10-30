import { notFound } from "next/navigation";
import { PANEL_SLUG } from "@/lib/panel";

export const metadata = { title: "Lareiras Pachinha", robots: { index: false, follow: false } };

// Catches every unknown top-level address; only the secret one is the panel.
export default async function PanelGate({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ painel: string }>;
}) {
  const { painel } = await params;
  if (!PANEL_SLUG || painel !== PANEL_SLUG) notFound();
  return children;
}
