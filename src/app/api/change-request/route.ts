import { NextResponse } from "next/server";
import { changeRequestSchema } from "@/lib/validation";
import { clientIp, rateLimit, sameOrigin } from "@/lib/rate-limit";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "BACKEND_NOT_CONFIGURED" }, { status: 503 });
  const rl = rateLimit(`chg:${clientIp(req)}`, 10, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const p = changeRequestSchema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  // Reference AND secret token must both match; the reference alone grants nothing.
  const { data, error } = await supabaseAdmin().from("appointments")
    .update({ change_request: p.data.type, change_request_note: p.data.note ?? null })
    .eq("reference", p.data.reference).eq("cancel_token", p.data.token)
    .in("status", ["pending", "confirmed"]).select("reference").maybeSingle();

  if (error) return NextResponse.json({ error: "Could not record your request" }, { status: 500 });
  if (!data) return NextResponse.json({ error: "We could not find that booking" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
