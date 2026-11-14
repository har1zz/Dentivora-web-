"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/services", label: "Treatments" },
  { href: "/dentists", label: "Dentists" },
  { href: "/about", label: "The clinic" },
  { href: "/resources", label: "Patient guide" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  if (path.startsWith("/admin")) return null;
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/60 bg-ivory/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <Link href="/" className="display text-2xl tracking-tight text-ink" aria-label="Dentivora home">Dentivora</Link>
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}
              className="text-[0.95rem] text-ink/80 transition-colors hover:text-teal aria-[current=page]:text-teal">{l.label}</Link>
          ))}
          <Link href="/book" className="rounded-full bg-ink px-5 py-2 text-sm font-medium text-ivory transition-colors hover:bg-teal">Book a visit</Link>
        </nav>
        <button className="md:hidden rounded-full border border-line px-4 py-2 text-sm" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((v) => !v)}>
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line bg-ivory px-5 pb-6 pt-2 md:hidden">
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}><Link href={l.href} onClick={() => setOpen(false)} className="block border-b border-line/60 py-3 text-lg">{l.label}</Link></li>
            ))}
          </ul>
          <Link href="/book" onClick={() => setOpen(false)} className="mt-5 block rounded-full bg-ink py-3 text-center font-medium text-ivory">Book a visit</Link>
        </nav>
      )}
    </header>
  );
}
