import "server-only";
import nodemailer from "nodemailer";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function emailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function transport() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
}

export type BookingEmail = {
  reference: string; fullName: string; email: string; phone: string;
  service: string; dateLabel: string; timeLabel: string; manageUrl: string; status: string;
};

export async function sendBookingEmails(b: BookingEmail): Promise<{ sent: boolean; reason?: string }> {
  if (!emailConfigured()) return { sent: false, reason: "EMAIL_NOT_CONFIGURED" };
  try {
    const t = transport();
    const from = `Dentivora <${process.env.GMAIL_USER}>`;
    await t.sendMail({
      from, to: b.email,
      subject: `Your Dentivora appointment request (${b.reference})`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;color:#10282f">
        <h2 style="font-weight:500">Thank you, ${esc(b.fullName)}.</h2>
        <p>We have received your appointment request. It is <strong>${esc(b.status)}</strong> until the clinic confirms it.</p>
        <p><strong>${esc(b.service)}</strong><br>${esc(b.dateLabel)} at ${esc(b.timeLabel)}<br>Reference: <strong>${esc(b.reference)}</strong></p>
        <p>Need to cancel or reschedule? <a href="${esc(b.manageUrl)}">Send us a request</a> or call the clinic.</p>
        <p style="color:#5b6b70;font-size:13px">If you have severe pain, facial swelling or uncontrolled bleeding, do not wait for this appointment. Call us or go to your nearest emergency department.</p></div>`,
    });
    await t.sendMail({
      from, to: process.env.CLINIC_NOTIFY_EMAIL || process.env.GMAIL_USER,
      subject: `New booking ${b.reference}: ${b.service}`,
      html: `<p>${esc(b.fullName)} (${esc(b.email)}, ${esc(b.phone)}) requested <strong>${esc(b.service)}</strong> on ${esc(b.dateLabel)} at ${esc(b.timeLabel)}.</p>`,
    });
    return { sent: true };
  } catch (e) {
    console.error("Email send failed", e instanceof Error ? e.message : e);
    return { sent: false, reason: "EMAIL_SEND_FAILED" };
  }
}
