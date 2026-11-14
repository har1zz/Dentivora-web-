"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const path = usePathname();
  if (path.startsWith("/admin")) return null;
  return (
    <footer className="mt-24 border-t border-line bg-ink text-ivory">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <p className="display text-3xl">Dentivora</p>
          <p className="mt-3 max-w-sm text-ivory/70">Modern dentistry. Thoughtful care. A healthier smile.</p>
          <p className="mt-6 max-w-sm text-sm text-ivory/60">
            Severe pain, facial swelling or bleeding that will not stop? Call the clinic now or go to your nearest emergency department.
          </p>
        </div>
        <nav aria-label="Footer">
          <p className="text-sm text-ivory/60">Explore</p>
          <ul className="mt-3 space-y-2">
            {[["/services", "Treatments"], ["/dentists", "Dentists"], ["/about", "The clinic"], ["/resources", "Patient guide"], ["/book", "Book a visit"]].map(([h, l]) => (
              <li key={h}><Link className="hover:text-seaglass" href={h}>{l}</Link></li>
            ))}
          </ul>
        </nav>
        <div>
          <p className="text-sm text-ivory/60">Visit</p>
          <address className="mt-3 not-italic text-ivory/85">12 Placeholder Street<br />Karachi, Pakistan</address>
          <p className="mt-3"><a className="hover:text-seaglass" href="tel:+923000000000">+92 300 0000000</a></p>
        </div>
      </div>
      <p className="border-t border-white/10 px-5 py-5 text-center text-xs text-ivory/50">
        © {new Date().getFullYear()} Dentivora. Demonstration site. Clinic details are placeholders.
      </p>
    </footer>
  );
}
