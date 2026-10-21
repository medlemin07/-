import Link from "next/link";
import { db, fmtTime, fmtDate } from "@/lib/supabase";
import { Shell } from "../components";
type SP = { from?: string; to?: string; date?: string; seats?: string; sort?: string };
export default async function Search({ searchParams }: { searchParams: SP }) {
  const { from = "", to = "", date = "", seats = "1", sort = "time" } = searchParams;
  const { data, error } = await db().rpc("search_trips", { p_from: from, p_to: to, p_date: date });
  const n = Math.min(8, Math.max(1, +seats || 1));
  const rows = [...(data ?? [])].sort((a: any, b: any) => sort === "price" ? a.price_mru - b.price_mru : a.departs_at.localeCompare(b.departs_at));
  const q = (s: string) => `/search?${new URLSearchParams({ from, to, date, seats, sort: s })}`;
  return (
    <Shell demo={rows.some((r: any) => r.is_demo)}>
      <h1 className="font-display text-4xl text-palm">من {from} إلى {to}</h1>
      <p className="mt-1 text-asphalt/70">{date && fmtDate(date)} · {n} مسافر</p>
      <div className="my-6 flex gap-5 text-palm"><Link href={q("time")} className={sort === "time" ? "font-bold underline" : ""}>أقرب موعد</Link><Link href={q("price")} className={sort === "price" ? "font-bold underline" : ""}>الأقل سعرًا</Link></div>
      {error && <p className="border-2 border-dashed border-palm/30 p-6 text-center">تعذر تحميل الرحلات الآن. حاول مجددًا بعد قليل.</p>}
      {!error && !rows.length && <p className="border-2 border-dashed border-palm/30 p-8 text-center">لا توجد رحلات مطابقة. جرّب تاريخًا آخر أو مسارًا مختلفًا.</p>}
      {rows.map((t: any) => (
        <div key={t.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-6 border-b border-palm/20 py-5">
          <div className="font-display text-3xl text-palm">{fmtTime(t.departs_at)}<small className="block font-body text-sm text-asphalt/60">{t.arrives_at ? `الوصول ${fmtTime(t.arrives_at)}` : "وقت الوصول غير محدد"}</small></div>
          <div><b>{t.agency}</b><div className="text-sm text-asphalt/70">{t.available >= n ? `${t.available} مقعد متاح` : "لا تكفي المقاعد"}{t.amenities?.length ? ` · ${t.amenities.join("، ")}` : ""}</div></div>
          <div className="text-end"><div className="font-display text-2xl text-palm">{(t.price_mru * n).toLocaleString("en")} MRU</div>
            {t.available >= n && <Link href={`/trip/${t.id}?seats=${n}`} className="mt-1 inline-block bg-palm px-4 py-1.5 text-dune">عرض الرحلة والحجز</Link>}</div>
        </div>))}
    </Shell>);
}
