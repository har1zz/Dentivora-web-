import type { Metadata } from "next";
import Link from "next/link";
import { loadFaqs } from "@/lib/public-data";

export const metadata: Metadata = { title: "Patient guide" };
export const dynamic = "force-dynamic";

const guides: [string, string[]][] = [
  ["Your first visit", ["Arrive about 10 minutes early and bring any previous dental records or X-rays.", "Tell us about any worries, medicines you take, and how long it has been since your last check-up.", "We examine, explain, and agree a plan with you. You are never pressured into treatment."]],
  ["Looking after your teeth", ["Brush twice a day for two minutes with a fluoride toothpaste, and clean between your teeth daily.", "Limit sugary snacks and drinks between meals.", "Visit your dentist as often as they advise. For many adults that is about every six months."]],
  ["Before a treatment", ["Eat normally unless we tell you otherwise, and keep your usual routine.", "Let us know if your health or medicines have changed since your last visit.", "Ask us anything beforehand. A question is never a waste of time."]],
  ["After a treatment", ["Follow the written aftercare we give you. It is specific to your treatment.", "Avoid very hot food or drink while numbness wears off, to protect your cheek and tongue.", "Contact the clinic if something feels wrong. For severe pain, swelling or bleeding that will not stop, call straight away or go to emergency care."]],
];

export default async function Resources() {
  const faqs = await loadFaqs();
  return (
    <div className="mx-auto max-w-4xl px-5 pb-12 pt-32 md:px-8">
      <h1 className="text-5xl md:text-7xl">Patient guide</h1>
      <p className="mt-5 max-w-xl text-lg text-ink/75">General information to help you feel prepared. It is not a substitute for advice from your dentist.</p>
      <div className="mt-14">
        {guides.map(([t, items]) => (
          <section key={t} className="grid gap-4 border-t border-line py-9 md:grid-cols-12">
            <h2 className="text-3xl md:col-span-4">{t}</h2>
            <ul className="list-disc space-y-2 pl-5 text-lg text-ink/80 md:col-span-8">{items.map((i) => <li key={i}>{i}</li>)}</ul>
          </section>
        ))}
      </div>
      {faqs.length > 0 && (
        <section className="mt-6">
          <h2 className="text-4xl">Frequently asked questions</h2>
          <div className="mt-6">{faqs.map((f) => (
            <details key={f.id} className="border-t border-line py-4"><summary className="cursor-pointer text-lg">{f.question}</summary><p className="mt-2 text-ink/75">{f.answer}</p></details>
          ))}</div>
        </section>
      )}
      <Link href="/book" className="mt-12 inline-block rounded-full bg-ink px-8 py-4 font-medium text-ivory hover:bg-teal">Book a visit</Link>
    </div>
  );
}
