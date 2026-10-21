-- بيانات تجريبية فقط (is_demo = true) — لا تُشغَّل في الإنتاج
insert into cities(name_ar,name_fr) values ('نواكشوط','Nouakchott'),('نواذيبو','Nouadhibou'),('روصو','Rosso'),('أطار','Atar'),('كيفه','Kiffa'),('النعمة','Néma') on conflict do nothing;
insert into routes(from_city,to_city) select a.id,b.id from cities a, cities b where a.name_fr='Nouakchott' and b.name_fr in ('Nouadhibou','Rosso','Atar','Kiffa','Néma') on conflict do nothing;
insert into agencies(name,status,is_demo) values ('وكالة تجريبية 1','approved',true),('وكالة تجريبية 2','approved',true);
insert into trips(agency_id,route_id,departs_at,price_mru,capacity,seat_selection,amenities,is_demo)
select g.id,r.id, date_trunc('day',now())+interval '1 day'+interval '7 hours', 600+(random()*400)::int, 30, g.name like '%1', '{مكيّف,حقائب}', true
from agencies g cross join routes r where g.is_demo;
