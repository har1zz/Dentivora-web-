import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { contactSchema } from "@/lib/validation";
import { clientIp, rateLimit, sameOrigin } from "@/lib/rate-limit";
import { emailConfigured } from "@/lib/email";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rl = rateLimit(`contact:${clientIp(req)}`, 3, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many messages. Please try later." }, { status: 429 });

  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const p = contactSchema.safeParse(body);
  if (!p.success) return NextResponse.json({ error: "Please check your message", fields: p.error.flatten().fieldErrors }, { status: 422 });
  if (p.data.website) return NextResponse.json({ ok: true });
  if (!emailConfigured()) return NextResponse.json({ error: "EMAIL_NOT_CONFIGURED" }, { status: 503 });

  try {
    const t = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });
    await t.sendMail({
      from: `Dentivora website <${process.env.GMAIL_USER}>`,
      to: process.env.CLINIC_NOTIFY_EMAIL || process.env.GMAIL_USER,
      replyTo: p.data.email,
      subject: `Website message from ${p.data.name.replace(/[\r\n]/g, " ")}`,
      text: p.data.message,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not send your message" }, { status: 500 });
  }
}
