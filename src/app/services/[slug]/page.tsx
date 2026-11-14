import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadFaqs, loadServices } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { services } = await loadServices();
  const s = services.find((x) => x.slug === slug);
  return { title: s?.name ?? "Treatment", description: s?.summary };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ services }, faqs] = await Promise.all([loadServices(), loadFaqs()]);
  const s = services.find((x) => x.slug === slug);
  if (!s) notFound();
  const book = s.id ? `/book?service=${s.id}` : "/book";
  return (
    <article className="mx-auto max-w-4xl px-5 pb-12 pt-32 md:px-8">
      <Link href="/services" className="text-sm text-teal hover:underline">All treatments</Link>
      <h1 className="mt-4 text-5xl md:text-7xl">{s.name}</h1>
      <p className="mt-5 max-w-2xl text-xl text-ink/80">{s.summary}</p>
      <dl className="mt-12 grid gap-8 border-y border-line py-8 md:grid-cols-3">
        <div><dt className="text-sm text-ink/60">Price</dt><dd className="mt-1">{s.price_label}</dd></div>
        <div><dt className="text-sm text-ink/60">Typical appointment</dt><dd className="mt-1">{s.duration_minutes ? `${s.duration_minutes} minutes` : "Confirmed when you book"}</dd></div>
        <div><dt className="text-sm text-ink/60">Book</dt><dd className="mt-1"><Link href={book} className="font-medium text-teal hover:underline">Choose a time</Link></dd></div>
      </dl>
      <div className="mt-12 max-w-2xl space-y-10 text-lg">
        <section><h2 className="text-3xl">About this treatment</h2><p className="mt-3 text-ink/80">{s.description}</p></section>
        {s.who_its_for && <section><h2 className="text-3xl">Who it may suit</h2><p className="mt-3 text-ink/80">{s.who_its_for}</p></section>}
        {s.what_to_expect && <section><h2 className="text-3xl">What happens</h2><p className="mt-3 text-ink/80">{s.what_to_expect}</p></section>}
        <p className="text-base text-ink/60">This page is general information, not a diagnosis. Your dentist will advise what is right for you after an examination, and results can vary.</p>
      </div>
      {faqs.length > 0 && (
        <section className="mt-16 max-w-2xl">
          <h2 className="text-3xl">Common questions</h2>
          <div className="mt-6">{faqs.slice(0, 4).map((f) => (
            <details key={f.id} className="border-t border-line py-4"><summary className="cursor-pointer text-lg">{f.question}</summary><p className="mt-2 text-ink/75">{f.answer}</p></details>
          ))}</div>
        </section>
      )}
      <Link href={book} className="mt-14 inline-block rounded-full bg-ink px-8 py-4 font-medium text-ivory hover:bg-teal">Book {s.name.toLowerCase()}</Link>
    </article>
  );
}
