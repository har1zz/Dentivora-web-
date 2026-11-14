import "server-only";
import { isSupabaseConfigured, supabaseAdmin } from "./supabase-admin";
import { formatPrice } from "./clinic";

export type Service = {
  id: string; slug: string; name: string; summary: string; description: string;
  who_its_for: string | null; what_to_expect: string | null; duration_minutes: number;
  price_label: string;
};
export type Dentist = { id: string; name: string; title: string; qualifications: string | null; years_experience: number | null; specializations: string[]; bio: string | null; photo_url: string | null };
export type Faq = { id: string; question: string; answer: string; category: string };

// Shown only while the database is not connected. No prices, no invented facts.
const FALLBACK: Service[] = [
  ["general-consultation", "General consultation", "A thorough check-up and a clear plan."],
  ["dental-cleaning", "Dental cleaning", "Professional scaling and polishing."],
  ["teeth-whitening", "Teeth whitening", "Supervised whitening for a brighter shade."],
  ["dental-fillings", "Dental fillings", "Tooth-coloured restorations."],
  ["root-canal", "Root canal treatment", "Saving a tooth with an infected nerve."],
  ["dental-implants", "Dental implants", "Replacement for a missing tooth."],
  ["braces-orthodontics", "Braces and orthodontics", "Straightening teeth and correcting the bite."],
  ["clear-aligners", "Clear aligners", "Removable, near-invisible aligners."],
  ["veneers", "Veneers", "Thin shells to reshape the front of a tooth."],
  ["tooth-extraction", "Tooth extraction", "Removal of a tooth when it cannot be saved."],
  ["gum-treatment", "Gum treatment", "Care for sore or bleeding gums."],
  ["pediatric-dentistry", "Pediatric dentistry", "Friendly, gentle care for children."],
].map(([slug, name, summary]) => ({
  id: "", slug, name, summary, description: summary, who_its_for: null, what_to_expect: null,
  duration_minutes: 0, price_label: "Price confirmed by the clinic",
}));

export async function loadServices(): Promise<{ services: Service[]; live: boolean }> {
  if (!isSupabaseConfigured()) return { services: FALLBACK, live: false };
  try {
    const { data, error } = await supabaseAdmin().from("services").select("*").eq("is_active", true).order("sort_order");
    if (error || !data?.length) return { services: FALLBACK, live: false };
    return { live: true, services: data.map((s) => ({ ...s, price_label: formatPrice(s) })) };
  } catch {
    return { services: FALLBACK, live: false };
  }
}

export async function loadDentists(): Promise<Dentist[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data } = await supabaseAdmin().from("dentists").select("*").eq("is_active", true).order("sort_order");
    return (data ?? []) as Dentist[];
  } catch { return []; }
}

export async function loadFaqs(): Promise<Faq[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data } = await supabaseAdmin().from("faqs").select("*").eq("is_active", true).order("sort_order");
    return (data ?? []) as Faq[];
  } catch { return []; }
}

export async function loadHours() {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data } = await supabaseAdmin().from("opening_hours").select("*").order("weekday");
    return data ?? [];
  } catch { return []; }
}
