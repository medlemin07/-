import { sb } from "@/lib/server";
// تصدير قائمة مسافري رحلة؛ سياسات RLS تضمن أن الوكالة ترى حجوزاتها فقط
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { data } = await sb().from("bookings").select("code,passenger_name,phone,seats_count,status,booking_seats(seat_no,active),payments(status)")
    .eq("trip_id", params.id).in("status", ["pending", "confirmed"]);
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"`;   // منع حقن الصيغ في Excel
  const rows = (data ?? []).map((b: any) => [b.code, b.passenger_name, b.phone, b.booking_seats.filter((s: any) => s.active).map((s: any) => s.seat_no).join(" ") || b.seats_count, b.status, b.payments?.[0]?.status].map(q).join(","));
  return new Response("\uFEFF" + ["الرمز,الاسم,الهاتف,المقاعد,الحالة,الدفع", ...rows].join("\n"),
    { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="passengers-${params.id}.csv"` } });
}
