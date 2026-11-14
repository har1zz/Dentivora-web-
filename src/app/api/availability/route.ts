import { NextResponse } from "next/server";
import { slotsQuerySchema } from "@/lib/validation";
import { getSlots } from "@/lib/clinic";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase-admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "BACKEND_NOT_CONFIGURED" }, { status: 503 });
  const rl = rateLimit(`avail:${clientIp(req)}`, 60, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });

  const url = new URL(req.url);
  const serviceId = url.searchParams.get("serviceId") ?? "";
  const date = url.searchParams.get("date");

  try {
    if (date) {
      const parsed = slotsQuerySchema.safeParse({ serviceId, date });
      if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      return NextResponse.json({ date, slots: await getSlots(serviceId, date) });
    }
    // No date: return which of the next 28 days have openings.
    if (!slotsQuerySchema.shape.serviceId.safeParse(serviceId).success)
      return NextResponse.json({ error: "Invalid service" }, { status: 400 });
    const { data: settings } = await supabaseAdmin().from("clinic_settings").select("max_days_ahead").eq("id", 1).single();
    const horizon = Math.min(settings?.max_days_ahead ?? 60, 28);
    const days: string[] = [];
    for (let i = 0; i < horizon; i++) {
      const d = new Date(Date.now() + 5 * 3600_000 + i * 86400_000); // Karachi calendar day
      days.push(d.toISOString().slice(0, 10));
    }
    const results = await Promise.all(days.map(async (d) => ({ d, n: (await getSlots(serviceId, d)).length })));
    return NextResponse.json({ dates: results.filter((r) => r.n > 0).map((r) => r.d) });
  } catch {
    return NextResponse.json({ error: "Could not check availability" }, { status: 500 });
  }
}
