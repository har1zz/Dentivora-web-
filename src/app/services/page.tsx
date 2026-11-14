import type { Metadata } from "next";
import Link from "next/link";
import { loadServices } from "@/lib/public-data";

export const metadata: Metadata = { title: "Treatments and prices" };
export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const { services, live } = await loadServices();
  return (
    <div className="mx-auto max-w-5xl px-5 pb-12 pt-32 md:px-8">
      <h1 className="text-5xl md:text-7xl">Treatments</h1>
      <p className="mt-5 max-w-xl text-lg text-ink/75">Straightforward explanations and prices. Where a cost depends on an examination, we say so.</p>
      {!live && <p role="status" className="mt-6 rounded-lg border border-line bg-paper p-4 text-sm">Live prices will appear here once the clinic database is connected.</p>}
      <ul className="mt-14">
        {services.map((s) => (
          <li key={s.slug} className="border-t border-line">
            <Link href={`/services/${s.slug}`} className="group grid gap-2 py-7 md:grid-cols-12 md:gap-8">
              <span className="display text-3xl group-hover:text-teal md:col-span-5">{s.name}</span>
              <span className="text-ink/75 md:col-span-4">{s.summary}</span>
              <span className="text-sm text-ink/80 md:col-span-3 md:text-right">{s.price_label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
