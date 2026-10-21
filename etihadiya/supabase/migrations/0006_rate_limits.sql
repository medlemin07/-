-- حماية التتبع من تخمين آخر 4 أرقام، وحماية الحجز من الإغراق
create table if not exists track_failures (id bigserial primary key, code text not null, at timestamptz not null default now());
create index if not exists track_failures_idx on track_failures (code, at);
alter table track_failures enable row level security;   -- بلا سياسات: لا وصول مباشر

drop function if exists track_booking(text, text);
create or replace function track_booking(p_code text, p_last4 text)
returns table(code text, status booking_status, seats_count int, total_mru int, departs_at timestamptz, agency text, pay_status payment_status, expires_at timestamptz)
language plpgsql security definer set search_path=public as $$
#variable_conflict use_column
begin
  delete from track_failures where at < now() - interval '1 day';
  if (select count(*) from track_failures where track_failures.code = upper(p_code) and at > now() - interval '15 minutes') >= 5
     or (select count(*) from track_failures where at > now() - interval '10 minutes') >= 300
    then raise exception 'rate_limited'; end if;
  perform 1 from bookings b where b.code = upper(p_code) and right(b.phone,4) = p_last4;
  if not found then insert into track_failures(code) values (upper(p_code)); return; end if;
  return query
    select b.code, b.status, b.seats_count, b.total_mru, t.departs_at, g.name, p.status, b.expires_at
    from bookings b join trips t on t.id=b.trip_id join agencies g on g.id=t.agency_id
    left join payments p on p.booking_id=b.id
    where b.code = upper(p_code) and right(b.phone,4) = p_last4;
end $$;
grant execute on function track_booking to anon, authenticated;

-- حد أقصى 5 حجوزات معلّقة لكل رقم هاتف
create or replace function limit_pending_per_phone() returns trigger language plpgsql as $$
begin
  if (select count(*) from bookings where phone = new.phone and status='pending' and expires_at > now()) >= 5
    then raise exception 'too_many_pending'; end if;
  return new;
end $$;
drop trigger if exists bookings_limit on bookings;
create trigger bookings_limit before insert on bookings for each row execute function limit_pending_per_phone();
