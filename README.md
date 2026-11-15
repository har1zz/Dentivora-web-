# Dentivora

A cinematic, scroll-driven dental clinic website with live appointment booking, an AI assistant and a staff dashboard.

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, GSAP + ScrollTrigger, Lenis, React Three Fiber, Supabase (Postgres, Auth, RLS), Nodemailer (Gmail SMTP), MyChatBot widget.

## What is in here
- **Cinematic hero** (`src/components/cinematic`): a procedural Three.js dental-model render (tooth anatomy, sculpted gums, plaque shader, scaler) driven by scroll. Pinned, reduced-motion aware, simplified on mobile.
- **Booking** (`/book`): live availability from Postgres, summary and confirm step, duplicate-click guard, atomic slot reservation, booking reference, email confirmation, cancel / reschedule requests via a secret link.
- **Smile Assistant**: MyChatBot widget (`src/components/SmileAssistant.tsx`) with a Dentivora FAQ knowledge base. It sends people to `/book` for live times and never quotes prices it does not have.
- **Clinic pages:** treatments (with prices from the database), dentists, about, patient guide, contact.
- **Staff dashboard** (`/admin`): sign in with Supabase Auth, role checked server-side on every page and action. Manage appointments (confirm, cancel, complete, no-show, reschedule), treatment prices and durations, opening hours.

## Setup
1. Create a **new** Supabase project. In the SQL editor run, in order:
   `20261114000001_init.sql`, `20261114000002_seed.sql`, then `20261115000001_us_location.sql` (all in `supabase/migrations/`).
2. Copy `.env.example` to `.env.local` and fill in the Supabase URL, anon key and service-role key (server only), `GMAIL_APP_PASSWORD`, and `BOOKING_LINK_SECRET`.
3. In Supabase Auth create a staff user, then run:
   `insert into public.admin_users (user_id, role) values ('<that user id>', 'owner');`
4. `npm install && npm run dev`

## Security notes
- Service-role key and email password are server-only; nothing secret uses `NEXT_PUBLIC_`.
- RLS on every table. Public visitors can only read active services, dentists, FAQs, hours. Appointments and chat logs have no public policy; booking goes through a `SECURITY DEFINER` function callable only by the server.
- Strict CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, referrer and permissions policies (`next.config.ts`).
- Zod validation on every API route, same-origin (CSRF) check, per-IP rate limits, honeypot fields, generic login errors, `noindex` on admin.
- The in-memory rate limiter suits a single server. On multi-instance hosting swap `src/lib/rate-limit.ts` for Redis/Upstash.

## Placeholders to replace before launch
Clinic address and phone (`src/lib/clinic-info.ts` and the `clinic_settings` table; the demo uses a fictional Austin, TX address and a reserved 555-01xx number), prices (admin dashboard), dentist profiles (add real, verified credentials only), photography, and the "hygiene" / "technology" copy on the About page.
