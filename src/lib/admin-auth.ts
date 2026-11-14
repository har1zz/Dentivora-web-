import "server-only";
import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase-server";
import { supabaseAdmin } from "./supabase-admin";

/** Throws a redirect unless the caller is a signed-in user listed in admin_users. */
export async function requireAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) redirect("/admin/login?e=config");
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser(); // validated against Supabase, not just the cookie
  if (!data.user) redirect("/admin/login");
  const { data: role } = await supabaseAdmin().from("admin_users").select("role").eq("user_id", data.user.id).maybeSingle();
  if (!role) redirect("/admin/login?e=denied");
  return { user: data.user, role: role.role as "owner" | "admin" | "staff" };
}
