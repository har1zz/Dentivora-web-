-- Moves the demo clinic to Austin, Texas: timezone setting, USD prices, US placeholder contact details,
-- and a slot function that uses the clinic's own local date. Run after the init and seed migrations.

alter table public.clinic_settings add column if not exists timezone text not null default 'America/Chicago';
alter table public.clinic_settings alter column address set default '2418 Lakeview Drive, Austin, TX 78704, United States';
alter table public.clinic_settings alter column phone set default '+1 (512) 555-0147';
update public.clinic_settings set
  address = '2418 Lakeview Drive, Austin, TX 78704, United States',
  phone = '+1 (512) 555-0147',
  timezone = 'America/Chicago'
where id = 1;

alter table public.services alter column currency set default 'USD';
update public.services set
  currency = 'USD',
  price_from = case slug
    when 'general-consultation' then 75 when 'dental-cleaning' then 120 when 'teeth-whitening' then 350
    when 'dental-fillings' then 150 when 'tooth-extraction' then 150 when 'gum-treatment' then 250
    when 'pediatric-dentistry' then 75 else price_from end,
  price_to = case slug
    when 'general-consultation' then 75 when 'dental-cleaning' then 180 when 'teeth-whitening' then 600
    when 'dental-fillings' then 350 when 'tooth-extraction' then 450 when 'gum-treatment' then 500
    when 'pediatric-dentistry' then 125 else price_to end;

create or replace function public.available_slots(p_date date, p_service uuid)
returns table (slot_start time, slot_end time)
language plpgsql stable security definer set search_path = public as $$
declare
  s record; h record; dur int; t time; clinic_now timestamp; local_today date;
begin
  select * into s from clinic_settings where id = 1;
  select duration_minutes into dur from services where id = p_service and is_active;
  if dur is null then return; end if;

  clinic_now := (now() at time zone s.timezone);
  local_today := clinic_now::date;
  if p_date < local_today or p_date > local_today + s.max_days_ahead then return; end if;
  if exists (select 1 from closed_dates where closed_on = p_date) then return; end if;

  select * into h from opening_hours where weekday = extract(dow from p_date)::int;
  if h is null or not h.is_open then return; end if;

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
