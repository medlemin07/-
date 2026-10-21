"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sb } from "@/lib/server";
async function admin() {
  const s = sb(); const { data: { user } } = await s.auth.getUser(); if (!user) redirect("/login");
  const { data: p } = await s.from("profiles").select("role").eq("id", user.id).single(); if (p?.role !== "admin") redirect("/");
  return { s, uid: user.id };
}
const done = async (s: any, uid: string, event: string, detail: object) => {   // سجل العمليات الحساسة
  await s.from("booking_events").insert({ event: "admin:" + event, actor: uid, detail }); revalidatePath("/admin"); };
export async function setAgency(fd: FormData) {
  const { s, uid } = await admin(), status = String(fd.get("status")), id = String(fd.get("id"));
  if (!["approved", "rejected", "suspended", "pending"].includes(status)) return;
  await s.from("agencies").update({ status, updated_at: new Date().toISOString() }).eq("id", id); await done(s, uid, "agency_" + status, { id });
}
export async function setCommission(fd: FormData) {
  const { s, uid } = await admin(), pct = +String(fd.get("pct")), id = String(fd.get("id"));
  if (!(pct >= 0 && pct <= 100)) return;
  await s.from("agencies").update({ commission_bp: Math.round(pct * 100), updated_at: new Date().toISOString() }).eq("id", id); await done(s, uid, "commission", { id, pct });
}
export async function addCity(fd: FormData) {
  const { s, uid } = await admin(), ar = String(fd.get("ar") ?? "").trim(), fr = String(fd.get("fr") ?? "").trim();
  if (ar.length < 2 || ar.length > 40) return;
  await s.from("cities").insert({ name_ar: ar, name_fr: fr || null }); await done(s, uid, "city_added", { ar });
}
export async function addRoute(fd: FormData) {
  const { s, uid } = await admin(), f = String(fd.get("from")), t = String(fd.get("to"));
  if (!f || !t || f === t) return;
  await s.from("routes").insert({ from_city: f, to_city: t }); await done(s, uid, "route_added", { f, t });
}
const txt = (fd: FormData, k: string, n: number) => String(fd.get(k) ?? "").trim().slice(0, n) || null;
export async function createAgency(fd: FormData) {
  const { s, uid } = await admin(), name = txt(fd, "name", 80);
  if (!name || name.length < 3) return;
  await s.from("agencies").insert({ name, phone: txt(fd, "phone", 20), address: txt(fd, "address", 120), notes: txt(fd, "notes", 300), status: "approved" });
  await done(s, uid, "agency_created", { name });
}
export async function updateAgency(fd: FormData) {
  const { s, uid } = await admin(), id = String(fd.get("id")), name = txt(fd, "name", 80);
  if (!name || name.length < 3) return;
  await s.from("agencies").update({ name, phone: txt(fd, "phone", 20), address: txt(fd, "address", 120), notes: txt(fd, "notes", 300), updated_at: new Date().toISOString() }).eq("id", id);
  await done(s, uid, "agency_updated", { id });
}
export async function createTripFor(fd: FormData) {
  const { s, uid } = await admin(), dep = new Date(`${fd.get("dep")}:00Z`), arr = fd.get("arr") ? new Date(`${fd.get("arr")}:00Z`) : null;
  const price = Math.round(+String(fd.get("price"))), cap = Math.round(+String(fd.get("cap")));
  if (!(dep.getTime() > Date.now()) || (arr && arr <= dep) || !(price > 0) || !(cap >= 1 && cap <= 80)) return;
  await s.from("trips").insert({ agency_id: String(fd.get("agency")), route_id: String(fd.get("route")), departs_at: dep.toISOString(), arrives_at: arr?.toISOString() ?? null,
    price_mru: price, capacity: cap, seat_selection: fd.get("sel") === "on", amenities: String(fd.get("am") ?? "").split("،").map((x) => x.trim()).filter(Boolean) });
  await done(s, uid, "trip_created", { agency: String(fd.get("agency")) });
}
export async function updateTrip(fd: FormData) {   // السعر وعدد المقاعد المتاحة للبيع
  const { s, uid } = await admin(), id = String(fd.get("id")), price = Math.round(+String(fd.get("price"))), cap = Math.round(+String(fd.get("cap")));
  if (!(price > 0) || !(cap >= 1 && cap <= 80)) return;
  const { data: bk } = await s.from("bookings").select("seats_count,status,expires_at").eq("trip_id", id).in("status", ["pending", "confirmed"]);
  const held = (bk ?? []).filter((b: any) => b.status === "confirmed" || new Date(b.expires_at) > new Date()).reduce((x: number, b: any) => x + b.seats_count, 0);
  if (cap < held) return;   // لا يُخفَّض العدد دون المحجوز فعلًا
  await s.from("trips").update({ price_mru: price, capacity: cap, updated_at: new Date().toISOString() }).eq("id", id);
  await done(s, uid, "trip_updated", { id, price, cap });
}
export async function cancelTripAdmin(fd: FormData) {
  const { s, uid } = await admin(), id = String(fd.get("id"));
  await s.rpc("cancel_trip", { p_trip: id }); await done(s, uid, "trip_cancelled", { id });
}
