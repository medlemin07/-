import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export function sb() {
  const c = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: {
    getAll: () => c.getAll(),
    setAll: (l) => { try { l.forEach(({ name, value, options }) => c.set(name, value, options)); } catch {} } } });
}
