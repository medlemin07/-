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
