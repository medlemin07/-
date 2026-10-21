-- منطق الحجز على الخادم: قفل الرحلة، التحقق من السعة، انتهاء المهلة
create or replace function is_admin() returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from profiles where id = auth.uid() and role = 'admin') $$;
create or replace function is_staff_of(a uuid) returns boolean language sql stable security definer set search_path=public as
$$ select exists(select 1 from agency_staff s join agencies g on g.id=s.agency_id
   where s.agency_id=a and s.user_id=auth.uid() and g.status='approved') $$;

create or replace function expire_holds() returns int language plpgsql security definer set search_path=public as $$
declare n int;
begin
  with e as (update bookings set status='expired', updated_at=now()
             where status='pending' and expires_at < now() returning id)
  update booking_seats set active=false where booking_id in (select id from e);
  get diagnostics n = row_count;
  insert into booking_events(booking_id,event) select id,'expired' from bookings
    where status='expired' and updated_at >= now() - interval '1 second';
  return n;
end $$;

create or replace function seats_taken(t uuid) returns int language sql stable security definer set search_path=public as
$$ select coalesce(sum(seats_count),0)::int from bookings
   where trip_id=t and (status='confirmed' or (status='pending' and expires_at > now())) $$;

create or replace function create_booking(p_trip uuid, p_name text, p_phone text, p_seats int, p_seat_nos int[] default null)
returns text language plpgsql security definer set search_path=public as $$
declare t trips; b uuid; c text; i int;
begin
  if length(trim(p_name)) < 2 or p_phone !~ '^[0-9+ ]{8,15}$' then raise exception 'invalid_input'; end if;
  perform expire_holds();
  select * into t from trips where id=p_trip for update;            -- قفل الرحلة
  if not found or t.status <> 'open' or t.departs_at <= now()
     or not exists(select 1 from agencies where id=t.agency_id and status='approved')
    then raise exception 'trip_unavailable'; end if;
  if p_seats < 1 or p_seats > 8 or seats_taken(t.id) + p_seats > t.capacity then raise exception 'not_enough_seats'; end if;
  if t.seat_selection and (p_seat_nos is null or cardinality(p_seat_nos) <> p_seats) then raise exception 'seat_numbers_required'; end if;
  loop
    c := upper(translate(encode(gen_random_bytes(5),'base64'),'+/=OIl01','XYZABCD'));
    c := substr(c,1,8);
    exit when not exists(select 1 from bookings where code=c);
  end loop;
  insert into bookings(code,trip_id,user_id,passenger_name,phone,seats_count,total_mru,expires_at)
  values (c,t.id,auth.uid(),trim(p_name),p_phone,p_seats,p_seats*t.price_mru, least(now()+make_interval(mins=>t.hold_minutes), t.departs_at))
  returning id into b;
  if t.seat_selection then
    foreach i in array p_seat_nos loop
      if i < 1 or i > t.capacity then raise exception 'invalid_seat'; end if;
      insert into booking_seats(booking_id,trip_id,seat_no) values (b,t.id,i);  -- يفشل عند التكرار بفضل الفهرس الفريد
    end loop;
  end if;
  insert into payments(booking_id,method,amount_mru) values (b,'cash_agency',p_seats*t.price_mru);
  insert into booking_events(booking_id,actor,event) values (b,auth.uid(),'created');
  return c;
exception when unique_violation then raise exception 'seat_taken';
end $$;

create or replace function set_booking_status(p_booking uuid, p_to booking_status, p_reason text default null)
returns void language plpgsql security definer set search_path=public as $$
declare b bookings; a uuid;
begin
  select * into b from bookings where id=p_booking for update;
  select agency_id into a from trips where id=b.trip_id;
  if not (is_admin() or is_staff_of(a)) then raise exception 'forbidden'; end if;
  if (b.status,p_to) not in (('pending','confirmed'),('pending','rejected'),('pending','cancelled'),('confirmed','cancelled'))
    then raise exception 'invalid_transition'; end if;
  if p_to='confirmed' and b.expires_at < now() then raise exception 'hold_expired'; end if;
  update bookings set status=p_to, reason=p_reason, updated_at=now() where id=b.id;
  if p_to in ('rejected','cancelled') then update booking_seats set active=false where booking_id=b.id; end if;
  insert into booking_events(booking_id,actor,event,detail) values (b.id,auth.uid(),p_to::text,jsonb_build_object('reason',p_reason));
end $$;

create or replace function record_cash_payment(p_booking uuid) returns void language plpgsql security definer set search_path=public as $$
declare b bookings; a uuid;
begin
  select * into b from bookings where id=p_booking for update;
  select agency_id into a from trips where id=b.trip_id;
  if not (is_admin() or is_staff_of(a)) then raise exception 'forbidden'; end if;
  if b.status <> 'confirmed' then raise exception 'booking_not_confirmed'; end if;
  update payments set status='paid', recorded_by=auth.uid() where booking_id=b.id and method='cash_agency' and status='unpaid';
  insert into booking_events(booking_id,actor,event) values (b.id,auth.uid(),'cash_recorded');
end $$;

-- تتبع الحجز للضيف: رقم الحجز + آخر 4 أرقام من الهاتف، ولا تُعاد بيانات حساسة
create or replace function track_booking(p_code text, p_last4 text)
returns table(code text, status booking_status, seats_count int, total_mru int, departs_at timestamptz, agency text, pay_status payment_status, expires_at timestamptz)
language sql security definer set search_path=public as $$
  select b.code,b.status,b.seats_count,b.total_mru,t.departs_at,g.name,p.status,b.expires_at
  from bookings b join trips t on t.id=b.trip_id join agencies g on g.id=t.agency_id
  left join payments p on p.booking_id=b.id
  where b.code=upper(p_code) and right(b.phone,4)=p_last4 $$;
revoke all on function expire_holds, seats_taken, set_booking_status, record_cash_payment from public;
grant execute on function create_booking, track_booking to anon, authenticated;
grant execute on function set_booking_status, record_cash_payment to authenticated;
-- كل ساعة/دقائق: select cron.schedule('expire-holds','*/5 * * * *','select expire_holds()');
