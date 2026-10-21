-- دليل الوكالات العام مع البحث (بالاسم أو بالمدينة) + تسجيل عمليات الإدارة الحساسة
create or replace function list_agencies(p_q text default null)
returns table(id uuid, name text, is_demo boolean, routes jsonb)
language sql stable security definer set search_path=public as $$
  with x as (
    select g.id gid, g.name gname, g.is_demo gdemo, a.name_ar fc, b.name_ar tc, min(t.departs_at) d, min(t.price_mru) p
    from agencies g
    left join trips t on t.agency_id=g.id and t.status='open' and t.departs_at>now()
    left join routes r on r.id=t.route_id
    left join cities a on a.id=r.from_city left join cities b on b.id=r.to_city
    where g.status='approved' and (coalesce(p_q,'')='' or g.name ilike '%'||p_q||'%' or a.name_ar ilike '%'||p_q||'%' or b.name_ar ilike '%'||p_q||'%')
    group by g.id, g.name, g.is_demo, a.name_ar, b.name_ar)
  select gid, gname, gdemo,
         coalesce(jsonb_agg(jsonb_build_object('f',fc,'t',tc,'d',d,'p',p) order by d) filter (where fc is not null), '[]'::jsonb)
  from x group by gid, gname, gdemo order by gname $$;
grant execute on function list_agencies to anon, authenticated;

create policy events_admin_ins on booking_events for insert with check (is_admin());
