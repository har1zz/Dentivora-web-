import { NextResponse } from "next/server";
import { bookingSchema } from "@/lib/validation";
import { clientIp, rateLimit, sameOrigin } from "@/lib/rate-limit";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase-admin";
import { dateLabel, timeLabel } from "@/lib/clinic";
import { sendBookingEmails } from "@/lib/email";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "BACKEND_NOT_CONFIGURED" }, { status: 503 });

  const rl = rateLimit(`book:${clientIp(req)}`, 5, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many booking attempts. Please try again shortly." }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  }
  const b = parsed.data;
  // Honeypot tripped: pretend success so bots learn nothing.
  if (b.website) return NextResponse.json({ ok: true, reference: "DV-00000000", status: "pending" });

  const db = supabaseAdmin();
  const { data: service } = await db.from("services").select("name").eq("id", b.serviceId).eq("is_active", true).single();
  if (!service) return NextResponse.json({ error: "That treatment is not available" }, { status: 400 });

  const { data, error } = await db.rpc("create_appointment", {
    p_service: b.serviceId, p_date: b.date, p_start: b.time,
    p_name: b.fullName, p_email: b.email, p_phone: b.phone, p_notes: b.notes || null, p_source: b.source,
  });

  if (error) {
    if (error.message.includes("SLOT_UNAVAILABLE"))
      return NextResponse.json({ error: "That time was just taken. Please choose another slot." }, { status: 409 });
    if (error.message.includes("DUPLICATE_BOOKING"))
      return NextResponse.json({ error: "You already have an appointment on that day. Contact the clinic to change it." }, { status: 409 });
    console.error("create_appointment failed", error.message);
    return NextResponse.json({ error: "We could not save your booking. Please try again." }, { status: 500 });
  }

  const row = (data as { reference: string; cancel_token: string }[])[0];
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const manageUrl = `${site}/booking/manage?ref=${row.reference}&token=${row.cancel_token}`;
  const mail = await sendBookingEmails({
    reference: row.reference, fullName: b.fullName, email: b.email, phone: b.phone,
    service: service.name, dateLabel: dateLabel(b.date), timeLabel: timeLabel(b.time),
    manageUrl, status: "pending",
  });

  return NextResponse.json({
    ok: true, status: "pending", reference: row.reference,
    manageUrl, service: service.name, date: b.date, time: b.time,
    emailSent: mail.sent,
  });
}
