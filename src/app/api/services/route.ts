import { NextResponse } from "next/server";
import { getServices, formatPrice } from "@/lib/clinic";
import { isSupabaseConfigured } from "@/lib/supabase-admin";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "BACKEND_NOT_CONFIGURED" }, { status: 503 });
  try {
    const services = await getServices();
    return NextResponse.json({
      services: services.map((s) => ({ ...s, price_label: formatPrice(s) })),
    });
  } catch {
    return NextResponse.json({ error: "Could not load services" }, { status: 500 });
  }
}
