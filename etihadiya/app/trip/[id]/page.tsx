import { db, fmtTime, fmtDate, ERR } from "@/lib/supabase";
import { Shell, btn, fld } from "../../components";
import { book } from "./actions";
export default async function Trip({ params, searchParams }: { params: { id: string }; searchParams: { seats?: string; e?: string } }) {
  const { data } = await db().rpc("get_trip", { p_id: params.id }).maybeSingle();
  const t: any = data;
  if (!t) return <Shell><p className="py-16 text-center text-xl">هذه الرحلة لم تعد متاحة.</p></Shell>;
  const n = Math.min(8, Math.max(1, +(searchParams.seats ?? 1) || 1));
  const e = searchParams.e && (searchParams.e === "terms" ? "يلزم الموافقة على الشروط." : ERR[searchParams.e.replace(/^.*?([a-z_]+)$/, "$1")] ?? "تعذر إتمام الحجز.");
  return (
    <Shell demo={t.is_demo}>
      <h1 className="font-display text-4xl text-palm">{t.from_city} ← {t.to_city}</h1>
      <p className="mt-2 text-asphalt/75">{t.agency} · {fmtDate(t.departs_at)} · الانطلاق {fmtTime(t.departs_at)}{t.arrives_at ? ` · الوصول المتوقع ${fmtTime(t.arrives_at)}` : ""}</p>
      <p className="mt-1 text-asphalt/75">سياسة الإلغاء: يمكن إلغاء الحجز قبل تأكيد الوكالة له، وبعده بالتواصل مع الوكالة.</p>
      <form action={book} className="mt-8 space-y-6 bg-dune/40 p-6">
        <input type="hidden" name="id" value={t.id} /><input type="hidden" name="seats" value={n} />
        {t.seat_selection && <fieldset><legend className="mb-2 font-bold">اختر {n} مقعد/مقاعد</legend>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">{Array.from({ length: t.capacity }, (_, i) => i + 1).map((s) => {
            const taken = t.taken.includes(s);
            return <label key={s} className={`py-2 text-center ${taken ? "bg-asphalt/10 text-asphalt/30 line-through" : "cursor-pointer bg-paper has-[:checked]:bg-palm has-[:checked]:text-dune"}`}>
              <input type="checkbox" name="seat" value={s} disabled={taken} className="sr-only" />{s}</label>; })}</div></fieldset>}
        <label className="block"><span className="text-sm">الاسم</span><input name="name" required minLength={2} className={fld} /></label>
        <label className="block"><span className="text-sm">رقم الهاتف</span><input name="phone" type="tel" required pattern="[0-9+ ]{8,15}" className={fld} dir="ltr" /></label>
        <div className="bg-paper p-4"><b>طريقة الدفع: في مقر الوكالة.</b> لم يُدفع أي مبلغ إلكترونيًا، والدفع الإلكتروني غير متاح حاليًا.
          <div className="mt-2 font-display text-2xl text-palm">المبلغ: {(t.price_mru * n).toLocaleString("en")} MRU{t.seat_selection ? " (حسب عدد المقاعد المختارة)" : ` · ${n} مسافر`}</div></div>
        <label className="flex gap-2"><input type="checkbox" name="terms" /> أوافق على شروط الحجز وسياسة الإلغاء</label>
        {e && <p role="alert" className="text-red-700">{e}</p>}
        <button className={btn}>تأكيد طلب الحجز</button>
      </form>
    </Shell>);
}
