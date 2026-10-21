"use server";
import { revalidatePath } from "next/cache";
import { sb } from "@/lib/server";
export async function createTrip(fd: FormData) {
  const s = sb(); const { data: { user } } = await s.auth.getUser();
  const { data: st } = await s.from("agency_staff").select("agency_id").eq("user_id", user!.id).limit(1).single();
  const dep = new Date(`${fd.get("dep")}:00Z`), arrT = fd.get("arr") ? new Date(`${fd.get("arr")}:00Z`) : null;
  if (!st || !(dep.getTime() > Date.now()) || (arrT && arrT <= dep)) return;
  await s.from("trips").insert({ agency_id: st.agency_id, route_id: String(fd.get("route")), departs_at: dep.toISOString(),
    arrives_at: arrT?.toISOString() ?? null, price_mru: Math.round(+fd.get("price")!), capacity: Math.round(+fd.get("cap")!),
    seat_selection: fd.get("sel") === "on", amenities: String(fd.get("am") ?? "").split("،").map((x) => x.trim()).filter(Boolean) });
  revalidatePath("/agency");
}
export async function tripOp(fd: FormData) {
  const s = sb(), id = String(fd.get("id")), op = String(fd.get("op"));
  if (op === "cancel") await s.rpc("cancel_trip", { p_trip: id });
  else await s.from("trips").update({ status: op === "close" ? "closed" : "open", updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/agency");
}
export async function bookingOp(fd: FormData) {
  const s = sb(), id = String(fd.get("id")), op = String(fd.get("op"));
  if (op === "cash") await s.rpc("record_cash_payment", { p_booking: id });
  else await s.rpc("set_booking_status", { p_booking: id, p_to: op, p_reason: String(fd.get("reason") ?? "") || null });
  revalidatePath("/agency");
}
