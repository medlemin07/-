-- اختبارات منطق الحجز. شغّلها في SQL Editor على مشروع تجريبي؛ تنتهي بـ ROLLBACK فلا تترك بيانات.
begin;
do $$
declare a uuid; r uuid; t uuid; t2 uuid; c1 text; i int;
begin
  insert into agencies(name,status,is_demo) values ('اختبار','approved',true) returning id into a;
  insert into cities(name_ar) values ('اختبار-أ'),('اختبار-ب');
  insert into routes(from_city,to_city) select x.id,y.id from cities x,cities y where x.name_ar='اختبار-أ' and y.name_ar='اختبار-ب' returning id into r;
  insert into trips(agency_id,route_id,departs_at,price_mru,capacity,seat_selection,is_demo) values (a,r,now()+interval '1 day',500,2,true,true) returning id into t;
  insert into trips(agency_id,route_id,departs_at,price_mru,capacity,is_demo) values (a,r,now()+interval '1 day',500,30,true) returning id into t2;

  c1 := create_booking(t,'اختبار','22123456',1,array[1]);

  -- 1) منع حجز المقعد نفسه
  begin perform create_booking(t,'آخر','22123457',1,array[1]); raise exception 'FAIL-1';
  exception when others then if sqlerrm <> 'seat_taken' then raise exception 'اختبار 1 فشل: %', sqlerrm; end if; end;

  -- 2) تجاوز السعة
  perform create_booking(t,'ثالث','22123458',1,array[2]);
  begin perform create_booking(t,'رابع','22123459',1,array[2]); raise exception 'FAIL-2';
  exception when others then if sqlerrm <> 'not_enough_seats' then raise exception 'اختبار 2 فشل: %', sqlerrm; end if; end;

  -- 3) انتهاء المهلة يحرر المقعد
  update bookings set expires_at = now() - interval '1 minute' where code = c1;
  perform expire_holds();
  if (select status from bookings where code = c1) <> 'expired' then raise exception 'اختبار 3 فشل: لم تنتهِ المهلة'; end if;
  perform create_booking(t,'خامس','22123460',1,array[1]);

  -- 4) حد التتبع: 5 محاولات خاطئة ثم الحظر
  for i in 1..5 loop perform * from track_booking(c1,'0000'); end loop;
  begin perform * from track_booking(c1,'0000'); raise exception 'FAIL-4';
  exception when others then if sqlerrm <> 'rate_limited' then raise exception 'اختبار 4 فشل: %', sqlerrm; end if; end;

  -- 5) حد 5 حجوزات معلّقة لكل هاتف
  for i in 1..5 loop perform create_booking(t2,'مكرر','22999999',1); end loop;
  begin perform create_booking(t2,'مكرر','22999999',1); raise exception 'FAIL-5';
  exception when others then if sqlerrm <> 'too_many_pending' then raise exception 'اختبار 5 فشل: %', sqlerrm; end if; end;

  raise notice 'نجحت كل الاختبارات (5/5)';
end $$;
rollback;
