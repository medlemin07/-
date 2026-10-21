// اختبار التزامن: 15 طلبًا متوازيًا لحجز المقعد 1 نفسه؛ يجب أن ينجح طلب واحد فقط.
// التشغيل: SUPABASE_URL=... SUPABASE_ANON_KEY=... TRIP_ID=<رحلة بخاصية اختيار المقعد> node tests/concurrency.mjs
const { SUPABASE_URL: u, SUPABASE_ANON_KEY: k, TRIP_ID: t } = process.env;
if (!u || !k || !t) { console.error("اضبط SUPABASE_URL وSUPABASE_ANON_KEY وTRIP_ID"); process.exit(1); }
const one = (i) => fetch(`${u}/rest/v1/rpc/create_booking`, { method: "POST", headers: { apikey: k, ...(k.startsWith("eyJ") ? { Authorization: `Bearer ${k}` } : {}), "Content-Type": "application/json" },
  body: JSON.stringify({ p_trip: t, p_name: "اختبار تزامن", p_phone: `2290${String(i).padStart(4, "0")}`, p_seats: 1, p_seat_nos: [1] }) }).then((r) => r.ok);
const res = await Promise.all(Array.from({ length: 15 }, (_, i) => one(i)));
const ok = res.filter(Boolean).length;
console.log(ok === 1 ? "نجح الاختبار: حجز واحد فقط" : `فشل الاختبار: نجح ${ok} حجزًا`);
console.log("نظّف الحجوزات التجريبية لاحقًا (اسم: اختبار تزامن).");
process.exit(ok === 1 ? 0 : 1);
