import { db, fmtTime, fmtDate } from "@/lib/supabase";
import { Shell, btn, fld } from "../components";
const ST: Record<string, string> = { pending: "بانتظار تأكيد الوكالة", confirmed: "مؤكد", rejected: "مرفوض", cancelled: "ملغى", expired: "انتهت مهلة الحجز" };
const PS: Record<string, string> = { unpaid: "غير مدفوع (يُدفع في الوكالة)", paid: "مدفوع", failed: "فشل", refunded: "مُسترد" };
export default async function Track({ searchParams }: { searchParams: { code?: string; last4?: string; new?: string } }) {
  const { code, last4 } = searchParams;
  let r: any = null;
  let lim = false;
  if (code && last4) { const res = await db().rpc("track_booking", { p_code: code, p_last4: last4 }); lim = !!res.error?.message?.includes("rate_limited"); r = res.data?.[0]; }
  return (
    <Shell>
      <h1 className="font-display text-4xl text-palm">تتبع حجزك</h1>
      <form className="mt-6 grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label><span className="text-sm">رقم الحجز</span><input name="code" defaultValue={code} required className={fld} dir="ltr" /></label>
        <label><span className="text-sm">آخر 4 أرقام من الهاتف</span><input name="last4" defaultValue={last4} required pattern="[0-9]{4}" maxLength={4} className={fld} dir="ltr" /></label>
        <button className={btn}>عرض</button>
      </form>
      {code && last4 && !r && <p role="alert" className="mt-8 border-2 border-dashed border-palm/30 p-6 text-center">{lim ? "محاولات كثيرة. انتظر 15 دقيقة ثم حاول مجددًا." : "لم نجد حجزًا بهذه البيانات. تحقق منها وحاول مجددًا."}</p>}
      {r && <div className="mt-8 bg-dune/40 p-6">
        {searchParams.new && <p className="mb-3 font-bold text-palm">تم استلام طلبك. احتفظ برقم الحجز.</p>}
        <p className="font-display text-3xl text-palm" dir="ltr">{r.code}</p>
        <dl className="mt-4 space-y-1"><div>الحالة: <b>{ST[r.status]}</b></div><div>الوكالة: {r.agency}</div>
          <div>الانطلاق: {fmtDate(r.departs_at)} {fmtTime(r.departs_at)}</div><div>المقاعد: {r.seats_count} · المبلغ: {r.total_mru.toLocaleString("en")} MRU</div>
          <div>الدفع: {PS[r.pay_status] ?? "—"}</div>
          {r.status === "pending" && r.expires_at && <div>يُحرَّر المقعد تلقائيًا إن لم تؤكده الوكالة قبل {fmtTime(r.expires_at)}.</div>}</dl>
        <p className="mt-4 text-sm">للحضور: توجّه إلى مقر الوكالة قبل موعد الانطلاق بوقت كافٍ وأحضر رقم الحجز.</p></div>}
    </Shell>);
}
