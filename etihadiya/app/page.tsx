// يجلب المدن من Supabase إن كانت متغيرات البيئة مضبوطة، وإلا يعرض حقل نص حر.
import { createClient } from "@supabase/supabase-js";
async function cities(): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  const { data } = await createClient(url, key).from("cities").select("name_ar").order("name_ar");
  return (data ?? []).map((c) => c.name_ar);
}
const field = "w-full bg-transparent border-b-2 border-palm/30 py-2 text-lg focus:border-gold outline-none";
export default async function Home() {
  const list = await cities();
  const today = new Date().toISOString().slice(0, 10);
  const City = ({ name, label }: { name: string; label: string }) => (
    <label className="block"><span className="text-sm text-palm/70">{label}</span>
      {list.length ? <select name={name} required className={field}><option value="">اختر المدينة</option>{list.map((c) => <option key={c}>{c}</option>)}</select>
        : <input name={name} required className={field} placeholder="اكتب اسم المدينة" />}
    </label>);
  return (
    <main className="dune grain relative min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-6">
        <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden><rect x="4" y="9" width="32" height="20" rx="5" fill="#0E3B2C"/><rect x="8" y="13" width="9" height="7" rx="1.5" fill="#E9D8B0"/><rect x="19" y="13" width="9" height="7" rx="1.5" fill="#E9D8B0"/><circle cx="12" cy="31" r="3.5" fill="#C99A2E"/><circle cx="28" cy="31" r="3.5" fill="#C99A2E"/></svg>
        <span className="font-display text-2xl text-palm">الإتحادية للنقل العمومي</span>
        <nav className="me-auto flex gap-6 text-palm"><a href="/agencies">الوكالات</a><a href="/track">تتبع حجزي</a><a href="/login">دخول الوكالات</a></nav>
      </header>
      <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-24 pt-10 md:grid-cols-[1.1fr_1fr] md:pt-20">
        <div>
          <h1 className="font-display text-5xl leading-[1.25] text-palm md:text-7xl">رحلتك القادمة<br/>تبدأ من هنا</h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-asphalt/80">قارن أسعار الوكالات المعتمدة بين المدن الموريتانية، واحجز مقعدك قبل أن تصل إلى المحطة.</p>
          <div className="road mt-10 w-48 rounded-full" aria-hidden />
        </div>
        <form action="/search" className="issue ticket relative bg-paper shadow-[0_30px_60px_-25px_rgba(14,59,44,.55)] md:-rotate-1">
          <div className="bg-palm px-7 py-4 font-display text-xl text-dune">تذكرة سفر</div>
          <div className="space-y-6 px-7 py-7">
            <City name="from" label="مدينة الانطلاق" /><City name="to" label="مدينة الوصول" />
            <div className="grid grid-cols-2 gap-6">
              <label className="block"><span className="text-sm text-palm/70">تاريخ السفر</span><input type="date" name="date" min={today} defaultValue={today} required className={field} /></label>
              <label className="block"><span className="text-sm text-palm/70">عدد المسافرين</span><input type="number" name="seats" min={1} max={8} defaultValue={1} className={field} /></label>
            </div>
          </div>
          <div className="mx-5 border-t-2 border-dashed border-palm/30" />
          <div className="px-7 py-5"><button className="w-full rounded-sm bg-gold py-3 font-display text-xl text-asphalt transition active:translate-y-px">ابحث عن رحلة</button></div>
        </form>
      </section>
    </main>);
}
