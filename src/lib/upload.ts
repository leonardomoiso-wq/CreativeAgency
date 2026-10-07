import type { SupabaseClient } from "@supabase/supabase-js";
import { MEDIA_BUCKET } from "./supabase";

/** Carica un'immagine nello spazio "media" e ne restituisce l'indirizzo pubblico. */
export async function uploadImage(db: SupabaseClient, folder: string, file: File) {
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const path = `${folder}/${Date.now()}-${safe}`;
  const { error } = await db.storage.from(MEDIA_BUCKET).upload(path, file);
  if (error) throw error;
  return db.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}
