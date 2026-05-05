"use client";
import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cached: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (cached) return cached;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase env vars manquantes : ajoute NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou _ANON_KEY) à .env.local");
  }
  cached = createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return cached;
}
