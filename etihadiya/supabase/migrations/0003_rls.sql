alter table profiles enable row level security;  alter table agencies enable row level security;
alter table agency_staff enable row level security; alter table cities enable row level security;
alter table routes enable row level security; alter table trips enable row level security;
alter table bookings enable row level security; alter table booking_seats enable row level security;
alter table payments enable row level security; alter table booking_events enable row level security;

-- لا يمكن لأي مستخدم تعديل دوره: صلاحية التعديل على عمود role محجوبة
revoke update on profiles from authenticated, anon;
grant update (full_name, phone) on profiles to authenticated;
create policy profiles_self on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_self_upd on profiles for update using (id = auth.uid());

create policy cities_pub on cities for select using (true);
create policy routes_pub on routes for select using (true);
create policy cities_adm on cities for all using (is_admin()) with check (is_admin());
create policy routes_adm on routes for all using (is_admin()) with check (is_admin());

create policy agencies_pub on agencies for select using (status='approved' or is_admin() or is_staff_of(id));
create policy agencies_adm on agencies for all using (is_admin()) with check (is_admin());
create policy staff_self on agency_staff for select using (user_id=auth.uid() or is_admin());

create policy trips_pub on trips for select using (
  (status='open' and departs_at > now() and exists(select 1 from agencies g where g.id=agency_id and g.status='approved'))
  or is_staff_of(agency_id) or is_admin());
create policy trips_staff_w on trips for insert with check (is_staff_of(agency_id));
create policy trips_staff_u on trips for update using (is_staff_of(agency_id) and departs_at > now()) with check (is_staff_of(agency_id));

-- الحجوزات: لا إدراج مباشر (عبر create_booking فقط)
create policy bookings_read on bookings for select using (
  user_id = auth.uid() or is_admin() or is_staff_of((select agency_id from trips where id=trip_id)));
create policy seats_read on booking_seats for select using (true);  -- أرقام المقاعد المحجوزة فقط، بلا بيانات شخصية
create policy payments_read on payments for select using (
  is_admin() or is_staff_of((select t.agency_id from bookings b join trips t on t.id=b.trip_id where b.id=booking_id)));
create policy events_read on booking_events for select using (is_admin());
