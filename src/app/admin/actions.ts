"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabaseServer } from "@/lib/supabase-server";

export async function signIn(formData: FormData) {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(8).max(200) }).safeParse({
    email: formData.get("email"), password: formData.get("password"),
  });
  if (!parsed.success) redirect("/admin/login?e=invalid");
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword(parsed.data);
  if (error) redirect("/admin/login?e=invalid"); // same message for every failure
  redirect("/admin");
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect("/admin/login");
}

const statusSchema = z.object({ id: z.string().uuid(), status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]) });
export async function setAppointmentStatus(formData: FormData) {
  await requireAdmin();
  const p = statusSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!p.success) return;
  await supabaseAdmin().from("appointments").update({ status: p.data.status, change_request: null, change_request_note: null }).eq("id", p.data.id);
  revalidatePath("/admin");
}

const rescheduleSchema = z.object({ id: z.string().uuid(), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/) });
export async function rescheduleAppointment(formData: FormData) {
  await requireAdmin();
  const p = rescheduleSchema.safeParse({ id: formData.get("id"), date: formData.get("date"), time: formData.get("time") });
  if (!p.success) return;
  const db = supabaseAdmin();
  const { data: a } = await db.from("appointments").select("service_id").eq("id", p.data.id).single();
  const { data: s } = await db.from("services").select("duration_minutes").eq("id", a?.service_id).single();
  if (!s) return;
  const [h, m] = p.data.time.split(":").map(Number);
  const end = h * 60 + m + s.duration_minutes;
  const endT = `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
  // Unique index rejects an overlapping live slot; errors are swallowed to keep the page stable.
  await db.from("appointments").update({ appointment_date: p.data.date, start_time: p.data.time, end_time: endT, change_request: null, change_request_note: null }).eq("id", p.data.id);
  revalidatePath("/admin");
}

const serviceSchema = z.object({
  id: z.string().uuid(),
  price_from: z.string().optional(), price_to: z.string().optional(),
  duration_minutes: z.coerce.number().int().min(10).max(240),
  price_note: z.string().max(200).optional(),
  is_active: z.string().optional(),
});
export async function updateService(formData: FormData) {
  await requireAdmin();
  const p = serviceSchema.safeParse(Object.fromEntries(formData));
  if (!p.success) return;
  const num = (v?: string) => (v && v.trim() !== "" && !Number.isNaN(Number(v)) && Number(v) >= 0 ? Number(v) : null);
  await supabaseAdmin().from("services").update({
    price_from: num(p.data.price_from), price_to: num(p.data.price_to),
    duration_minutes: p.data.duration_minutes, price_note: p.data.price_note || null,
    is_active: p.data.is_active === "on",
  }).eq("id", p.data.id);
  revalidatePath("/admin"); revalidatePath("/services");
}

const hoursSchema = z.object({
  weekday: z.coerce.number().int().min(0).max(6),
  open_time: z.string().regex(/^\d{2}:\d{2}/), close_time: z.string().regex(/^\d{2}:\d{2}/),
  lunch_start: z.string().optional(), lunch_end: z.string().optional(), is_open: z.string().optional(),
});
export async function updateHours(formData: FormData) {
  await requireAdmin();
  const p = hoursSchema.safeParse(Object.fromEntries(formData));
  if (!p.success || p.data.open_time >= p.data.close_time) return;
  await supabaseAdmin().from("opening_hours").update({
    is_open: p.data.is_open === "on", open_time: p.data.open_time, close_time: p.data.close_time,
    lunch_start: p.data.lunch_start || null, lunch_end: p.data.lunch_end || null,
  }).eq("weekday", p.data.weekday);
  revalidatePath("/admin"); revalidatePath("/contact");
}
