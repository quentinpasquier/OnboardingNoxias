import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function getSupabaseServerClient() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase env vars manquantes (NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ou _ANON_KEY)");
  }
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // setAll a échoué (RSC sans Server Action) — middleware refresh la session
        }
      },
    },
  });
}

export async function requireUser() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Non authentifié");
  return { user: data.user, supabase };
}
