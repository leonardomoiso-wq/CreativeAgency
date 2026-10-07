"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SITE_NAME } from "@/lib/site";
import { uploadImage } from "@/lib/upload";
import { DropZone } from "./MediaCenter";

const SLOTS = [
  {
    key: "logo_url",
    label: "Logo principale",
    hint: "Compare nell'intestazione del sito, su fondo chiaro. Meglio SVG o PNG trasparente, orizzontale.",
    dark: false,
  },
  {
    key: "logo_light_url",
    label: "Versione per fondi scuri",
    hint: "Facoltativa: per la schermata iniziale e il media center, che sono neri. Se manca si usa il logo principale.",
    dark: true,
  },
] as const;

export function LogoAdmin({
  db,
  notify,
}: {
  db: SupabaseClient;
  notify: (msg: string) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");

  const fetchValues = useCallback(async () => {
    const { data } = await db.from("site_settings").select("key, value");
    return Object.fromEntries((data ?? []).map((r) => [r.key, r.value as string]));
  }, [db]);

  useEffect(() => {
    fetchValues().then(setValues);
  }, [fetchValues]);

  async function set(key: string, value: string, msg: string) {
    const { error } = await db
      .from("site_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    notify(error ? `Errore: ${error.message}` : `${msg} Sul sito entro un minuto.`);
    fetchValues().then(setValues);
  }

  return (
    <div className="logo-admin">
      {SLOTS.map((slot) => {
        const url = values[slot.key];
        return (
          <section className="tblock" key={slot.key}>
            <div className="tblock__fields">
              <strong className="h-step">{slot.label}</strong>
              <p className="muted">{slot.hint}</p>
              <DropZone
                busy={busy === slot.key ? "Caricamento…" : ""}
                multiple={false}
                title={url ? "Sostituisci il logo" : "Trascina qui il logo"}
                hint="oppure clicca per sceglierlo · SVG, PNG o WebP"
                onFiles={async ([file]) => {
                  if (!file) return;
                  setBusy(slot.key);
                  try {
                    const value = await uploadImage(db, "logo", file);
                    await set(slot.key, value, "Logo aggiornato.");
                  } catch (e) {
                    notify(`Errore: ${(e as { message?: string }).message ?? ""}`);
                  }
                  setBusy("");
                }}
              />
              {url && (
                <div>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    onClick={() => set(slot.key, "", "Logo tolto: torna il nome in lettere.")}
                  >
                    Togli il logo
                  </button>
                </div>
              )}
            </div>
            <div className="logo-preview" data-dark={slot.dark}>
              <div className="mono">Anteprima</div>
              <div className="logo-preview__bar">
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={SITE_NAME} className="logo-img" />
                ) : (
                  <span className="wordmark">{SITE_NAME}</span>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
