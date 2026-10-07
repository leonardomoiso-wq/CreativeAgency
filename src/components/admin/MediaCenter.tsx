"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Credit } from "@/lib/data";
import { labelFromFile, uploadImage } from "@/lib/upload";
import { SECTIONS, type FieldDef, type SectionDef } from "./sections";

type Rec = Record<string, unknown> & { id: string; position: number };
type Tables = Record<SectionDef["table"], Rec[]>;

const EMPTY: Tables = { board_items: [], projects: [], team_members: [] };
const DRAG_TYPE = "text/x-media-id";

function creditsToText(credits: Credit[]) {
  return credits.map((c) => `${c.title} | ${c.role} | ${c.year}`).join("\n");
}

function textToCredits(text: string): Credit[] {
  return text
    .split("\n")
    .map((line) => line.split("|").map((s) => s.trim()))
    .filter((p) => p[0])
    .map(([title, role = "", year = ""]) => ({ title, role, year }));
}

function rowsOf(section: SectionDef, tables: Tables) {
  return tables[section.table]
    .filter((r) => Object.entries(section.match).every(([k, v]) => r[k] === v))
    .sort((a, b) => a.position - b.position);
}

export function MediaCenter({
  db,
  notify,
}: {
  db: SupabaseClient;
  notify: (msg: string) => void;
}) {
  const [tables, setTables] = useState<Tables>(EMPTY);
  const [active, setActive] = useState(SECTIONS[0].id);
  const [busy, setBusy] = useState("");
  const section = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];
  const rows = rowsOf(section, tables);

  const fetchAll = useCallback(async (): Promise<Tables> => {
    const order = (t: string) =>
      db.from(t).select("*").order("position").order("id");
    const [b, p, t] = await Promise.all([
      order("board_items"),
      order("projects"),
      order("team_members"),
    ]);
    return {
      board_items: (b.data ?? []) as Rec[],
      projects: (p.data ?? []) as Rec[],
      team_members: (t.data ?? []) as Rec[],
    };
  }, [db]);

  const reload = useCallback(() => fetchAll().then(setTables), [fetchAll]);

  useEffect(() => {
    fetchAll().then(setTables);
  }, [fetchAll]);

  async function addFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    const start = rows.length ? Math.max(...rows.map((r) => r.position)) + 1 : 0;
    try {
      for (const [i, file] of images.entries()) {
        setBusy(`Carico ${i + 1} di ${images.length}: ${file.name}`);
        const url = await uploadImage(db, section.folder, file);
        const { error } = await db.from(section.table).insert({
          ...section.defaults,
          ...section.match,
          [section.labelField]: labelFromFile(file.name),
          [section.imageField]: url,
          position: start + i,
        });
        if (error) throw error;
      }
      notify(`${images.length === 1 ? "1 immagine caricata" : `${images.length} immagini caricate`} in ${section.label}. Sul sito entro un minuto.`);
    } catch (e) {
      notify(`Caricamento interrotto: ${(e as { message?: string }).message ?? "errore"}`);
    }
    setBusy("");
    reload();
  }

  async function save(id: string, patch: Record<string, unknown>, msg = "Salvato") {
    const { error } = await db.from(section.table).update(patch).eq("id", id);
    notify(error ? `Errore: ${error.message}` : `${msg}. Sul sito entro un minuto.`);
    reload();
  }

  async function remove(r: Rec) {
    if (!confirm(`Eliminare «${String(r[section.labelField])}»?`)) return;
    const { error } = await db.from(section.table).delete().eq("id", r.id);
    notify(error ? `Errore: ${error.message}` : "Eliminato.");
    reload();
  }

  /** Sposta una scheda prima di un'altra e rinumera la sezione. */
  async function move(fromId: string, toId: string) {
    if (fromId === toId) return;
    const list = rows.filter((r) => r.id !== fromId);
    const moving = rows.find((r) => r.id === fromId);
    const at = list.findIndex((r) => r.id === toId);
    if (!moving || at < 0) return;
    list.splice(at, 0, moving);
    // aggiornamento immediato a schermo, poi salvataggio
    setTables((t) => ({
      ...t,
      [section.table]: t[section.table].map((r) => {
        const i = list.findIndex((x) => x.id === r.id);
        return i >= 0 ? { ...r, position: i } : r;
      }),
    }));
    await Promise.all(
      list.map((r, i) =>
        r.position === i ? null : db.from(section.table).update({ position: i }).eq("id", r.id),
      ),
    );
    notify("Ordine salvato.");
  }

  const groups = [...new Set(SECTIONS.map((s) => s.group))];

  return (
    <div className="mc">
      <nav className="mc__nav" aria-label="Sezioni del media center">
        {groups.map((g) => (
          <div key={g} className="mc__navgroup">
            <div className="mono mc__navtitle">{g}</div>
            {SECTIONS.filter((s) => s.group === g).map((s) => (
              <button
                key={s.id}
                type="button"
                className="mc__navitem"
                aria-current={s.id === active}
                onClick={() => setActive(s.id)}
              >
                <span>{s.label}</span>
                <span className="mono">{rowsOf(s, tables).length}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="mc__main">
        <div className="row row--between">
          <div className="stack" style={{ gap: 6 }}>
            <div className="mono">{section.group}</div>
            <h2 className="h-section">{section.label}</h2>
          </div>
          <a href={section.publicPath} target="_blank" rel="noreferrer" className="link">
            Vedi sul sito ↗
          </a>
        </div>
        <p className="muted">{section.hint}</p>

        <DropZone busy={busy} onFiles={addFiles} />

        {rows.length === 0 ? (
          <p className="muted">
            Ancora nessuna immagine qui: finché la sezione è vuota il sito
            mostra i riquadri di esempio.
          </p>
        ) : (
          <p className="mono muted">
            {rows.length} {rows.length === 1 ? "scheda" : "schede"} · trascina
            una scheda per cambiare l&apos;ordine · trascina una foto su una
            scheda per sostituirla
          </p>
        )}

        <div className="mc__grid">
          {rows.map((r) => (
            <MediaCard
              key={r.id}
              rec={r}
              section={section}
              onSave={(patch, msg) => save(r.id, patch, msg)}
              onReplace={async (file) => {
                setBusy(`Sostituisco la foto di «${String(r[section.labelField])}»`);
                try {
                  const url = await uploadImage(db, section.folder, file);
                  await save(r.id, { [section.imageField]: url }, "Foto sostituita");
                } catch (e) {
                  notify(`Errore: ${(e as { message?: string }).message ?? ""}`);
                }
                setBusy("");
              }}
              onRemove={() => remove(r)}
              onMove={(fromId) => move(fromId, r.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function DropZone({
  busy,
  onFiles,
  title = "Trascina qui le immagini",
  hint = "oppure clicca per sceglierle · più foto insieme diventano più schede · il nome del file diventa l'etichetta, poi la cambi",
  multiple = true,
}: {
  busy: string;
  onFiles: (f: File[]) => void;
  title?: string;
  hint?: string;
  multiple?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      className="dropzone"
      data-over={over}
      data-busy={Boolean(busy)}
      role="button"
      tabIndex={0}
      onClick={() => !busy && input.current?.click()}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
      onDragOver={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        e.preventDefault();
        setOver(false);
        if (!busy) onFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <strong>{busy || (over ? "Lascia qui" : title)}</strong>
      {!busy && <span className="muted">{hint}</span>}
    </div>
  );
}

function MediaCard({
  rec,
  section,
  onSave,
  onReplace,
  onRemove,
  onMove,
}: {
  rec: Rec;
  section: SectionDef;
  onSave: (patch: Record<string, unknown>, msg?: string) => void;
  onReplace: (file: File) => void;
  onRemove: () => void;
  onMove: (fromId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [over, setOver] = useState(false);
  const label = String(rec[section.labelField] ?? "");
  const img = rec[section.imageField] as string | null;

  return (
    <article
      className="mcard"
      data-over={over}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_TYPE, rec.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
        if (file) return onReplace(file);
        const id = e.dataTransfer.getData(DRAG_TYPE);
        if (id) onMove(id);
      }}
    >
      <div className="mcard__img">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={label} draggable={false} />
        ) : (
          <span className="mono">Nessuna foto</span>
        )}
        <label className="mcard__replace mono">
          Cambia foto
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onReplace(f);
            }}
          />
        </label>
        {section.id === "location" && (
          <button
            type="button"
            className="mcard__flag mono"
            data-on={Boolean(rec.available)}
            onClick={() =>
              onSave(
                { available: !rec.available },
                rec.available ? "Segnata come prenotata" : "Segnata come disponibile",
              )
            }
          >
            {rec.available ? "Disponibile" : "Prenotata"}
          </button>
        )}
      </div>

      <label className="mcard__label">
        <span className="mono">{section.labelName}</span>
        <input
          className="input"
          defaultValue={label}
          key={label}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          onBlur={(e) => {
            const v = e.currentTarget.value.trim();
            if (v && v !== label) onSave({ [section.labelField]: v }, "Etichetta salvata");
          }}
        />
      </label>

      <div className="mcard__actions">
        <button type="button" className="link" onClick={() => setOpen(!open)} aria-expanded={open}>
          {open ? "Chiudi" : "Dettagli"}
        </button>
        <button type="button" className="link mcard__del" onClick={onRemove}>
          Elimina
        </button>
      </div>

      {open && (
        <form
          className="form mcard__form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const patch: Record<string, unknown> = {};
            for (const fd of section.fields) patch[fd.name] = readField(fd, f);
            onSave(patch);
            setOpen(false);
          }}
        >
          {section.fields.map((fd) => (
            <FieldInput key={fd.name} fd={fd} rec={rec} />
          ))}
          <button className="btn btn--small">Salva</button>
        </form>
      )}
    </article>
  );
}

function readField(fd: FieldDef, f: FormData): unknown {
  if (fd.type === "checkbox") return f.get(fd.name) === "on";
  const v = String(f.get(fd.name) ?? "").trim();
  if (fd.type === "credits") return textToCredits(v);
  if (fd.name === "instagram") return v.replace(/^@/, "") || null;
  if (fd.name === "link") return v || null;
  return v;
}

function FieldInput({ fd, rec }: { fd: FieldDef; rec: Rec }) {
  const id = `${rec.id}-${fd.name}`;
  const value = rec[fd.name];
  if (fd.type === "checkbox") {
    return (
      <label className="check">
        <input type="checkbox" name={fd.name} defaultChecked={Boolean(value)} /> {fd.label}
      </label>
    );
  }
  const text =
    fd.type === "credits" ? creditsToText((value as Credit[]) ?? []) : String(value ?? "");
  return (
    <div className="field">
      <label htmlFor={id}>{fd.label}</label>
      {fd.type === "textarea" || fd.type === "credits" ? (
        <textarea id={id} name={fd.name} className="input" defaultValue={text} />
      ) : (
        <input id={id} name={fd.name} className="input" defaultValue={text} />
      )}
    </div>
  );
}
