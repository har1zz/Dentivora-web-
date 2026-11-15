"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Svc = { id: string; name: string; duration_minutes: number; price_label: string };
type Result = { reference: string; manageUrl: string; service: string; date: string; time: string; emailSent: boolean };

const fmtDate = (iso: string, long = false) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", long ? { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" } : { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const fmtTime = (t: string) => { const [h, m] = t.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };

const field = "mt-1.5 w-full rounded-xl border border-line bg-paper px-4 py-3 text-base outline-none transition focus:border-teal focus:ring-2 focus:ring-seaglass";

export function BookingFlow({ services, initialServiceId }: { services: Svc[]; initialServiceId?: string }) {
  const [serviceId, setServiceId] = useState(services.find((s) => s.id === initialServiceId)?.id ?? "");
  const [dates, setDates] = useState<string[] | null>(null);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [time, setTime] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", notes: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [step, setStep] = useState<"pick" | "details" | "confirm" | "done">("pick");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const submitted = useRef(false); // blocks double-clicks / duplicate submissions
  const service = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId]);

  const chooseService = (id: string) => { setServiceId(id); setDates(null); setDate(""); setSlots(null); setTime(""); };
  const chooseDate = (d: string) => { setDate(d); setSlots(null); setTime(""); };

  useEffect(() => {
    if (!serviceId) return;
    const ac = new AbortController();
    fetch(`/api/availability?serviceId=${serviceId}`, { signal: ac.signal })
      .then((r) => r.json()).then((d) => setDates(d.dates ?? [])).catch(() => { if (!ac.signal.aborted) { setDates([]); setError("Could not load availability. Please try again."); } });
    return () => ac.abort();
  }, [serviceId]);

  useEffect(() => {
    if (!serviceId || !date) return;
    const ac = new AbortController();
    fetch(`/api/availability?serviceId=${serviceId}&date=${date}`, { signal: ac.signal })
      .then((r) => r.json()).then((d) => setSlots(d.slots ?? [])).catch(() => { if (!ac.signal.aborted) setSlots([]); });
    return () => ac.abort();
  }, [serviceId, date]);

  const clientValid = () => {
    const e: Record<string, string[]> = {};
    if (form.fullName.trim().length < 2) e.fullName = ["Enter your full name"];
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) e.email = ["Enter a valid email address"];
    if (!/^\+?[0-9 ()-]{7,20}$/.test(form.phone.trim()) || form.phone.replace(/\D/g, "").length < 7) e.phone = ["Enter a valid phone number, e.g. +1 512 555 0147"];
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  async function submit() {
    if (submitted.current || busy) return;
    submitted.current = true; setBusy(true); setError("");
    try {
      const res = await fetch("/api/book", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, date, time, ...form, source: "web" }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fields) setErrors(data.fields);
        setError(data.error === "BACKEND_NOT_CONFIGURED" ? "Online booking is not connected yet." : data.error ?? "Something went wrong.");
        if (res.status === 409) { setStep("pick"); setTime(""); setSlots(null); fetch(`/api/availability?serviceId=${serviceId}&date=${date}`).then((r) => r.json()).then((d) => setSlots(d.slots ?? [])); }
        else if (res.status === 422) setStep("details");
        submitted.current = false;
      } else { setResult(data); setStep("done"); }
    } catch { setError("Network problem. Please try again."); submitted.current = false; }
    finally { setBusy(false); }
  }

  if (step === "done" && result) {
    return (
      <div role="status" className="rounded-3xl bg-paper p-8 md:p-12">
        <p className="text-sm text-teal">Request received</p>
        <h2 className="mt-2 text-4xl md:text-5xl">Your appointment request has been submitted.</h2>
        <p className="mt-4 max-w-lg text-lg text-ink/75">It is <strong>pending</strong> until the clinic confirms it. {result.emailSent ? "We have emailed you the details." : "A confirmation email could not be sent, so please keep your reference."}</p>
        <dl className="mt-8 grid gap-6 border-y border-line py-6 sm:grid-cols-2">
          <div><dt className="text-sm text-ink/60">Reference</dt><dd className="display text-3xl">{result.reference}</dd></div>
          <div><dt className="text-sm text-ink/60">Treatment</dt><dd>{result.service}</dd></div>
          <div><dt className="text-sm text-ink/60">Date</dt><dd>{fmtDate(result.date, true)}</dd></div>
          <div><dt className="text-sm text-ink/60">Time</dt><dd>{fmtTime(result.time)}</dd></div>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={result.manageUrl.replace(/^https?:\/\/[^/]+/, "")} className="rounded-full border border-ink/30 px-6 py-3 hover:border-teal hover:text-teal">Request cancellation or reschedule</Link>
          <Link href="/" className="rounded-full bg-ink px-6 py-3 text-ivory hover:bg-teal">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <div aria-live="polite">{error && <p role="alert" className="mb-6 rounded-xl border border-alert/30 bg-alert/5 p-4 text-alert">{error}</p>}</div>

        {step === "pick" && (
          <div className="space-y-10">
            <fieldset>
              <legend className="display text-2xl">1. Treatment</legend>
              <label htmlFor="svc" className="sr-only">Treatment</label>
              <select id="svc" className={field} value={serviceId} onChange={(e) => chooseService(e.target.value)}>
                <option value="">Choose a treatment</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {service && <p className="mt-2 text-sm text-ink/70">{service.price_label} · about {service.duration_minutes} minutes</p>}
            </fieldset>

            {serviceId && (
              <fieldset>
                <legend className="display text-2xl">2. Date</legend>
                {dates === null ? <p className="mt-3 text-ink/60" role="status">Checking availability&hellip;</p>
                  : dates.length === 0 ? <p className="mt-3">No openings in the next four weeks. Please call the clinic.</p>
                  : <div className="mt-3 flex flex-wrap gap-2">{dates.map((d) => (
                    <button key={d} type="button" aria-pressed={date === d} onClick={() => chooseDate(d)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${date === d ? "border-ink bg-ink text-ivory" : "border-line hover:border-teal"}`}>{fmtDate(d)}</button>))}</div>}
              </fieldset>
            )}

            {date && (
              <fieldset>
                <legend className="display text-2xl">3. Time</legend>
                {slots === null ? <p className="mt-3 text-ink/60" role="status">Loading times&hellip;</p>
                  : slots.length === 0 ? <p className="mt-3">That day just filled up. Please pick another.</p>
                  : <div className="mt-3 flex flex-wrap gap-2">{slots.map((t) => (
                    <button key={t} type="button" aria-pressed={time === t} onClick={() => setTime(t)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${time === t ? "border-ink bg-ink text-ivory" : "border-line hover:border-teal"}`}>{fmtTime(t)}</button>))}</div>}
              </fieldset>
            )}
            <button type="button" disabled={!serviceId || !date || !time} onClick={() => { setError(""); setStep("details"); }}
              className="rounded-full bg-ink px-8 py-3.5 font-medium text-ivory transition hover:bg-teal disabled:cursor-not-allowed disabled:opacity-40">Continue</button>
          </div>
        )}

        {step === "details" && (
          <form noValidate onSubmit={(e) => { e.preventDefault(); if (clientValid()) { setError(""); setStep("confirm"); } }} className="space-y-6">
            <h2 className="display text-2xl">4. Your details</h2>
            {([["fullName", "Full name", "text", "name"], ["email", "Email address", "email", "email"], ["phone", "Phone number", "tel", "tel"]] as const).map(([k, label, type, ac]) => (
              <div key={k}>
                <label htmlFor={k} className="font-medium">{label}</label>
                <input id={k} type={type} autoComplete={ac} required value={form[k]} maxLength={k === "email" ? 200 : 120}
                  aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `${k}-e` : undefined}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={field} />
                {errors[k] && <p id={`${k}-e`} className="mt-1 text-sm text-alert">{errors[k][0]}</p>}
              </div>
            ))}
            <div>
              <label htmlFor="notes" className="font-medium">Reason for visit or notes <span className="font-normal text-ink/60">(optional)</span></label>
              <textarea id="notes" rows={3} maxLength={1000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={field} />
              <p className="mt-1 text-sm text-ink/60">Please don&apos;t include sensitive medical history here. Your dentist will ask at the visit.</p>
            </div>
            {/* honeypot */}
            <div aria-hidden className="absolute -left-[9999px]"><label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></label></div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep("pick")} className="rounded-full border border-ink/30 px-7 py-3.5 hover:border-teal">Back</button>
              <button type="submit" className="rounded-full bg-ink px-8 py-3.5 font-medium text-ivory hover:bg-teal">Review booking</button>
            </div>
          </form>
        )}

        {step === "confirm" && (
          <div>
            <h2 className="display text-2xl">5. Confirm your request</h2>
            <p className="mt-2 text-ink/75">Nothing is booked until you confirm. The clinic will then confirm your appointment.</p>
            <dl className="mt-6 divide-y divide-line border-y border-line">
              {[["Treatment", service?.name], ["Date", fmtDate(date, true)], ["Time", fmtTime(time)], ["Name", form.fullName], ["Email", form.email], ["Phone", form.phone], ...(form.notes ? [["Notes", form.notes]] : [])].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 py-3"><dt className="text-ink/60">{k}</dt><dd className="text-right">{v}</dd></div>))}
            </dl>
            <div className="mt-8 flex gap-3">
              <button type="button" onClick={() => setStep("details")} disabled={busy} className="rounded-full border border-ink/30 px-7 py-3.5 hover:border-teal">Edit</button>
              <button type="button" onClick={submit} disabled={busy} className="rounded-full bg-ink px-8 py-3.5 font-medium text-ivory hover:bg-teal disabled:opacity-60">{busy ? "Submitting…" : "Confirm request"}</button>
            </div>
          </div>
        )}
      </div>

      <aside className="lg:col-span-4 lg:col-start-9">
        <div className="rounded-3xl bg-paper p-7">
          <h2 className="display text-2xl">Good to know</h2>
          <ul className="mt-4 space-y-3 text-ink/75">
            <li>Times shown are live. If someone books a slot first, you will be offered another.</li>
            <li>Requests start as pending and become confirmed by the clinic.</li>
            <li>Severe pain, swelling or bleeding that will not stop? Call the clinic now rather than waiting.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
