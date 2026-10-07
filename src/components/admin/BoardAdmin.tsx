"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { BOARD_LABEL, type BoardItem, type BoardKind } from "@/lib/data";
import { uploadImage } from "@/lib/upload";
import { Field, type Run } from "./shared";

export function BoardAdmin({ db, run }: { db: SupabaseClient; run: Run }) {
  const [items, setItems] = useState<BoardItem[]>([]);

  const fetchItems = useCallback(async () => {
    const { data } = await db
      .from("board_items")
      .select("*")
      .order("position")
      .order("created_at", { ascending: false });
    return (data ?? []) as BoardItem[];
  }, [db]);

  const load = useCallback(() => fetchItems().then(setItems), [fetchItems]);

  useEffect(() => {
    fetchItems().then(setItems);
  }, [fetchItems]);

  const act: Run = (label, fn) => run(label, fn).then(load);

  return (
    <section className="admin__block" id="a-bacheca">
      <h2 className="h-card">Bacheca</h2>
      <p className="muted">
        Location, agenzie, volti, crew e backstage. Le location disponibili
        compaiono in homepage e nella candidatura; le altre schede nella
        bacheca.
      </p>
      <div className="admin__grid">
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const f = new FormData(form);
            const files = (f.getAll("image") as File[]).filter((x) => x.size > 0);
            const base = {
              kind: f.get("kind"),
              title: f.get("title"),
              subtitle: f.get("subtitle"),
              city: f.get("city"),
              description: f.get("description"),
              link: String(f.get("link") ?? "") || null,
              available: f.get("available") === "on",
              position: items.length,
            };
            act("Bacheca", async () => {
              // Più immagini caricate insieme diventano più schede uguali.
              if (files.length === 0) return db.from("board_items").insert(base);
              const rows = [];
              for (const file of files) {
                rows.push({ ...base, image_url: await uploadImage(db, "bacheca", file) });
              }
              return db.from("board_items").insert(rows);
            }).then(() => form.reset());
          }}
        >
          <div className="field">
            <label htmlFor="b-kind">Tipo</label>
            <select id="b-kind" name="kind" className="input" defaultValue="location">
              {(Object.keys(BOARD_LABEL) as BoardKind[]).map((k) => (
                <option key={k} value={k}>{BOARD_LABEL[k]}</option>
              ))}
            </select>
          </div>
          <Field label="Titolo (nome location, agenzia, persona)" name="title" id="b-title" required />
          <Field label="Sottotitolo (es. ruolo, tipo di spazio)" name="subtitle" id="b-sub" />
          <Field label="Città" name="city" id="b-city" />
          <div className="field">
            <label htmlFor="b-desc">Descrizione breve</label>
            <textarea id="b-desc" name="description" className="input" />
          </div>
          <Field label="Link (sito o Instagram, facoltativo)" name="link" id="b-link" />
          <label>
            <input type="checkbox" name="available" defaultChecked /> Disponibile (solo per le location)
          </label>
          <div className="field">
            <label htmlFor="b-img">Immagini (puoi sceglierne più di una)</label>
            <input id="b-img" name="image" type="file" accept="image/*" multiple className="input" />
          </div>
          <button className="btn">Aggiungi alla bacheca</button>
        </form>

        <div className="admin__list">
          {items.map((it) => (
            <div className="admin__item" key={it.id}>
              <div>
                <strong>{it.title}</strong>
                <div className="muted">
                  {BOARD_LABEL[it.kind]} · {it.city}
                  {it.subtitle ? ` · ${it.subtitle}` : ""}
                </div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {it.image_url && <img src={it.image_url} alt="" className="admin__thumb" />}
              {it.kind === "location" && (
                <label>
                  <input
                    type="checkbox"
                    checked={it.available}
                    onChange={(e) =>
                      act("Location", async () =>
                        db.from("board_items").update({ available: e.target.checked }).eq("id", it.id),
                      )
                    }
                  />{" "}
                  Disponibile
                </label>
              )}
              <label className="btn btn--ghost btn--small">
                Cambia foto
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    act("Foto", async () => {
                      const image_url = await uploadImage(db, "bacheca", file);
                      return db.from("board_items").update({ image_url }).eq("id", it.id);
                    });
                  }}
                />
              </label>
              <button
                className="btn btn--ghost btn--small"
                onClick={() =>
                  act("Scheda rimossa", async () => db.from("board_items").delete().eq("id", it.id))
                }
              >
                Rimuovi
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <p className="muted">La bacheca è vuota: il sito mostra le schede di esempio.</p>
          )}
        </div>
      </div>
    </section>
  );
}
