"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  APPLICANT_LABEL,
  STATUS_LABEL,
  type Application,
  type ApplicationStatus,
  type BoardItem,
  type BrandGroup,
  type MoodboardItem,
} from "@/lib/data";
import { uploadImage } from "@/lib/upload";
import { Field, type Run } from "./shared";

const STATUSES = Object.keys(STATUS_LABEL) as ApplicationStatus[];

export function ApplicationsAdmin({ db, run }: { db: SupabaseClient; run: Run }) {
  const [apps, setApps] = useState<Application[]>([]);
  const [groups, setGroups] = useState<BrandGroup[]>([]);
  const [locations, setLocations] = useState<BoardItem[]>([]);
  const [mood, setMood] = useState<MoodboardItem[]>([]);
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [open, setOpen] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    return Promise.all([
      db.from("applications").select("*").order("created_at", { ascending: false }),
      db.from("brand_groups").select("*").order("created_at", { ascending: false }),
      db.from("board_items").select("*").eq("kind", "location").order("position"),
      db.from("moodboard_items").select("*").order("created_at"),
    ]);
  }, [db]);

  type All = Awaited<ReturnType<typeof fetchAll>>;
  const apply = ([a, g, l, m]: All) => {
    setApps((a.data ?? []) as Application[]);
    setGroups((g.data ?? []) as BrandGroup[]);
    setLocations((l.data ?? []) as BoardItem[]);
    setMood((m.data ?? []) as MoodboardItem[]);
  };
  const load = () => fetchAll().then(apply);

  useEffect(() => {
    fetchAll().then(([a, g, l, m]) => {
      setApps((a.data ?? []) as Application[]);
      setGroups((g.data ?? []) as BrandGroup[]);
      setLocations((l.data ?? []) as BoardItem[]);
      setMood((m.data ?? []) as MoodboardItem[]);
    });
  }, [fetchAll]);

  const act: Run = (label, fn) => run(label, fn).then(load);
  const shown = filter === "all" ? apps : apps.filter((a) => a.status === filter);
  const locName = (id: string) => locations.find((l) => l.id === id)?.title ?? "—";

  return (
    <section className="admin__block" id="a-candidature">
      <h2 className="h-card">Candidature e gruppi</h2>
      <p className="muted">
        Ogni brand vede nel proprio pannello lo stato che imposti qui, il
        gruppo a cui lo abbini e il messaggio del team.
      </p>

      <div className="filters">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            type="button"
            className="filter mono"
            aria-pressed={filter === s}
            onClick={() => setFilter(s)}
          >
            {s === "all" ? "Tutte" : STATUS_LABEL[s]}
            <sup>{s === "all" ? apps.length : apps.filter((a) => a.status === s).length}</sup>
          </button>
        ))}
      </div>

      <div className="admin__list">
        {shown.map((a) => (
          <div className="admin__app" key={a.id}>
            <button
              type="button"
              className="admin__app-head"
              aria-expanded={open === a.id}
              onClick={() => setOpen(open === a.id ? null : a.id)}
            >
              <strong>{a.brand_name}</strong>
              <span className="muted">
                {APPLICANT_LABEL[a.kind]} · {a.category} · {a.city}
              </span>
              <span className="mono cat__tag">{STATUS_LABEL[a.status]}</span>
            </button>
            {open === a.id && (
              <div className="admin__grid">
                <div className="summary">
                  <div><span className="mono">Email</span><a href={`mailto:${a.email}`}>{a.email}</a></div>
                  <div><span className="mono">Sito / IG</span>{a.website}</div>
                  <div><span className="mono">Capi</span>{a.pieces}</div>
                  <div><span className="mono">Stile</span>{a.keywords}</div>
                  <div><span className="mono">Location</span>{a.location_ids.length ? a.location_ids.map(locName).join(", ") : "Nessuna preferenza"}</div>
                  {a.message && <div><span className="mono">Obiettivo</span>{a.message}</div>}
                  <div><span className="mono">Inviata</span>{new Date(a.created_at).toLocaleString("it-IT")}</div>
                </div>
                <form
                  className="form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    act(`Candidatura di ${a.brand_name}`, async () =>
                      db.from("applications").update({
                        status: f.get("status"),
                        group_id: String(f.get("group_id") ?? "") || null,
                        team_note: String(f.get("team_note") ?? ""),
                      }).eq("id", a.id),
                    );
                  }}
                >
                  <div className="field">
                    <label htmlFor={`st-${a.id}`}>Stato</label>
                    <select id={`st-${a.id}`} name="status" className="input" defaultValue={a.status}>
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor={`gr-${a.id}`}>Gruppo</label>
                    <select id={`gr-${a.id}`} name="group_id" className="input" defaultValue={a.group_id ?? ""}>
                      <option value="">Nessun gruppo</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor={`nt-${a.id}`}>Messaggio per il brand (lo vede nel pannello)</label>
                    <textarea id={`nt-${a.id}`} name="team_note" className="input" defaultValue={a.team_note} />
                  </div>
                  <button className="btn">Salva</button>
                </form>
              </div>
            )}
          </div>
        ))}
        {shown.length === 0 && <p className="muted">Nessuna candidatura qui.</p>}
      </div>

      <h3 className="h-step">Gruppi</h3>
      <div className="admin__grid">
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const f = new FormData(form);
            act("Gruppo creato", async () =>
              db.from("brand_groups").insert({
                name: f.get("name"),
                concept: f.get("concept"),
                date_label: f.get("date_label"),
                location_id: String(f.get("location_id") ?? "") || null,
              }),
            ).then(() => form.reset());
          }}
        >
          <Field label="Nome del gruppo" name="name" id="g-name" placeholder="es. Giornata Como, maggio" required />
          <div className="field">
            <label htmlFor="g-concept">Concept</label>
            <textarea id="g-concept" name="concept" className="input" />
          </div>
          <div className="field">
            <label htmlFor="g-loc">Location</label>
            <select id="g-loc" name="location_id" className="input" defaultValue="">
              <option value="">Da decidere</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id ?? ""}>{l.title} · {l.city}</option>
              ))}
            </select>
          </div>
          <Field label="Data" name="date_label" id="g-date" />
          <button className="btn btn--ghost">Crea gruppo</button>
        </form>

        <div className="admin__list">
          {groups.map((g) => {
            const members = apps.filter((a) => a.group_id === g.id);
            const items = mood.filter((m) => m.group_id === g.id);
            return (
              <div className="admin__group" key={g.id}>
                <div className="row row--between">
                  <strong>{g.name}</strong>
                  <span className="mono">
                    {g.location_id ? locName(g.location_id) : "Location da decidere"} · {g.date_label || "data da fissare"}
                  </span>
                </div>
                <div className="muted">
                  {members.length
                    ? members.map((m) => `${m.brand_name} (${m.category})`).join(" · ")
                    : "Nessun brand ancora: assegnalo dalla candidatura."}
                </div>
                <div className="admin__mood">
                  {items.map((m) => (
                    <div key={m.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.image_url} alt={m.caption} className="admin__thumb" />
                      <button
                        className="link"
                        onClick={() =>
                          act("Riferimento rimosso", async () =>
                            db.from("moodboard_items").delete().eq("id", m.id),
                          )
                        }
                      >
                        Rimuovi
                      </button>
                    </div>
                  ))}
                </div>
                <div className="row" style={{ gap: 12 }}>
                  <label className="btn btn--ghost btn--small">
                    Aggiungi alla moodboard
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (!files.length) return;
                        act("Moodboard", async () => {
                          const rows = [];
                          for (const file of files) {
                            rows.push({
                              group_id: g.id,
                              image_url: await uploadImage(db, "moodboard/team", file),
                            });
                          }
                          return db.from("moodboard_items").insert(rows);
                        });
                      }}
                    />
                  </label>
                  <button
                    className="btn btn--ghost btn--small"
                    onClick={() =>
                      act("Gruppo rimosso", async () => db.from("brand_groups").delete().eq("id", g.id))
                    }
                  >
                    Elimina gruppo
                  </button>
                </div>
              </div>
            );
          })}
          {groups.length === 0 && <p className="muted">Nessun gruppo creato.</p>}
        </div>
      </div>
    </section>
  );
}
