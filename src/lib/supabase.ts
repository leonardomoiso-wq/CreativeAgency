import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Valori letti al momento della build: dopo averli cambiati su Vercel serve
// un nuovo deploy. La chiave "anon" (nome usato dall'integrazione Supabase
// di Vercel) vale come la publishable.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Le variabili mancanti, per spiegare l'errore in gestione. */
export const missingEnv = [
  !url && "NEXT_PUBLIC_SUPABASE_URL",
  !key && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
].filter(Boolean) as string[];

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
