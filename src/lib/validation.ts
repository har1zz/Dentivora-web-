import { z } from "zod";

const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a valid phone number, e.g. +1 512 555 0147")
  .refine((v) => v.replace(/\D/g, "").length >= 7, "Phone number is too short");

export const bookingSchema = z.object({
  serviceId: z.string().uuid("Choose a treatment"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Choose a time"),
  fullName: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
  phone,
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  source: z.enum(["web", "chat"]).default("web"),
  // Honeypot: real users never fill this. Bots usually do.
  website: z.string().max(500).optional(),
});
export type BookingInput = z.infer<typeof bookingSchema>;

export const slotsQuerySchema = z.object({
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const changeRequestSchema = z.object({
  reference: z.string().regex(/^DV-[A-Z0-9]{8}$/),
  token: z.string().uuid(),
  type: z.enum(["cancel", "reschedule"]),
  note: z.string().trim().max(500).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(200),
  message: z.string().trim().min(10).max(2000),
  website: z.string().max(500).optional(),
});

export function hhmm(t: string) {
  return t.slice(0, 5);
}
