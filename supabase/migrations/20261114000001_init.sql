-- Dentivora schema: services, pricing, hours, dentists, FAQs, appointments, admin roles.
-- Run in the Supabase SQL editor, or via `supabase db push`.

-- ---------------------------------------------------------------- roles
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'admin', 'staff')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------- clinic info
create table if not exists public.clinic_settings (
  id int primary key default 1 check (id = 1),
  name text not null default 'Dentivora',
  tagline text not null default 'Modern dentistry. Thoughtful care.',
  address text not null default '12 Placeholder Street, Karachi, Pakistan',
  phone text not null default '+92 300 0000000',
  email text not null default 'harizzz191@gmail.com',
  emergency_note text not null default 'For severe pain, facial swelling or uncontrolled bleeding, call the clinic immediately or go to your nearest emergency department.',
  slot_interval_minutes int not null default 30 check (slot_interval_minutes between 10 and 120),
  min_notice_hours int not null default 4,
  max_days_ahead int not null default 60,
  updated_at timestamptz not null default now()
);
insert into public.clinic_settings (id) values (1) on conflict do nothing;

create table if not exists public.opening_hours (
  weekday smallint primary key check (weekday between 0 and 6), -- 0 = Sunday
  is_open boolean not null default true,
  open_time time not null default '09:00',
  close_time time not null default '17:00',
  lunch_start time,
  lunch_end time
);
insert into public.opening_hours (weekday, is_open, open_time, close_time, lunch_start, lunch_end) values
  (0, false, '09:00', '13:00', null, null),
  (1, true, '09:00', '18:00', '13:00', '14:00'),
  (2, true, '09:00', '18:00', '13:00', '14:00'),
  (3, true, '09:00', '18:00', '13:00', '14:00'),
  (4, true, '09:00', '18:00', '13:00', '14:00'),
  (5, true, '09:00', '15:00', null, null),
  (6, true, '10:00', '14:00', null, null)
on conflict (weekday) do nothing;

create table if not exists public.closed_dates (
  closed_on date primary key,
  reason text
);

-- ---------------------------------------------------------------- services
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  summary text not null,
  description text not null,
  who_its_for text,
  what_to_expect text,
  duration_minutes int not null default 30 check (duration_minutes between 10 and 240),
  price_from numeric(10,2),          -- null => "clinic needs to confirm"
  price_to numeric(10,2),
  currency text not null default 'PKR',
  price_note text,
  is_active boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.dentists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  title text not null,
  qualifications text,               -- fill ONLY with verified credentials
  years_experience int,
  specializations text[] not null default '{}',
  bio text,
  photo_url text,
  is_active boolean not null default true,
  sort_order int not null default 100
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text not null default 'general',
  is_active boolean not null default true,
  sort_order int not null default 100
);

-- ---------------------------------------------------------------- appointments
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  service_id uuid not null references public.services(id),
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text not null check (phone ~ '^\+?[0-9 ()-]{7,20}$'),
  notes text check (char_length(notes) <= 1000),
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','completed','no_show')),
  source text not null default 'web' check (source in ('web','chat','admin')),
  cancel_token uuid not null default gen_random_uuid(),
  change_request text check (change_request in ('cancel','reschedule')),
  change_request_note text check (char_length(change_request_note) <= 500),
  created_at timestamptz not null default now()
);

-- One live booking per slot (cancelled ones free the slot).
create unique index if not exists appointments_unique_live_slot
  on public.appointments (appointment_date, start_time)
  where status in ('pending','confirmed');

create index if not exists appointments_email_idx on public.appointments (lower(email));

create table if not exists public.chat_logs (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) <= 4000),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- slot engine
create or replace function public.available_slots(p_date date, p_service uuid)
returns table (slot_start time, slot_end time)
language plpgsql stable security definer set search_path = public as $$
declare
  s record; h record; dur int; t time; clinic_now timestamp;
