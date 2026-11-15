"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollState } from "./Scene3D";

gsap.registerPlugin(ScrollTrigger);
const Scene3D = dynamic(() => import("./Scene3D"), { ssr: false });

const sm = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const win = (p: number, a: number, b: number, f = 0.025) => sm(a, a + f, p) * (1 - sm(b - f, b, p));

const subscribe = () => () => {};
/** Reads a browser-only value without a hydration mismatch (false on the server). */
function useClient(read: () => boolean) {
  return useSyncExternalStore(subscribe, read, () => false);
}

const cta = "inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-medium transition-colors";

export function Cinematic() {
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const mounted = useClient(() => true);
  const reduced = useClient(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const mobile = useClient(() => window.innerWidth < 768);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mounted || reduced || !wrap.current || !stage.current) return;
    const ranges: [number, number][] = [[-1, 0.13], [0.15, 0.3], [0.33, 0.46], [0.5, 0.6], [0.62, 0.83], [0.86, 2]];
    const apply = (p: number) => {
      scrollState.p = p;
      const layers = stage.current!.querySelectorAll<HTMLElement>("[data-layer]");
      layers.forEach((el) => {
        const i = Number(el.dataset.layer);
        const [a, b] = ranges[i];
        const o = i === 0 ? 1 - sm(0.1, 0.14, p) : i === 5 ? sm(a, a + 0.04, p) : win(p, a, b);
        el.style.opacity = String(o);
        el.style.transform = `translate3d(0, ${(1 - o) * 14}px, 0)`;
        el.style.pointerEvents = o > 0.5 ? "auto" : "none";
        el.setAttribute("aria-hidden", o > 0.05 ? "false" : "true");
      });
      if (bar.current) bar.current.style.transform = `scaleY(${p})`;
    };
    apply(0);
    const st = ScrollTrigger.create({
      trigger: wrap.current,
      start: "top top",
      end: () => `+=${window.innerHeight * (window.innerWidth < 768 ? 4.2 : 5.5)}`,
      pin: stage.current,
      scrub: true,
      anticipatePin: 1,
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    });
    return () => { st.kill(); scrollState.p = 0; };
  }, [mounted, reduced]);

    return (
    <section ref={wrap} aria-label="A guided tour of professional dental care" className="relative">
      <div ref={stage} className="relative h-svh w-full overflow-hidden bg-[#efe8da]">
        <div className="absolute inset-0">
          {mounted && <Scene3D mobile={mobile} frameloop={reduced ? "demand" : "always"} />}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(15,42,51,0.18)_100%)]" />

        {/* Scene 1: hero */}
        <div data-layer="0" className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-end px-5 pb-14 md:justify-center md:px-12 md:pb-0">
          <div className="max-w-2xl">
            <p className="mb-5 text-sm tracking-wide text-teal">Dentivora · Dental care in Austin, Texas</p>
            <h1 className="text-[clamp(3rem,8.2vw,7.2rem)]">Your smile deserves better.</h1>
            <p className="mt-6 max-w-md text-lg text-ink/75">Modern dentistry. Thoughtful care. A healthier smile.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/book" className={`${cta} bg-ink text-ivory hover:bg-teal`}>Book an appointment</Link>
              <Link href="/services" className={`${cta} border border-ink/30 hover:border-teal hover:text-teal`}>Explore our care</Link>
            </div>
          </div>
          {!reduced && <p className="mt-10 hidden text-sm text-ink/55 md:block">Scroll to begin the tour</p>}
        </div>

        {/* Scene 2 */}
        <Caption layer={1} title="Every smile starts with one tooth." body="Enamel is the hardest tissue in the body, and it still needs looking after." />
        {/* Scene 3 */}
        <Caption layer={2} title="Twenty-eight to thirty-two teeth, one daily routine." body="Strong teeth come from small habits repeated for years, backed by regular check-ups." />
        {/* Scene 4a */}
        <Caption layer={3} title="Plaque builds quietly." body="Even careful brushing leaves some behind, especially along the gum line." />
        {/* Scene 4b */}
        <Caption layer={4} title="A professional clean reaches what brushing can't." body="Your hygienist removes plaque and tartar gently, tooth by tooth." note="Educational visualisation. Results vary from patient to patient." />

        {/* Scene 5 */}
        <div data-layer="5" className="absolute inset-0 flex flex-col items-center justify-start px-5 pt-24 text-center md:pt-28">
          <h2 className="max-w-4xl text-[clamp(2.4rem,6.2vw,5.4rem)] ">Small moments of care. Lifelong confidence.</h2>
          <Link href="/book" className={`${cta} mt-9 bg-ink text-ivory hover:bg-teal`}>Let&apos;s take care of your smile</Link>
        </div>

        {!reduced && <div aria-hidden className="absolute right-4 top-1/2 hidden h-28 w-px -translate-y-1/2 bg-ink/15 md:block"><div ref={bar} className="h-full origin-top bg-teal" style={{ transform: "scaleY(0)" }} /></div>}
      </div>

      {reduced && (
        <div className="mx-auto max-w-3xl space-y-6 px-5 py-16 text-lg">
          <h2 className="text-4xl">Small moments of care. Lifelong confidence.</h2>
          <p>Every smile starts with one tooth. Plaque builds quietly, even with careful brushing, and a professional clean reaches what brushing can&apos;t. Results vary from patient to patient.</p>
          <Link href="/book" className={`${cta} bg-ink text-ivory hover:bg-teal`}>Let&apos;s take care of your smile</Link>
        </div>
      )}
    </section>
  );
}

function Caption({ layer, title, body, note }: { layer: number; title: string; body: string; note?: string }) {
  return (
    <div data-layer={layer} style={{ opacity: 0 }} className="absolute inset-x-0 bottom-0 px-5 pb-12 md:bottom-auto md:left-12 md:right-auto md:top-1/2 md:max-w-md md:-translate-y-1/2 md:px-0 md:pb-0">
      <div aria-hidden className="pointer-events-none absolute -inset-x-6 -inset-y-14 -z-10 bg-[radial-gradient(ellipse_at_30%_50%,rgba(246,242,234,0.94),rgba(246,242,234,0)_72%)]" />
      <h2 className="text-[clamp(1.9rem,3.6vw,3.2rem)]">{title}</h2>
      <p className="mt-4 text-lg text-ink/75">{body}</p>
      {note && <p className="mt-4 text-sm text-ink/55">{note}</p>}
    </div>
  );
}
