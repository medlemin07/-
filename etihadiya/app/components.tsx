import Link from "next/link";
export const Shell = ({ children, demo }: { children: React.ReactNode; demo?: boolean }) => (
  <div className="min-h-screen bg-paper">
    {demo && <div className="bg-gold py-1.5 text-center text-sm">وضع العرض: بيانات تجريبية وليست حقيقية</div>}
    <header className="mx-auto flex max-w-4xl items-center gap-6 px-6 py-5">
      <Link href="/" className="flex items-center gap-3 font-display text-2xl text-palm"><img src="/logo.png" alt="" width={44} height={44} className="rounded-full" />الإتحادية للنقل العمومي</Link>
      <Link href="/agencies" className="text-palm">الوكالات</Link><Link href="/track" className="me-auto text-palm">تتبع حجزي</Link><Link href="/login" className="text-palm">دخول</Link>
    </header>
    <main className="mx-auto max-w-4xl px-6 pb-20">{children}</main>
    <footer className="mx-auto flex max-w-4xl flex-wrap gap-5 px-6 pb-10 text-sm text-palm">{[["terms","الشروط والأحكام"],["privacy","سياسة الخصوصية"],["cancellation","الإلغاء والاسترداد"],["contact","تواصل معنا"]].map(([s,l])=><Link key={s} href={`/legal/${s}`}>{l}</Link>)}</footer>
  </div>);
export const btn = "bg-gold px-6 py-3 font-display text-lg text-asphalt active:translate-y-px";
export const fld = "w-full border-b-2 border-palm/30 bg-transparent py-2 text-lg outline-none focus:border-gold";