begin
  select * into s from clinic_settings where id = 1;
  select duration_minutes into dur from services where id = p_service and is_active;
  if dur is null then return; end if;
  if p_date < current_date or p_date > current_date + s.max_days_ahead then return; end if;
  if exists (select 1 from closed_dates where closed_on = p_date) then return; end if;

  select * into h from opening_hours where weekday = extract(dow from p_date)::int;
  if h is null or not h.is_open then return; end if;

  clinic_now := (now() at time zone 'Asia/Karachi');
  t := h.open_time;
  while (t + make_interval(mins => dur)) <= h.close_time loop
    if (h.lunch_start is null or h.lunch_end is null
        or (t + make_interval(mins => dur)) <= h.lunch_start or t >= h.lunch_end)
       and (p_date + t) >= (clinic_now + make_interval(hours => s.min_notice_hours))
       and not exists (
         select 1 from appointments a
         where a.appointment_date = p_date
           and a.status in ('pending','confirmed')
           and a.start_time < (t + make_interval(mins => dur))
           and a.end_time > t
       )
    then
      slot_start := t; slot_end := t + make_interval(mins => dur);
      return next;
    end if;
    t := t + make_interval(mins => s.slot_interval_minutes);
  end loop;
end $$;

-- Atomic booking: re-checks the slot inside the transaction.
create or replace function public.create_appointment(
  p_service uuid, p_date date, p_start time,
  p_name text, p_email text, p_phone text, p_notes text, p_source text
) returns table (id uuid, reference text, cancel_token uuid, end_time time)
language plpgsql security definer set search_path = public as $$
declare
  ok boolean; dur int; ref text; new_id uuid; tok uuid; e time;
begin
  select exists (select 1 from available_slots(p_date, p_service) where slot_start = p_start) into ok;
  if not ok then raise exception 'SLOT_UNAVAILABLE'; end if;

  -- Duplicate guard: same email + same day already holding a live booking.
  if exists (select 1 from appointments a where lower(a.email) = lower(p_email)
             and a.appointment_date = p_date and a.status in ('pending','confirmed')) then
    raise exception 'DUPLICATE_BOOKING';
  end if;

  select duration_minutes into dur from services where services.id = p_service;
  e := p_start + make_interval(mins => dur);
  ref := 'DV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into appointments (reference, service_id, appointment_date, start_time, end_time,
                            full_name, email, phone, notes, source)
  values (ref, p_service, p_date, p_start, e, p_name, p_email, p_phone, p_notes, p_source)
  returning appointments.id, appointments.cancel_token into new_id, tok;

  return query select new_id, ref, tok, e;
exception when unique_violation then
  raise exception 'SLOT_UNAVAILABLE';
end $$;

revoke all on function public.create_appointment from public, anon, authenticated;
-- Only the server (service_role) calls these; visitors reach them through the API routes.
revoke execute on function public.available_slots(date, uuid) from public, anon, authenticated;
grant execute on function public.available_slots(date, uuid) to service_role;
grant execute on function public.create_appointment to service_role;

-- ---------------------------------------------------------------- RLS
alter table public.admin_users      enable row level security;
alter table public.clinic_settings  enable row level security;
alter table public.opening_hours    enable row level security;
alter table public.closed_dates     enable row level security;
alter table public.services         enable row level security;
alter table public.dentists         enable row level security;
alter table public.faqs             enable row level security;
alter table public.appointments     enable row level security;
alter table public.chat_logs        enable row level security;

-- Public read of clinic content only.
create policy "public read settings" on public.clinic_settings for select using (true);
create policy "public read hours"    on public.opening_hours   for select using (true);
create policy "public read closed"   on public.closed_dates    for select using (true);
create policy "public read services" on public.services       for select using (is_active);
create policy "public read dentists" on public.dentists        for select using (is_active);
create policy "public read faqs"     on public.faqs            for select using (is_active);

-- Admins manage everything. No public policy exists for appointments or chat_logs,
-- so anonymous visitors cannot read or write them directly.
create policy "admin all settings"  on public.clinic_settings for all using (is_admin()) with check (is_admin());
create policy "admin all hours"     on public.opening_hours   for all using (is_admin()) with check (is_admin());
create policy "admin all closed"    on public.closed_dates    for all using (is_admin()) with check (is_admin());
create policy "admin all services"  on public.services       for all using (is_admin()) with check (is_admin());
create policy "admin all dentists"  on public.dentists        for all using (is_admin()) with check (is_admin());
create policy "admin all faqs"      on public.faqs            for all using (is_admin()) with check (is_admin());
create policy "admin all appts"     on public.appointments    for all using (is_admin()) with check (is_admin());
create policy "admin read chats"    on public.chat_logs       for select using (is_admin());
create policy "admin read roles"    on public.admin_users     for select using (user_id = auth.uid() or is_admin());
