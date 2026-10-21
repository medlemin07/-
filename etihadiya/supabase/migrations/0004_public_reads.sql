-- قراءات عامة آمنة: لا تكشف أي بيانات مسافرين، وتحسب التوافر من الخادم
create or replace function search_trips(p_from text, p_to text, p_date date)
returns table(id uuid, agency text, departs_at timestamptz, arrives_at timestamptz, price_mru int, capacity int,
              seat_selection boolean, amenities text[], available int, is_demo boolean)
language sql stable security definer set search_path=public as $$
  select t.id, g.name, t.departs_at, t.arrives_at, t.price_mru, t.capacity, t.seat_selection, t.amenities,
         greatest(t.capacity - seats_taken(t.id), 0), g.is_demo
  from trips t join agencies g on g.id=t.agency_id join routes r on r.id=t.route_id
  join cities a on a.id=r.from_city join cities b on b.id=r.to_city
  where a.name_ar=p_from and b.name_ar=p_to and t.status='open' and g.status='approved'
    and t.departs_at > now() and t.departs_at::date = p_date
  order by t.departs_at $$;

create or replace function get_trip(p_id uuid)
returns table(id uuid, agency text, from_city text, to_city text, departs_at timestamptz, arrives_at timestamptz,
              price_mru int, capacity int, seat_selection boolean, amenities text[], available int, is_demo boolean, taken int[])
language sql stable security definer set search_path=public as $$
  select t.id, g.name, a.name_ar, b.name_ar, t.departs_at, t.arrives_at, t.price_mru, t.capacity, t.seat_selection,
         t.amenities, greatest(t.capacity - seats_taken(t.id), 0), g.is_demo,
         coalesce((select array_agg(s.seat_no) from booking_seats s join bookings k on k.id=s.booking_id
                   where s.trip_id=t.id and s.active and (k.status='confirmed' or k.expires_at > now())), '{}')
  from trips t join agencies g on g.id=t.agency_id join routes r on r.id=t.route_id
  join cities a on a.id=r.from_city join cities b on b.id=r.to_city
  where t.id=p_id and t.status='open' and g.status='approved' and t.departs_at > now() $$;
grant execute on function search_trips, get_trip to anon, authenticated;
