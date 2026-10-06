import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(url && key);

/** Client per le letture pubbliche lato server (nessuna sessione). */
export function publicClient(): SupabaseClient | null {
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

let browser: SupabaseClient | null = null;

/** Client del browser: mantiene la sessione di chi ha fatto login. */
export function browserClient(): SupabaseClient | null {
  if (!url || !key) return null;
  if (!browser) browser = createClient(url, key);
  return browser;
}

export const MEDIA_BUCKET = "media";
