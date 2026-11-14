import type { Metadata } from "next";
import Link from "next/link";
import { loadDentists } from "@/lib/public-data";

export const metadata: Metadata = { title: "Meet the dentists" };
export const dynamic = "force-dynamic";

export default async function DentistsPage() {
  const dentists = await loadDentists();
  return (
    <div className="mx-auto max-w-6xl px-5 pb-12 pt-32 md:px-8">
      <h1 className="text-5xl md:text-7xl">Meet the dentists</h1>
      <p className="mt-5 max-w-xl text-lg text-ink/75">The people who will look after you, and how they like to work.</p>
      {dentists.length === 0 ? (
        <p role="status" className="mt-12 max-w-lg rounded-2xl bg-paper p-6">Dentist profiles are published by the clinic once their qualifications have been verified. Please check back soon, or <Link className="underline" href="/contact">contact the clinic</Link>.</p>
      ) : (
        <ul className="mt-16 grid gap-14 md:grid-cols-2">
          {dentists.map((d) => (
            <li key={d.id} className="border-t border-line pt-6">
              <h2 className="text-3xl">{d.name}</h2>
              <p className="text-teal">{d.title}</p>
              {d.qualifications && <p className="mt-3 text-sm text-ink/70">{d.qualifications}</p>}
              {d.years_experience != null && <p className="text-sm text-ink/70">{d.years_experience} years of experience</p>}
              {d.specializations.length > 0 && <p className="mt-3">Special interests: {d.specializations.join(", ")}</p>}
              {d.bio && <p className="mt-4 text-ink/80">{d.bio}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
