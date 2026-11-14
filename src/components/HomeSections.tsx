import Link from "next/link";
import { loadDentists, loadServices } from "@/lib/public-data";

const reasons = [
  ["Unhurried appointments", "We plan enough time to listen first, then examine, then explain your options in plain language."],
  ["Clear pricing", "Prices are listed on each treatment page. Where a cost depends on an examination, we say so before you commit."],
  ["Gentle by habit", "Numbing when it helps, pauses whenever you ask, and no judgement about how long it has been."],
  ["Easy to book", "See real openings online, or ask the Smile Assistant. You get a reference number straight away."],
];

export async function HomeSections() {
  const [{ services }, dentists] = await Promise.all([loadServices(), loadDentists()]);
  return (
    <>
      <section className="mx-auto max-w-7xl px-5 py-28 md:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <h2 className="text-4xl md:col-span-6 md:text-6xl">A clinic built around how it feels to be there.</h2>
          <div className="space-y-5 text-lg text-ink/75 md:col-span-5 md:col-start-8">
            <p>Dentivora is a modern dental clinic in Karachi. We keep appointments calm, explain what we find, and let you decide what happens next.</p>
            <p>Our approach is simple: prevention first, treatment when it is needed, and honest advice either way.</p>
            <Link href="/about" className="inline-block border-b border-ink pb-0.5 hover:border-teal hover:text-teal">About the clinic</Link>
          </div>
        </div>
      </section>

      <section className="bg-paper py-24">
        <div className="mx-auto max-w-7xl px-5 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="text-4xl md:text-5xl">Treatments</h2>
            <Link href="/services" className="border-b border-ink pb-0.5 hover:border-teal hover:text-teal">See all treatments and prices</Link>
          </div>
          <ul className="mt-12 grid gap-x-10 md:grid-cols-2">
            {services.slice(0, 6).map((s) => (
              <li key={s.slug} className="border-t border-line">
                <Link href={`/services/${s.slug}`} className="group flex items-baseline justify-between gap-6 py-6">
                  <span>
                    <span className="display block text-2xl group-hover:text-teal">{s.name}</span>
                    <span className="mt-1 block text-ink/70">{s.summary}</span>
                  </span>
                  <span aria-hidden className="text-ink/40 transition-transform group-hover:translate-x-1">&rarr;</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-28 md:px-8">
        <h2 className="max-w-2xl text-4xl md:text-5xl">Why patients choose Dentivora</h2>
        <dl className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {reasons.map(([t, d]) => (
            <div key={t} className="border-t border-line pt-5">
              <dt className="display text-2xl">{t}</dt>
              <dd className="mt-2 max-w-md text-ink/75">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-teal py-24 text-ivory">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-2 md:px-8">
          <div>
            <h2 className="text-4xl md:text-5xl">Questions at 11 p.m.? Ask the Smile Assistant.</h2>
            <p className="mt-5 max-w-md text-lg text-ivory/80">It can explain treatments, tell you what to expect at a first visit, and point you to live booking. It is not a dentist and does not diagnose. For anything urgent, call the clinic.</p>
          </div>
          <div className="flex items-end md:justify-end">
            <Link href="/book" className="rounded-full bg-ivory px-8 py-4 font-medium text-ink transition-colors hover:bg-seaglass">Book an appointment</Link>
          </div>
        </div>
      </section>

      {dentists.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-28 md:px-8">
          <h2 className="text-4xl md:text-5xl">Meet your dentists</h2>
          <ul className="mt-12 grid gap-10 md:grid-cols-3">
            {dentists.slice(0, 3).map((d) => (
              <li key={d.id}><p className="display text-2xl">{d.name}</p><p className="text-ink/70">{d.title}</p></li>
            ))}
          </ul>
          <Link href="/dentists" className="mt-10 inline-block border-b border-ink pb-0.5 hover:border-teal hover:text-teal">All dentist profiles</Link>
        </section>
      )}

      <section className="mx-auto max-w-4xl px-5 py-28 text-center md:px-8">
        <h2 className="text-4xl md:text-6xl">Let&apos;s take care of your smile.</h2>
        <p className="mx-auto mt-5 max-w-lg text-lg text-ink/75">Pick a treatment, see real openings, and book in about a minute.</p>
        <Link href="/book" className="mt-9 inline-block rounded-full bg-ink px-9 py-4 font-medium text-ivory transition-colors hover:bg-teal">Book an appointment</Link>
      </section>
    </>
  );
}
