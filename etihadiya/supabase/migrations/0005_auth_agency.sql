-- إنشاء الملف الشخصي تلقائيًا؛ وطلب الوكالة يبقى «pending» حتى يعتمده المسؤول. لا يمكن لهذا المسار منح دور admin.
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare a uuid; n text := nullif(trim(new.raw_user_meta_data->>'agency_name'),'');
begin
  insert into profiles(id,full_name,phone,role) values (new.id, left(new.raw_user_meta_data->>'full_name',80), left(new.raw_user_meta_data->>'phone',20),
    case when n is null then 'traveler' else 'agency_staff' end);
  if n is not null then
    insert into agencies(name,phone) values (left(n,80), left(new.raw_user_meta_data->>'phone',20)) returning id into a;
    insert into agency_staff(agency_id,user_id) values (a,new.id);
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create or replace function cancel_trip(p_trip uuid, p_reason text default 'ألغت الوكالة الرحلة') returns void
language plpgsql security definer set search_path=public as $$
declare a uuid;
begin
  select agency_id into a from trips where id=p_trip for update;
  if not (is_admin() or is_staff_of(a)) then raise exception 'forbidden'; end if;
  update trips set status='cancelled', updated_at=now() where id=p_trip and status in ('open','closed');
  update booking_seats set active=false where trip_id=p_trip;
  insert into booking_events(booking_id,actor,event,detail)
    select id,auth.uid(),'cancelled',jsonb_build_object('reason',p_reason) from bookings where trip_id=p_trip and status in ('pending','confirmed');
  update bookings set status='cancelled', reason=p_reason, updated_at=now() where trip_id=p_trip and status in ('pending','confirmed');
end $$;
grant execute on function cancel_trip to authenticated;
