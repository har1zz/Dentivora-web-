import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "The clinic" };

const blocks = [
  ["Our philosophy", "Prevention first. Most dental problems are easier, cheaper and gentler to deal with early, so we focus on catching them early and helping you keep them away."],
  ["How we care for you", "You get time to talk, a clear explanation of what we find, and written options. You decide what happens next, and we never rush that decision."],
  ["Hygiene", "Instruments are sterilised between patients and single-use items are discarded after each visit. Placeholder: replace with the clinic's actual sterilisation standards and certifications."],
  ["Technology", "Placeholder: describe the clinic's real equipment, such as digital X-rays or intra-oral scanners, once confirmed by the clinic."],
  ["Your experience", "A calm waiting area, honest timings, and a confirmation you can rely on. If we run late, we tell you."],
];

export default function About() {
  return (
    <div className="mx-auto max-w-4xl px-5 pb-12 pt-32 md:px-8">
      <h1 className="text-5xl md:text-7xl">The clinic</h1>
      <p className="mt-5 max-w-xl text-lg text-ink/75">Dentivora is a demonstration clinic. Details marked as placeholders should be replaced with the real clinic&apos;s information.</p>
      <div className="mt-14">
        {blocks.map(([t, d]) => (
          <section key={t} className="grid gap-3 border-t border-line py-9 md:grid-cols-12">
            <h2 className="text-3xl md:col-span-4">{t}</h2>
            <p className="text-lg text-ink/80 md:col-span-8">{d}</p>
          </section>
        ))}
      </div>
      <Link href="/book" className="mt-8 inline-block rounded-full bg-ink px-8 py-4 font-medium text-ivory hover:bg-teal">Book a visit</Link>
    </div>
  );
}
