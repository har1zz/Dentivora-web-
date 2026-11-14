"use client";
import { useState } from "react";

export function ManageBooking({ reference, token }: { reference: string; token: string }) {
  const [type, setType] = useState<"cancel" | "reschedule">("reschedule");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  if (!reference || !token) return <p className="mt-6 text-lg">This link is incomplete. Please use the link from your confirmation email, or call the clinic.</p>;
  async function send() {
    setState("busy");
    const r = await fetch("/api/change-request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference, token, type, note }) });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setState("done"); else { setState("error"); setMsg(d.error ?? "Something went wrong."); }
  }
  if (state === "done") return <p role="status" className="mt-6 text-lg">Thank you. We have recorded your {type} request for <strong>{reference}</strong>. The clinic will contact you to confirm.</p>;
  return (
    <div className="mt-6 space-y-6">
      <p className="text-lg text-ink/75">Reference <strong>{reference}</strong>. Tell us what you need and the clinic will follow up.</p>
      <fieldset className="space-y-2">
        <legend className="font-medium">I want to</legend>
        {(["reschedule", "cancel"] as const).map((v) => (
          <label key={v} className="flex items-center gap-3"><input type="radio" name="t" checked={type === v} onChange={() => setType(v)} className="size-4 accent-teal" />{v === "cancel" ? "Cancel this appointment" : "Reschedule this appointment"}</label>
        ))}
      </fieldset>
      <div><label htmlFor="n" className="font-medium">Note (optional)</label>
        <textarea id="n" maxLength={500} rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="mt-1.5 w-full rounded-xl border border-line bg-paper px-4 py-3" /></div>
      {state === "error" && <p role="alert" className="text-alert">{msg}</p>}
      <button onClick={send} disabled={state === "busy"} className="rounded-full bg-ink px-8 py-3.5 font-medium text-ivory hover:bg-teal disabled:opacity-60">{state === "busy" ? "Sending…" : "Send request"}</button>
    </div>
  );
}
