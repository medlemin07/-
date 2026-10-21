import { redirect } from "next/navigation";
import { sb } from "@/lib/server";
import { fmtTime, fmtDate } from "@/lib/supabase";
import { Shell, btn, fld } from "../components";
import { signOut } from "../login/actions";
import { setAgency, setCommission, addCity, addRoute } from "./actions";
const L: any = { pending: "قيد المراجعة", approved: "معتمدة", rejected: "مرفوضة", suspended: "معلّقة" };
const BS: any = { pending: "بانتظار التأكيد", confirmed: "مؤكد", rejected: "مرفوض", cancelled: "ملغى", expired: "منتهي" };
export default async function Admin() {
  const s = sb(); const { data: { user } } = await s.auth.getUser(); if (!user) redirect("/login");
  const { data: p } = await s.from("profiles").select("role").eq("id", user.id).single(); if (p?.role !== "admin") redirect("/");
  const cnt = (t: string) => s.from(t).select("id", { count: "exact", head: true });
  const [{ data: ag }, a, b, c, { data: cities }, { data: routes }, { data: pay }, { data: bk }, { data: ev }] = await Promise.all([
    s.from("agencies").select("id,name,phone,status,is_demo,commission_bp").order("created_at", { ascending: false }),
    cnt("trips"), cnt("bookings"), cnt("agencies"),
    s.from("cities").select("id,name_ar").order("name_ar"),
    s.from("routes").select("id,f:cities!routes_from_city_fkey(name_ar),t:cities!routes_to_city_fkey(name_ar)"),
    s.from("payments").select("amount_mru,bookings(trips(agency_id))").eq("status", "paid"),
    s.from("bookings").select("code,passenger_name,status,total_mru,created_at,trips(departs_at,agencies(name))").order("created_at", { ascending: false }).limit(30),
    s.from("booking_events").select("event,detail,created_at").like("event", "admin:%").order("created_at", { ascending: false }).limit(15)]);
  const paidBy: Record<string, number> = {};
  (pay ?? []).forEach((x: any) => { const id = x.bookings?.trips?.agency_id; if (id) paidBy[id] = (paidBy[id] ?? 0) + x.amount_mru; });
  const total = Object.values(paidBy).reduce((x, y) => x + y, 0);
  const mini = "bg-palm px-3 py-0.5 text-sm text-dune", ghost = "border border-palm/40 px-3 py-0.5 text-sm text-palm", h2 = "mt-10 font-display text-2xl text-palm";
  const act = (id: string, status: string, label: string, cls: string) => <form action={setAgency}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={status} /><button className={cls}>{label}</button></form>;
  return (
    <Shell>
      <div className="flex items-center gap-4"><h1 className="font-display text-4xl text-palm">إدارة المنصة</h1><form action={signOut} className="me-auto"><button className={ghost}>خروج</button></form></div>
      <div className="my-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{[[c.count, "وكالات"], [a.count, "رحلات"], [b.count, "حجوزات"], [total.toLocaleString("en") + " MRU", "مدفوعات مسجلة"]].map(([n, l]) =>
        <div key={l as string} className="bg-dune/40 p-3"><b className="block font-display text-3xl text-palm">{n ?? 0}</b>{l}</div>)}</div>

      <h2 className={h2}>الوكالات والعمولات</h2>
      {(ag ?? []).map((x: any) => { const paid = paidBy[x.id] ?? 0; return (
        <div key={x.id} className="flex flex-wrap items-center gap-3 border-b border-palm/20 py-3">
          <b>{x.name}</b>{x.is_demo && <span className="border px-2 text-sm">تجريبية</span>}<span dir="ltr">{x.phone}</span><span>{L[x.status]}</span>
          <span className="text-sm">مدفوعات {paid.toLocaleString("en")} · عمولة مستحقة {Math.round(paid * x.commission_bp / 10000).toLocaleString("en")} MRU</span>
          <form action={setCommission} className="flex items-center gap-1"><input type="hidden" name="id" value={x.id} />
            <input name="pct" type="number" step="0.1" min={0} max={100} defaultValue={x.commission_bp / 100} className="w-16 border-b border-palm/40 bg-transparent" /><span className="text-sm">%</span><button className={ghost}>حفظ</button></form>
          <span className="me-auto flex gap-2">{x.status !== "approved" && act(x.id, "approved", "اعتماد", mini)}{x.status === "pending" && act(x.id, "rejected", "رفض", ghost)}{x.status === "approved" && act(x.id, "suspended", "تعليق", ghost)}</span>
        </div>); })}
      {!ag?.length && <p className="border-2 border-dashed border-palm/30 p-6 text-center">لا وكالات بعد.</p>}

      <h2 className={h2}>المدن والمسارات</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <form action={addCity} className="space-y-3 bg-dune/40 p-4"><b>إضافة مدينة</b>
          <input name="ar" required placeholder="الاسم بالعربية" className={fld} /><input name="fr" placeholder="الاسم بالفرنسية (اختياري)" className={fld} dir="ltr" /><button className={btn}>إضافة</button></form>
        <form action={addRoute} className="space-y-3 bg-dune/40 p-4"><b>إضافة مسار</b>
          {["from", "to"].map((n) => <select key={n} name={n} required className={fld}><option value="">{n === "from" ? "من" : "إلى"}</option>{(cities ?? []).map((x: any) => <option key={x.id} value={x.id}>{x.name_ar}</option>)}</select>)}
          <button className={btn}>إضافة</button></form>
      </div>
      <p className="mt-3 text-sm">المدن: {(cities ?? []).map((x: any) => x.name_ar).join("، ") || "—"}<br />المسارات ({routes?.length ?? 0}): {(routes ?? []).map((r: any) => `${r.f?.name_ar}←${r.t?.name_ar}`).join("، ") || "—"}</p>

      <h2 className={h2}>آخر الحجوزات</h2>
      {(bk ?? []).map((x: any) => <div key={x.code} className="border-b border-palm/20 py-2 text-sm"><b dir="ltr">{x.code}</b> · {x.passenger_name} · {x.trips?.agencies?.name} · {fmtDate(x.trips?.departs_at)} {fmtTime(x.trips?.departs_at)} · {x.total_mru} MRU · {BS[x.status]}</div>)}
      {!bk?.length && <p className="border-2 border-dashed border-palm/30 p-6 text-center">لا حجوزات بعد.</p>}

      <h2 className={h2}>سجل عمليات الإدارة</h2>
      {(ev ?? []).map((x: any, i: number) => <div key={i} className="border-b border-palm/20 py-1 text-sm"><span dir="ltr">{fmtDate(x.created_at)} {fmtTime(x.created_at)}</span> · {x.event.replace("admin:", "")}</div>)}
      {!ev?.length && <p className="text-sm">لا عمليات مسجلة بعد.</p>}
    </Shell>);
}
