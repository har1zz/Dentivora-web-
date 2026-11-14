import { requireAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { rescheduleAppointment, setAppointmentStatus, signOut, updateHours, updateService } from "./actions";

export const dynamic = "force-dynamic";
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const inp = "rounded-lg border border-line bg-paper px-3 py-2 text-sm";
const btn = "rounded-full border border-ink/30 px-3.5 py-1.5 text-sm hover:border-teal hover:text-teal";

export default async function Admin({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { role } = await requireAdmin();
  const { tab = "appointments" } = await searchParams;
  const db = supabaseAdmin();
  const tabs = [["appointments", "Appointments"], ["services", "Treatments and prices"], ["hours", "Opening hours"]];

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl">Dentivora staff</h1>
        <form action={signOut}><button className={btn}>Sign out ({role})</button></form>
      </header>
      <nav aria-label="Admin sections" className="mt-8 flex gap-2 border-b border-line">
        {tabs.map(([k, l]) => (
          <a key={k} href={`/admin?tab=${k}`} aria-current={tab === k ? "page" : undefined} className="border-b-2 border-transparent px-4 py-3 aria-[current=page]:border-teal aria-[current=page]:text-teal">{l}</a>
        ))}
      </nav>

      {tab === "appointments" && <Appointments />}
      {tab === "services" && <Services />}
      {tab === "hours" && <Hours />}
    </div>
  );

  async function Appointments() {
    const { data } = await db.from("appointments").select("*, services(name)").order("appointment_date").order("start_time").limit(200);
    const rows = data ?? [];
    return (
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead><tr className="border-b border-line text-ink/60"><th className="py-2">Reference</th><th>Patient</th><th>Treatment</th><th>When</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="py-8 text-ink/60">No appointments yet.</td></tr>}
            {rows.map((a) => (
              <tr key={a.id} className="border-b border-line align-top">
                <td className="py-3 font-medium">{a.reference}</td>
                <td>{a.full_name}<br /><span className="text-ink/60">{a.email}<br />{a.phone}</span></td>
                <td>{a.services?.name}</td>
                <td>{a.appointment_date}<br />{String(a.start_time).slice(0, 5)}</td>
                <td>{a.status}{a.change_request && <span className="mt-1 block rounded bg-enamel px-2 py-0.5 text-xs">Patient asked to {a.change_request}{a.change_request_note ? `: ${a.change_request_note}` : ""}</span>}</td>
                <td>
                  <div className="flex flex-wrap gap-2">
                    {(["confirmed", "cancelled", "completed", "no_show"] as const).map((s) => (
                      <form key={s} action={setAppointmentStatus}><input type="hidden" name="id" value={a.id} /><input type="hidden" name="status" value={s} /><button className={btn}>{s.replace("_", " ")}</button></form>
                    ))}
                  </div>
                  <form action={rescheduleAppointment} className="mt-2 flex flex-wrap gap-2">
                    <input type="hidden" name="id" value={a.id} />
                    <input aria-label="New date" type="date" name="date" required className={inp} />
                    <input aria-label="New time" type="time" name="time" required className={inp} />
                    <button className={btn}>Reschedule</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  async function Services() {
    const { data } = await db.from("services").select("*").order("sort_order");
    return (
      <div className="mt-8 space-y-4">
        <p className="text-ink/70">Leave both prices empty if the clinic must confirm the price after an examination. The chatbot and website will say so.</p>
        {(data ?? []).map((s) => (
          <form key={s.id} action={updateService} className="grid items-end gap-3 rounded-2xl border border-line p-4 md:grid-cols-[1.4fr_repeat(3,1fr)_1.6fr_auto_auto]">
            <input type="hidden" name="id" value={s.id} />
            <p className="display text-xl">{s.name}</p>
            <label className="text-xs text-ink/60">From ({s.currency})<input name="price_from" defaultValue={s.price_from ?? ""} inputMode="decimal" className={`${inp} mt-1 w-full`} /></label>
            <label className="text-xs text-ink/60">To<input name="price_to" defaultValue={s.price_to ?? ""} inputMode="decimal" className={`${inp} mt-1 w-full`} /></label>
            <label className="text-xs text-ink/60">Minutes<input name="duration_minutes" type="number" min={10} max={240} defaultValue={s.duration_minutes} className={`${inp} mt-1 w-full`} /></label>
            <label className="text-xs text-ink/60">Price note<input name="price_note" defaultValue={s.price_note ?? ""} maxLength={200} className={`${inp} mt-1 w-full`} /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={s.is_active} className="size-4 accent-teal" />Active</label>
            <button className={btn}>Save</button>
          </form>
        ))}
      </div>
    );
  }

  async function Hours() {
    const { data } = await db.from("opening_hours").select("*").order("weekday");
    return (
      <div className="mt-8 space-y-3">
        {(data ?? []).map((h) => (
          <form key={h.weekday} action={updateHours} className="flex flex-wrap items-end gap-3 rounded-2xl border border-line p-4">
            <input type="hidden" name="weekday" value={h.weekday} />
            <p className="display w-28 text-xl">{days[h.weekday]}</p>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_open" defaultChecked={h.is_open} className="size-4 accent-teal" />Open</label>
            <label className="text-xs text-ink/60">Opens<input type="time" name="open_time" defaultValue={String(h.open_time).slice(0, 5)} className={`${inp} mt-1 block`} /></label>
            <label className="text-xs text-ink/60">Closes<input type="time" name="close_time" defaultValue={String(h.close_time).slice(0, 5)} className={`${inp} mt-1 block`} /></label>
            <label className="text-xs text-ink/60">Break from<input type="time" name="lunch_start" defaultValue={h.lunch_start ? String(h.lunch_start).slice(0, 5) : ""} className={`${inp} mt-1 block`} /></label>
            <label className="text-xs text-ink/60">Break to<input type="time" name="lunch_end" defaultValue={h.lunch_end ? String(h.lunch_end).slice(0, 5) : ""} className={`${inp} mt-1 block`} /></label>
            <button className={btn}>Save</button>
          </form>
        ))}
      </div>
    );
  }
}
