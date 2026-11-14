import "server-only";
import { supabaseAdmin } from "./supabase-admin";

export async function getServices() {
  const { data, error } = await supabaseAdmin()
    .from("services").select("*").eq("is_active", true).order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export function formatPrice(s: { price_from: number | null; price_to: number | null; currency: string; price_note: string | null }) {
  if (s.price_from == null) return "Price confirmed by the clinic after an examination";
  const f = (n: number) => `${s.currency} ${Number(n).toLocaleString("en-US")}`;
  const range = s.price_to && s.price_to !== s.price_from ? `${f(s.price_from)} to ${f(s.price_to)}` : f(s.price_from);
  return s.price_note ? `${range} (${s.price_note})` : range;
}

export function timeLabel(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${ap}`;
}

export function dateLabel(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}

export async function getSlots(serviceId: string, date: string) {
  const { data, error } = await supabaseAdmin().rpc("available_slots", { p_date: date, p_service: serviceId });
  if (error) throw error;
  return ((data ?? []) as { slot_start: string }[]).map((r) => r.slot_start.slice(0, 5));
}
