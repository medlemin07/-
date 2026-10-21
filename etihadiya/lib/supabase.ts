import { createClient } from "@supabase/supabase-js";
export const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
export const fmtTime = (s: string) => new Date(s).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Nouakchott" });
export const fmtDate = (s: string) => new Date(s).toLocaleDateString("ar", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Nouakchott" });
export const ERR: Record<string, string> = {
  invalid_input: "تحقق من الاسم ورقم الهاتف.", trip_unavailable: "هذه الرحلة لم تعد متاحة.",
  not_enough_seats: "لا تتوفر مقاعد كافية.", seat_numbers_required: "اختر أرقام المقاعد بعدد المسافرين.",
  seat_taken: "أحد المقاعد حُجز للتو، اختر مقعدًا آخر.", invalid_seat: "رقم مقعد غير صالح.", too_many_pending: "لديك حجوزات معلّقة كثيرة بهذا الرقم. انتظر تأكيدها أو انتهاء مهلتها." };
