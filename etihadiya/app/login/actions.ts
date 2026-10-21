"use server";
import { redirect } from "next/navigation";
import { sb } from "@/lib/server";
const go = async () => { const s = sb(); const { data: { user } } = await s.auth.getUser();
  const { data: p } = await s.from("profiles").select("role").eq("id", user!.id).single();
  redirect(p?.role === "admin" ? "/admin" : p?.role === "agency_staff" ? "/agency" : "/"); };
export async function signIn(fd: FormData) {
  const { error } = await sb().auth.signInWithPassword({ email: String(fd.get("email")), password: String(fd.get("password")) });
  if (error) redirect("/login?e=login");
  await go();
}
export async function signUp(fd: FormData) {
  const agency = String(fd.get("kind")) === "agency" ? String(fd.get("agency_name") ?? "").trim() : "";
  if (String(fd.get("kind")) === "agency" && agency.length < 3) redirect("/login?e=agency");
  const { data, error } = await sb().auth.signUp({ email: String(fd.get("email")), password: String(fd.get("password")),
    options: { data: { full_name: String(fd.get("name") ?? ""), phone: String(fd.get("phone") ?? ""), agency_name: agency } } });
  if (error) redirect("/login?e=signup");
  if (!data.session) redirect("/login?e=confirm");   // تأكيد البريد مفعّل في Supabase
  await go();
}
export async function signOut() { await sb().auth.signOut(); redirect("/"); }
