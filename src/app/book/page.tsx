import type { Metadata } from "next";
import { BookingFlow } from "@/components/BookingFlow";
import { loadServices } from "@/lib/public-data";

export const metadata: Metadata = { title: "Book an appointment" };
export const dynamic = "force-dynamic";

export default async function BookPage({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { service } = await searchParams;
  const { services, live } = await loadServices();
  return (
    <div className="mx-auto max-w-6xl px-5 pb-12 pt-32 md:px-8">
      <h1 className="text-5xl md:text-7xl">Book an appointment</h1>
      <p className="mt-4 mb-14 max-w-xl text-lg text-ink/75">Choose a treatment, see real openings, and send your request in about a minute.</p>
      {live ? (
        <BookingFlow services={services.map((s) => ({ id: s.id, name: s.name, duration_minutes: s.duration_minutes, price_label: s.price_label }))} initialServiceId={service} />
      ) : (
        <div role="status" className="max-w-xl rounded-3xl bg-paper p-8">
          <h2 className="display text-3xl">Online booking is being connected.</h2>
          <p className="mt-3 text-ink/75">The clinic database is not connected yet, so live availability is unavailable. Please call the clinic to book.</p>
        </div>
      )}
    </div>
  );
}
