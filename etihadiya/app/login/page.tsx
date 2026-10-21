import { Shell, btn, fld } from "../components";
import { signIn, signUp } from "./actions";
const M: Record<string, string> = { login: "بيانات الدخول غير صحيحة.", signup: "تعذر إنشاء الحساب. تحقق من البيانات (كلمة المرور 8 أحرف فأكثر).",
  agency: "أدخل اسم الوكالة.", confirm: "أُرسل رابط تأكيد إلى بريدك. أكّد حسابك ثم سجّل الدخول." };
export default function Login({ searchParams }: { searchParams: { e?: string } }) {
  const e = searchParams.e && M[searchParams.e];
  return (
    <Shell>
      <h1 className="font-display text-4xl text-palm">الدخول</h1>
      {e && <p role="alert" className={`mt-3 ${searchParams.e === "confirm" ? "text-palm" : "text-red-700"}`}>{e}</p>}
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <form action={signIn} className="space-y-5 bg-dune/40 p-6"><h2 className="font-display text-2xl text-palm">لدي حساب</h2>
          <label className="block"><span className="text-sm">البريد الإلكتروني</span><input name="email" type="email" required className={fld} dir="ltr" /></label>
          <label className="block"><span className="text-sm">كلمة المرور</span><input name="password" type="password" required className={fld} dir="ltr" /></label>
          <button className={btn}>دخول</button></form>
        <form action={signUp} className="space-y-5 bg-dune/40 p-6"><h2 className="font-display text-2xl text-palm">حساب جديد</h2>
          <label className="block"><span className="text-sm">الاسم</span><input name="name" required className={fld} /></label>
          <label className="block"><span className="text-sm">الهاتف</span><input name="phone" type="tel" className={fld} dir="ltr" /></label>
          <label className="block"><span className="text-sm">البريد الإلكتروني</span><input name="email" type="email" required className={fld} dir="ltr" /></label>
          <label className="block"><span className="text-sm">كلمة المرور (8 أحرف فأكثر)</span><input name="password" type="password" minLength={8} required className={fld} dir="ltr" /></label>
          <label className="block"><span className="text-sm">نوع الحساب</span><select name="kind" className={fld}><option value="traveler">مسافر</option><option value="agency">وكالة نقل (يلزم اعتماد الإدارة)</option></select></label>
          <label className="block"><span className="text-sm">اسم الوكالة (للوكالات فقط)</span><input name="agency_name" className={fld} /></label>
          <button className={btn}>إنشاء الحساب</button></form>
      </div>
    </Shell>);
}
