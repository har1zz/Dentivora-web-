import type { Metadata } from "next";
import { ManageBooking } from "@/components/ManageBooking";

export const metadata: Metadata = { title: "Manage your booking", robots: { index: false } };

export default async function ManagePage({ searchParams }: { searchParams: Promise<{ ref?: string; token?: string }> }) {
  const { ref, token } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl px-5 pb-12 pt-32 md:px-8">
      <h1 className="text-5xl">Change your booking</h1>
      <ManageBooking reference={ref ?? ""} token={token ?? ""} />
    </div>
  );
}
