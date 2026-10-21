import { notFound } from "next/navigation";
import { Shell } from "../../components";
const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL, phone = process.env.NEXT_PUBLIC_CONTACT_PHONE;
const P: Record<string, { t: string; items: string[] }> = {
  terms: { t: "الشروط والأحكام", items: [
    "المنصة وسيط يعرض رحلات وكالات النقل المعتمدة، والوكالة هي المسؤولة عن تنفيذ الرحلة.",
    "طلب الحجز لا يصبح مؤكدًا إلا بتأكيد الوكالة، وتُحرَّر المقاعد تلقائيًا إذا انتهت مهلة الحجز دون تأكيد.",
    "الدفع حاليًا في مقر الوكالة فقط، ولا يُعد الحجز مدفوعًا حتى تسجّل الوكالة استلام المبلغ.",
    "يلتزم المسافر بإدخال اسمه ورقم هاتفه الصحيحين، ويحق للوكالة رفض الطلب مع ذكر السبب.",
    "الأسعار والمواعيد تحددها الوكالة وقد تتغير قبل التأكيد." ] },
  privacy: { t: "سياسة الخصوصية", items: [
    "نجمع الاسم ورقم الهاتف فقط لإتمام الحجز، وللحسابات نضيف البريد الإلكتروني.",
    "تظهر بيانات المسافر للوكالة المعنية بالرحلة ولإدارة المنصة فقط، ولا تُعرض للعامة.",
    "لا نخزّن بيانات بطاقات الدفع.",
    "تتبع الحجز يتطلب رقم الحجز وآخر 4 أرقام من الهاتف، وتُقيَّد المحاولات الخاطئة.",
    "للاستفسار عن بياناتك أو طلب حذفها تواصل معنا عبر صفحة التواصل." ] },
  cancellation: { t: "سياسة الإلغاء والاسترداد", items: [
    "يمكنك إلغاء حجزك من صفحة التتبع قبل أن تؤكده الوكالة.",
    "بعد التأكيد يتم الإلغاء بالتواصل مع الوكالة، وتحدد الوكالة شروطه.",
    "إذا ألغت الوكالة الرحلة تُلغى الحجوزات المرتبطة بها وتُحرَّر مقاعدها.",
    "لأن الدفع في الوكالة حاليًا فلا يوجد استرداد إلكتروني؛ أي مبلغ دُفع نقدًا تعالجه الوكالة مباشرة." ] },
  contact: { t: "تواصل معنا", items: [
    email || phone ? [email && `البريد: ${email}`, phone && `الهاتف: ${phone}`].filter(Boolean).join(" · ") : "لم تُضبط بيانات التواصل بعد (متغيرا البيئة NEXT_PUBLIC_CONTACT_EMAIL وNEXT_PUBLIC_CONTACT_PHONE).",
    "لشكاوى الحجز اذكر رقم الحجز واسم الوكالة." ] } };
export const generateStaticParams = () => Object.keys(P).map((slug) => ({ slug }));
export default function Legal({ params }: { params: { slug: string } }) {
  const p = P[params.slug]; if (!p) notFound();
  return (<Shell><h1 className="font-display text-4xl text-palm">{p.t}</h1>
    <p className="mt-2 border-s-4 border-gold ps-3 text-sm">مسودة أولية، تُراجَع قانونيًا قبل الإطلاق.</p>
    <ul className="mt-6 list-disc space-y-3 ps-6 leading-8">{p.items.map((i) => <li key={i}>{i}</li>)}</ul></Shell>);
}
