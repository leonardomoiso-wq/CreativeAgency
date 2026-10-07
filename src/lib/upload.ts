import type { SupabaseClient } from "@supabase/supabase-js";
import { MEDIA_BUCKET } from "./supabase";

const MAX_SIDE = 2400;

/**
 * Riduce le foto troppo grandi (lato lungo 2400 px) e le converte in WebP,
 * così il sito resta veloce anche se si carica l'originale della macchina.
 */
async function prepareImage(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 1_500_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.86));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}

/** Carica un'immagine nello spazio "media" e ne restituisce l'indirizzo pubblico. */
export async function uploadImage(db: SupabaseClient, folder: string, original: File) {
  const file = await prepareImage(original);
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const path = `${folder}/${Date.now()}-${safe}`;
  const { error } = await db.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw error;
  return db.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** "villa-sul_lago-02.jpg" → "Villa sul lago 02": etichetta iniziale dal nome del file. */
export function labelFromFile(name: string) {
  const base = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return base ? base[0].toUpperCase() + base.slice(1) : "Senza titolo";
}
