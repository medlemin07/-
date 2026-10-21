import { redirect } from "next/navigation";
import { sb } from "@/lib/server";
import { fmtTime, fmtDate } from "@/lib/supabase";
import { Shell, btn, fld } from "../components";
import { signOut } from "../login/actions";
import { createTrip, tripOp, bookingOp } from "./actions";
const ST: any = { pending: "بانتظار التأكيد", confirmed: "مؤكد", rejected: "مرفوض", cancelled: "ملغى", expired: "منتهي" };
const RT = "routes(f:cities!routes_from_city_fkey(name_ar),t:cities!routes_to_city_fkey(name_ar))";
export default async function Agency({ searchParams }: { searchParams: { q?: string } }) {
  const s = sb(); const { data: { user } } = await s.auth.getUser(); if (!user) redirect("/login");
  const { data: st } = await s.from("agency_staff").select("agencies(id,name,status)").eq("user_id", user.id).limit(1).maybeSingle();
  const ag: any = st?.agencies;
  if (!ag) return <Shell><p className="py-16 text-center">هذا الحساب غير مرتبط بوكالة.</p></Shell>;
  if (ag.status !== "approved") return <Shell><p className="py-16 text-center text-xl">حالة وكالتك «{ag.status === "pending" ? "قيد المراجعة" : ag.status}». سنفعّل اللوحة عند اعتمادها من إدارة المنصة.</p></Shell>;
  const [{ data: routes }, { data: trips }, { data: bk }] = await Promise.all([
    s.from("routes").select("id,f:cities!routes_from_city_fkey(name_ar),t:cities!routes_to_city_fkey(name_ar)"),
    s.from("trips").select(`id,departs_at,price_mru,capacity,status,${RT}`).eq("agency_id", ag.id).order("departs_at", { ascending: false }).limit(50),
    s.from("bookings").select(`id,code,passenger_name,phone,seats_count,total_mru,status,expires_at,trips!inner(departs_at,agency_id,${RT}),payments(status,amount_mru)`).eq("trips.agency_id", ag.id).order("created_at", { ascending: false }).limit(100)]);
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const list: any[] = (bk ?? []).filter((b: any) => !q || b.code.toLowerCase().includes(q) || b.phone.includes(q));
  const today = new Date().toISOString().slice(0, 10), all: any[] = bk ?? [];
  const paid = all.reduce((x, b) => x + (b.payments?.some((p: any) => p.status === "paid") ? b.total_mru : 0), 0);
  const stat = (n: any, l: string) => <div className="bg-dune/40 p-3"><b className="block font-display text-3xl text-palm">{n}</b>{l}</div>;
  const nm = (r: any) => `${r?.f?.name_ar} ← ${r?.t?.name_ar}`;
  const mini = "bg-palm px-3 py-0.5 text-sm text-dune", ghost = "border border-palm/40 px-3 py-0.5 text-sm text-palm";
  return (
    <Shell>
      <div className="flex items-center gap-4"><h1 className="font-display text-4xl text-palm">لوحة {ag.name}</h1><form action={signOut} className="me-auto"><button className={ghost}>خروج</button></form></div>
      <div className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stat((trips ?? []).filter((t: any) => t.departs_at.slice(0, 10) === today).length, "رحلات اليوم")}
        {stat(all.filter((b) => b.status === "pending").length, "حجوزات جديدة")}
        {stat(all.filter((b) => b.status === "confirmed").length, "مؤكدة")}
        {stat(paid.toLocaleString("en") + " MRU", "مدفوعات نقدية مسجلة")}
      </div>
      <h2 className="mt-8 font-display text-2xl text-palm">رحلة جديدة</h2>
      <form action={createTrip} className="mt-3 grid gap-4 bg-dune/40 p-5 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="text-sm">المسار</span><select name="route" required className={fld}>{(routes ?? []).map((r: any) => <option key={r.id} value={r.id}>{nm({ f: r.f, t: r.t })}</option>)}</select></label>
        <label><span className="text-sm">الانطلاق</span><input type="datetime-local" name="dep" required className={fld} /></label>
        <label><span className="text-sm">الوصول المتوقع (اختياري)</span><input type="datetime-local" name="arr" className={fld} /></label>
        <label><span className="text-sm">السعر MRU</span><input type="number" name="price" min={1} required className={fld} /></label>
        <label><span className="text-sm">عدد المقاعد</span><input type="number" name="cap" min={1} max={80} defaultValue={30} required className={fld} /></label>
        <label><span className="text-sm">الخدمات (افصل بـ «،»)</span><input name="am" className={fld} /></label>
        <label className="flex items-end gap-2"><input type="checkbox" name="sel" /> السماح باختيار رقم المقعد</label>
        <button className={btn}>إضافة الرحلة</button>
      </form>
      <h2 className="mt-10 font-display text-2xl text-palm">رحلاتي</h2>
      {(trips ?? []).map((t: any) => (
        <div key={t.id} className="flex flex-wrap items-center gap-3 border-b border-palm/20 py-3">
          <b className="font-display text-xl text-palm">{fmtTime(t.departs_at)}</b><span>{fmtDate(t.departs_at)} · {nm(t.routes)} · {t.price_mru} MRU · {t.capacity} مقعدًا · {t.status}</span>
          <span className="me-auto flex gap-2">
            {["open", "closed"].includes(t.status) && new Date(t.departs_at) > new Date() && <>
              <form action={tripOp}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="op" value={t.status === "open" ? "close" : "open"} /><button className={ghost}>{t.status === "open" ? "إيقاف الحجز" : "إعادة الفتح"}</button></form>
              <form action={tripOp}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="op" value="cancel" /><button className={ghost}>إلغاء الرحلة</button></form></>}
            <a href={`/agency/export/${t.id}`} className={mini}>تصدير المسافرين CSV</a></span>
        </div>))}
      {!trips?.length && <p className="mt-3 border-2 border-dashed border-palm/30 p-6 text-center">لا رحلات بعد. أضف أول رحلة من النموذج أعلاه.</p>}
      <h2 className="mt-10 font-display text-2xl text-palm">الحجوزات</h2>
      <form className="mt-2 max-w-sm"><input name="q" defaultValue={searchParams.q} placeholder="بحث برقم الحجز أو الهاتف" className={fld} /></form>
      {list.map((b) => { const paidB = b.payments?.some((p: any) => p.status === "paid"), f = (op: string, label: string, cls: string, reason = false) =>
        <form action={bookingOp} className="inline-flex gap-1"><input type="hidden" name="id" value={b.id} /><input type="hidden" name="op" value={op} />{reason && <input name="reason" placeholder="السبب" required className="w-24 border-b border-palm/40 bg-transparent text-sm" />}<button className={cls}>{label}</button></form>;
        return <div key={b.id} className="border-b border-palm/20 py-3">
          <b dir="ltr" className="font-display text-lg text-palm">{b.code}</b> · {b.passenger_name} · <span dir="ltr">{b.phone}</span><br />
          <span className="text-sm">{nm(b.trips.routes)} {fmtTime(b.trips.departs_at)} · {b.seats_count} مقعد · {b.total_mru} MRU · <b>{ST[b.status]}</b> · {paidB ? "مدفوع نقدًا" : "غير مدفوع"}</span><br />
          <span className="flex flex-wrap gap-2 pt-1">{b.status === "pending" && <>{f("confirmed", "تأكيد", mini)}{f("rejected", "رفض", ghost, true)}</>}
            {b.status === "confirmed" && <>{!paidB && f("cash", "تسجيل استلام المبلغ نقدًا", mini)}{f("cancelled", "إلغاء", ghost, true)}</>}</span></div>; })}
      {!list.length && <p className="mt-3 border-2 border-dashed border-palm/30 p-6 text-center">لا توجد حجوزات مطابقة.</p>}
    </Shell>);
}
