"use client";
import { useState } from "react";

const field = "mt-1.5 w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-teal focus:ring-2 focus:ring-seaglass";

export function ContactForm() {
  const [v, setV] = useState({ name: "", email: "", message: "", website: "" });
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  async function send(e: React.FormEvent) {
    e.preventDefault(); setState("busy");
    const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setState("done");
    else { setState("error"); setMsg(d.error === "EMAIL_NOT_CONFIGURED" ? "Messages are not switched on yet. Please call the clinic." : d.error ?? "Something went wrong."); }
  }
  if (state === "done") return <p role="status" className="rounded-2xl bg-paper p-6 text-lg">Thank you. Your message has been sent and the clinic will reply by email.</p>;
  return (
    <form onSubmit={send} className="space-y-5">
      <div><label htmlFor="cn" className="font-medium">Name</label><input id="cn" required minLength={2} maxLength={120} autoComplete="name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className={field} /></div>
      <div><label htmlFor="ce" className="font-medium">Email</label><input id="ce" type="email" required maxLength={200} autoComplete="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} className={field} /></div>
      <div><label htmlFor="cm" className="font-medium">Message</label><textarea id="cm" required minLength={10} maxLength={2000} rows={5} value={v.message} onChange={(e) => setV({ ...v, message: e.target.value })} className={field} /></div>
      <div aria-hidden className="absolute -left-[9999px]"><label>Website<input tabIndex={-1} autoComplete="off" value={v.website} onChange={(e) => setV({ ...v, website: e.target.value })} /></label></div>
      {state === "error" && <p role="alert" className="text-alert">{msg}</p>}
      <button disabled={state === "busy"} className="rounded-full bg-ink px-8 py-3.5 font-medium text-ivory hover:bg-teal disabled:opacity-60">{state === "busy" ? "Sending…" : "Send message"}</button>
    </form>
  );
}
