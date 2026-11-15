import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { loadHours } from "@/lib/public-data";
import { CLINIC } from "@/lib/clinic-info";

export const metadata: Metadata = { title: "Contact" };
export const dynamic = "force-dynamic";

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const t = (s: string) => { const [h, m] = s.split(":").map(Number); return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };

export default async function Contact() {
  const hours = await loadHours();
  return (
    <div className="mx-auto max-w-6xl px-5 pb-12 pt-32 md:px-8">
      <h1 className="text-5xl md:text-7xl">Contact</h1>
      <div className="mt-14 grid gap-14 md:grid-cols-2">
        <div className="space-y-10">
          <div>
            <h2 className="text-3xl">Visit or call</h2>
            <address className="mt-3 text-lg not-italic text-ink/80">{CLINIC.street}<br />{CLINIC.city}, {CLINIC.region} {CLINIC.postal}<br /><a className="text-teal hover:underline" href={`tel:${CLINIC.phoneTel}`}>{CLINIC.phoneDisplay}</a><br /><a className="text-teal hover:underline" href={`mailto:${CLINIC.email}`}>{CLINIC.email}</a></address>
            <p className="mt-2 text-sm text-ink/60">The address and phone number are fictional placeholders for this demo.</p>
          </div>
          <div>
            <h2 className="text-3xl">Opening hours</h2>
            {hours.length ? (
              <table className="mt-3 w-full max-w-sm text-lg"><caption className="sr-only">Opening hours</caption><tbody>
                {hours.map((h) => (<tr key={h.weekday} className="border-b border-line"><th scope="row" className="py-2 text-left font-normal">{days[h.weekday]}</th><td className="py-2 text-right">{h.is_open ? `${t(h.open_time)} to ${t(h.close_time)}` : "Closed"}</td></tr>))}
              </tbody></table>
            ) : <p className="mt-3 text-ink/75">Opening hours will appear here once the clinic database is connected.</p>}
          </div>
          <p className="rounded-2xl bg-paper p-5 text-ink/80">Severe pain, facial swelling, trouble breathing or bleeding that will not stop? Call the clinic now or go to your nearest emergency department.</p>
          <Link href="/book" className="inline-block rounded-full bg-ink px-8 py-4 font-medium text-ivory hover:bg-teal">Book an appointment</Link>
        </div>
        <div>
          <h2 className="mb-5 text-3xl">Send a message</h2>
          <ContactForm />
        </div>
      </div>
      <iframe title="Map of Austin, Texas" className="mt-16 h-80 w-full rounded-3xl border border-line" loading="lazy"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${CLINIC.mapBbox}&layer=mapnik`} />
    </div>
  );
}
