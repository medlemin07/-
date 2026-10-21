"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/supabase";
export async function book(fd: FormData) {
  const id = String(fd.get("id")), phone = String(fd.get("phone") ?? "").replace(/\s/g, "");
  const seatNos = fd.getAll("seat").map(Number);
  const n = seatNos.length || Math.min(8, Math.max(1, +String(fd.get("seats")) || 1));
  if (fd.get("terms") !== "on") redirect(`/trip/${id}?seats=${n}&e=terms`);
  const { data, error } = await db().rpc("create_booking", {
    p_trip: id, p_name: String(fd.get("name") ?? ""), p_phone: phone, p_seats: n, p_seat_nos: seatNos.length ? seatNos : null });
  if (error || !data) redirect(`/trip/${id}?seats=${n}&e=${encodeURIComponent(error?.message ?? "trip_unavailable")}`);
  redirect(`/track?code=${data}&last4=${phone.slice(-4)}&new=1`);
}
