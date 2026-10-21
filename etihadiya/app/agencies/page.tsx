import Link from "next/link";
import { db, fmtTime, fmtDate } from "@/lib/supabase";
import { Shell, btn, fld } from "../components";
export default async function Agencies({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim().slice(0, 40);
  const { data, error } = await db().rpc("list_agencies", { p_q: q });
  const list: any[] = data ?? [];
  return (
    <Shell demo={list.some((a) => a.is_demo)}>
      <h1 className="font-display text-4xl text-palm">الوكالات المعتمدة</h1>
      <form className="my-6 flex items-end gap-4"><label className="flex-1"><span className="text-sm">ابحث باسم الوكالة أو المدينة</span><input name="q" defaultValue={q} placeholder="مثال: روصو" className={fld} /></label><button className={btn}>بحث</button></form>
      {error && <p className="border-2 border-dashed border-palm/30 p-6 text-center">تعذر تحميل الوكالات الآن. حاول مجددًا بعد قليل.</p>}
      {!error && !list.length && <p className="border-2 border-dashed border-palm/30 p-8 text-center">لا توجد وكالات مطابقة{q ? ` لـ «${q}»` : ""}.</p>}
      {list.map((a) => (
        <div key={a.id} className="border-b border-palm/20 py-5">
          <b className="font-display text-2xl text-palm">{a.name}</b>{a.is_demo && <span className="ms-2 border px-2 text-sm">تجريبية</span>}
          {a.routes.length ? <div className="mt-3 flex flex-wrap gap-2">{a.routes.map((r: any) => (
            <Link key={r.f + r.t} className="bg-palm px-3 py-1 text-sm text-dune" href={`/search?${new URLSearchParams({ from: r.f, to: r.t, date: r.d.slice(0, 10), seats: "1" })}`}>
              {r.f} ← {r.t} · أقرب رحلة {fmtDate(r.d)} {fmtTime(r.d)} · من {r.p} MRU</Link>))}</div>
            : <p className="mt-2 text-sm text-asphalt/70">لا رحلات قادمة حاليًا.</p>}
        </div>))}
    </Shell>);
}
