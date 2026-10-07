"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TEXT_DEFS, lines, type TextBlock } from "@/lib/texts";

type Saved = TextBlock & { key: string };

const LEVELS = [
  { id: "kicker", label: "Occhiello", hint: "Riga piccola sopra il titolo: dice dove sei." },
  { id: "title", label: "Titolo", hint: "La frase che si legge per prima. A capo = nuova riga." },
  { id: "body", label: "Testo", hint: "Spiega e convince. Due o tre frasi." },
] as const;

export function TextsAdmin({
  db,
  notify,
}: {
  db: SupabaseClient;
  notify: (msg: string) => void;
}) {
  const [saved, setSaved] = useState<Record<string, Saved>>({});
  const pages = [...new Set(TEXT_DEFS.map((d) => d.page))];
  const [page, setPage] = useState(pages[0]);

  const fetchSaved = useCallback(async () => {
    const { data } = await db.from("site_texts").select("key, kicker, title, body");
    return Object.fromEntries(((data ?? []) as Saved[]).map((r) => [r.key, r]));
  }, [db]);

  useEffect(() => {
    fetchSaved().then(setSaved);
  }, [fetchSaved]);

  return (
    <div className="texts">
      <div className="texts__intro">
        <p className="muted">
          Ogni blocco ha fino a tre livelli di lettura. Chi scorre legge i
          titoli; chi si ferma legge il testo. Un campo vuoto rimette il testo
          predefinito.
        </p>
        <div className="texts__levels" aria-hidden="true">
          <span className="mono">Occhiello</span>
          <strong>Titolo</strong>
          <span>Testo, più lungo e più piccolo.</span>
        </div>
      </div>

      <div className="filters">
        {pages.map((p) => (
          <button key={p} type="button" className="filter mono" aria-pressed={p === page} onClick={() => setPage(p)}>
            {p}
          </button>
        ))}
      </div>

      {TEXT_DEFS.filter((d) => d.page === page).map((d) => (
        <TextBlockEditor
          key={d.key + (saved[d.key] ? "s" : "")}
          def={d}
          saved={saved[d.key]}
          onSave={async (v) => {
            const { error } = await db
              .from("site_texts")
              .upsert({ key: d.key, ...v, updated_at: new Date().toISOString() });
            notify(error ? `Errore: ${error.message}` : `«${d.label}» salvato. Sul sito entro un minuto.`);
            fetchSaved().then(setSaved);
          }}
          onReset={async () => {
            const { error } = await db.from("site_texts").delete().eq("key", d.key);
            notify(error ? `Errore: ${error.message}` : `«${d.label}» riportato al testo predefinito.`);
            fetchSaved().then(setSaved);
          }}
        />
      ))}
    </div>
  );
}

function TextBlockEditor({
  def,
  saved,
  onSave,
  onReset,
}: {
  def: (typeof TEXT_DEFS)[number];
  saved?: Saved;
  onSave: (v: TextBlock) => void;
  onReset: () => void;
}) {
  const [v, setV] = useState<TextBlock>({
    kicker: saved?.kicker ?? "",
    title: saved?.title ?? "",
    body: saved?.body ?? "",
  });
  const shown = {
    kicker: v.kicker.trim() || def.kicker || "",
    title: v.title.trim() || def.title || "",
    body: v.body.trim() || def.body || "",
  };

  return (
    <form
      className="tblock"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(v);
      }}
    >
      <div className="tblock__fields">
        <div className="row row--between">
          <strong className="h-step">{def.label}</strong>
          {saved && <span className="mono chip">Modificato</span>}
        </div>
        {LEVELS.filter((l) => def[l.id] !== null).map((l) => {
          const id = `${def.key}-${l.id}`;
          const multi = l.id !== "kicker";
          return (
            <div className="field" key={l.id}>
              <label htmlFor={id}>
                {l.label} <span className="hint">· {l.hint}</span>
              </label>
              {multi ? (
                <textarea
                  id={id}
                  className="input"
                  rows={l.id === "title" ? 2 : 4}
                  placeholder={def[l.id] ?? ""}
                  value={v[l.id]}
                  onChange={(e) => setV({ ...v, [l.id]: e.target.value })}
                />
              ) : (
                <input
                  id={id}
                  className="input"
                  placeholder={def[l.id] ?? ""}
                  value={v[l.id]}
                  onChange={(e) => setV({ ...v, [l.id]: e.target.value })}
                />
              )}
            </div>
          );
        })}
        <div className="row" style={{ gap: 12 }}>
          <button className="btn btn--small">Salva</button>
          {saved && (
            <button type="button" className="btn btn--ghost btn--small" onClick={onReset}>
              Ripristina predefinito
            </button>
          )}
        </div>
      </div>

      <div className="tblock__preview" aria-label="Anteprima">
        <div className="mono muted">Anteprima</div>
        {def.kicker !== null && <div className="mono">{shown.kicker}</div>}
        {def.title !== null && (
          <div className="tblock__title">
            {lines(shown.title).map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
        )}
        {def.body !== null && <p>{shown.body}</p>}
      </div>
    </form>
  );
}
