import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

// RGPD art. 15.º e 20.º — direito de acesso e portabilidade.
export async function GET() {
  const current = await getCurrentUser();
  if (!current) return new NextResponse("Unauthorized", { status: 401 });

  const { user, profile } = current;
  const supabase = await createClient();
  const [addresses, quotes, maintenance, orders, consents] = await Promise.all([
    supabase.from("addresses").select("*").eq("user_id", user.id),
    supabase.from("quote_requests").select("*").eq("user_id", user.id),
    supabase.from("maintenance_requests").select("*").eq("user_id", user.id),
    supabase.from("orders").select("*").eq("user_id", user.id),
    supabase.from("consent_events").select("*").eq("user_id", user.id),
  ]);

  const data = {
    exported_at: new Date().toISOString(),
    account: { email: user.email, created_at: user.created_at, last_sign_in_at: user.last_sign_in_at },
    profile,
    addresses: addresses.data,
    quote_requests: quotes.data,
    maintenance_requests: maintenance.data,
    orders: orders.data,
    consent_history: consents.data,
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="pachinha-os-meus-dados.json"`,
      "Cache-Control": "no-store",
    },
  });
}
