"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SiteHeader } from "@/components/SiteHeader";
import { browserClient, MEDIA_BUCKET } from "@/lib/supabase";
import {
  KIND_LABEL,
  type Category,
  type Credit,
  type OpenCall,
  type Project,
  type TeamMember,
} from "@/lib/data";

type Booking = {
  id: string;
  brand_name: string;
  email: string;
  website: string | null;
  message: string | null;
  category_id: string;
  created_at: string;
};

type Access = "loading" | "anon" | "denied" | "admin";

async function uploadImage(db: SupabaseClient, folder: string, file: File) {
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const path = `${folder}/${Date.now()}-${safe}`;
  const { error } = await db.storage.from(MEDIA_BUCKET).upload(path, file);
  if (error) throw error;
  return db.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

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

export default function AdminPage() {
  const db = browserClient();
  const [access, setAccess] = useState<Access>("loading");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [call, setCall] = useState<(OpenCall & { published: boolean }) | null>(
    null,
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const load = useCallback(async () => {
    if (!db) return;
    const { data: c } = await db
      .from("open_calls")
      .select("*")
      .order("number", { ascending: false })
      .limit(1)
      .maybeSingle();
    setCall(c);
    if (c) {
      const [cats, bks] = await Promise.all([
        db.from("categories").select("*").eq("open_call_id", c.id).order("position"),
        db.from("bookings").select("*").eq("open_call_id", c.id).order("created_at", { ascending: false }),
      ]);
      setCategories((cats.data ?? []) as Category[]);
      setBookings((bks.data ?? []) as Booking[]);
    }
    const [t, p] = await Promise.all([
      db.from("team_members").select("*").order("position"),
      db.from("projects").select("*").order("created_at", { ascending: false }),
    ]);
    setTeam(((t.data ?? []) as TeamMember[]).map((m) => ({ ...m, credits: m.credits ?? [] })));
    setProjects((p.data ?? []) as Project[]);
  }, [db]);

  useEffect(() => {
    if (!db) return;
    const { data: sub } = db.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setAccess("anon");
        return;
      }
      setEmail(session.user.email ?? "");
      const { data: profile } = await db
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profile?.role === "admin") {
        setAccess("admin");
        load();
      } else {
        setAccess("denied");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [db, load]);

  /** Esegue un'operazione, mostra l'esito e ricarica i dati. */
  async function run(label: string, fn: () => Promise<{ error: unknown } | void>) {
    setMessage("Salvataggio…");
    try {
      const res = await fn();
      if (res && res.error) throw res.error;
      setMessage(`${label}: fatto. Il sito pubblico si aggiorna entro un minuto.`);
      await load();
    } catch (e) {
      const text = e instanceof Error ? e.message : (e as { message?: string })?.message;
      setMessage(`${label}: errore. ${text ?? ""}`);
    }
  }

  if (!db) {
    return (
      <Shell>
        <p className="notice notice--error">
          Supabase non è configurato: mancano le variabili d&apos;ambiente.
        </p>
      </Shell>
    );
  }
  if (access === "loading") return <Shell><p className="muted">Caricamento…</p></Shell>;
  if (access === "anon") {
    return (
      <Shell>
        <p className="notice">Per entrare serve il login.</p>
        <Link href="/login" className="btn">Accedi</Link>
      </Shell>
    );
  }
  if (access === "denied") {
    return (
      <Shell>
        <p className="notice">
          L&apos;account {email} non ha ancora accesso alla gestione del sito.
        </p>
        <button className="btn btn--ghost" onClick={() => db.auth.signOut()}>Esci</button>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="row row--between">
        <div className="mono">Accesso come {email}</div>
        <button className="btn btn--ghost btn--small" onClick={() => db.auth.signOut()}>
          Esci
        </button>
      </div>
      {message && <p className="notice" role="status">{message}</p>}

      {/* ---------- Open Call ---------- */}
      <section className="admin__block">
        <h2 className="h-card">Open Call</h2>
        {!call ? (
          <p className="muted">
            Nessuna Open Call nel database: esegui il file supabase/schema.sql.
          </p>
        ) : (
          <div className="admin__grid">
            <form
              className="form"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                run("Open Call", async () =>
                  db.from("open_calls").update({
                    number: Number(f.get("number")),
                    concept: f.get("concept"),
                    date_label: f.get("date_label"),
                    location: f.get("location"),
                    casting_label: f.get("casting_label"),
                    threshold: Number(f.get("threshold")),
                    closes_label: f.get("closes_label"),
                    deposit_label: f.get("deposit_label"),
                    published: f.get("published") === "on",
                  }).eq("id", call.id),
                );
              }}
            >
              <Field label="Numero" name="number" type="number" defaultValue={call.number} />
              <Field label="Concept" name="concept" defaultValue={call.concept} />
              <Field label="Data" name="date_label" defaultValue={call.date_label} />
              <Field label="Location" name="location" defaultValue={call.location} />
              <Field label="Casting e set" name="casting_label" defaultValue={call.casting_label} />
              <Field label="Soglia di conferma (brand)" name="threshold" type="number" defaultValue={call.threshold} />
              <Field label="Chiusura prenotazioni" name="closes_label" defaultValue={call.closes_label} />
              <Field label="Acconto" name="deposit_label" defaultValue={call.deposit_label} />
              <label>
                <input type="checkbox" name="published" defaultChecked={call.published} />{" "}
                Pubblicata sul sito
              </label>
              <button className="btn">Salva Open Call</button>
            </form>

            <div className="stack">
              <div className="mono">Categorie e posti</div>
              <div className="admin__list">
                {categories.map((c) => (
                  <div className="admin__item" key={c.id}>
                    <strong>{c.name}</strong>
                    <label>
                      <input
                        type="checkbox"
                        checked={c.taken}
                        onChange={(e) =>
                          run("Categoria", async () =>
                            db.from("categories").update({ taken: e.target.checked }).eq("id", c.id),
                          )
                        }
                      />{" "}
                      Occupato
                    </label>
                    <button
                      className="btn btn--ghost btn--small"
                      onClick={() =>
                        run("Categoria rimossa", async () =>
                          db.from("categories").delete().eq("id", c.id),
                        )
                      }
                    >
                      Rimuovi
                    </button>
                  </div>
                ))}
              </div>
              <form
                className="form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const name = String(new FormData(form).get("name") ?? "");
                  run("Categoria aggiunta", async () =>
                    db.from("categories").insert({
                      open_call_id: call.id,
                      name,
                      position: categories.length,
                    }),
                  ).then(() => form.reset());
                }}
              >
                <Field label="Nuova categoria" name="name" required />
                <button className="btn btn--ghost">Aggiungi categoria</button>
              </form>

              <div className="mono">Richieste ricevute ({bookings.length})</div>
              <div className="admin__list">
                {bookings.map((b) => (
                  <div className="admin__item" key={b.id}>
                    <div>
                      <strong>{b.brand_name}</strong> ·{" "}
                      {categories.find((c) => c.id === b.category_id)?.name ?? "—"}
                      <br />
                      <a href={`mailto:${b.email}`}>{b.email}</a>
                      {b.website ? ` · ${b.website}` : ""}
                      {b.message ? <div className="muted">{b.message}</div> : null}
                    </div>
                    <span className="mono">
                      {new Date(b.created_at).toLocaleDateString("it-IT")}
                    </span>
                  </div>
                ))}
                {bookings.length === 0 && <p className="muted">Ancora nessuna richiesta.</p>}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ---------- Portfolio ---------- */}
      <section className="admin__block">
        <h2 className="h-card">Portfolio</h2>
        <div className="admin__grid">
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const f = new FormData(form);
              const file = f.get("image") as File | null;
              run("Progetto aggiunto", async () => {
                const image_url =
                  file && file.size > 0 ? await uploadImage(db, "portfolio", file) : null;
                return db.from("projects").insert({
                  title: f.get("title"),
                  client: f.get("client"),
                  year: f.get("year"),
                  kind: f.get("kind"),
                  credit: f.get("credit"),
                  image_url,
                });
              }).then(() => form.reset());
            }}
          >
            <Field label="Titolo del progetto" name="title" required />
            <Field label="Brand o testata" name="client" />
            <Field label="Anno" name="year" />
            <div className="field">
              <label htmlFor="f-kind">Sezione</label>
              <select id="f-kind" name="kind" className="input" defaultValue="shared">
                {Object.entries(KIND_LABEL).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>
            <Field label="Credits (es. Styling Nome, foto Nome)" name="credit" />
            <div className="field">
              <label htmlFor="f-image">Immagine</label>
              <input id="f-image" name="image" type="file" accept="image/*" className="input" />
            </div>
            <button className="btn">Aggiungi al portfolio</button>
          </form>

          <div className="admin__list">
            {projects.map((p) => (
              <div className="admin__item" key={p.id}>
                <div>
                  <strong>{p.title}</strong>
                  <div className="muted">
                    {KIND_LABEL[p.kind]} · {p.client} · {p.year}
                  </div>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.image_url && <img src={p.image_url} alt="" className="admin__thumb" />}
                <button
                  className="btn btn--ghost btn--small"
                  onClick={() =>
                    run("Progetto rimosso", async () =>
                      db.from("projects").delete().eq("id", p.id),
                    )
                  }
                >
                  Rimuovi
                </button>
              </div>
            ))}
            {projects.length === 0 && <p className="muted">Nessun progetto caricato.</p>}
          </div>
        </div>
      </section>

      {/* ---------- Team ---------- */}
      <section className="admin__block">
        <h2 className="h-card">Team</h2>
        <div className="admin__grid">
          {team.map((m) => (
            <form
              className="form"
              key={m.id}
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const file = f.get("photo") as File | null;
                run(`Scheda di ${m.name}`, async () => {
                  const photo_url =
                    file && file.size > 0 ? await uploadImage(db, "team", file) : m.photo_url;
                  return db.from("team_members").update({
                    name: f.get("name"),
                    role: f.get("role"),
                    bio: f.get("bio"),
                    instagram: String(f.get("instagram") ?? "").replace(/^@/, "") || null,
                    credits: textToCredits(String(f.get("credits") ?? "")),
                    photo_url,
                  }).eq("id", m.id);
                });
              }}
            >
              <Field label="Nome" name="name" defaultValue={m.name} id={`n-${m.id}`} />
              <Field label="Ruolo" name="role" defaultValue={m.role} id={`r-${m.id}`} />
              <div className="field">
                <label htmlFor={`b-${m.id}`}>Bio</label>
                <textarea id={`b-${m.id}`} name="bio" className="input" defaultValue={m.bio} />
              </div>
              <Field label="Instagram personale (senza @)" name="instagram" defaultValue={m.instagram ?? ""} id={`i-${m.id}`} />
              <div className="field">
                <label htmlFor={`c-${m.id}`}>Credits, uno per riga: Progetto | Ruolo | Anno</label>
                <textarea id={`c-${m.id}`} name="credits" className="input" defaultValue={creditsToText(m.credits)} />
              </div>
              <div className="field">
                <label htmlFor={`p-${m.id}`}>Ritratto</label>
                <input id={`p-${m.id}`} name="photo" type="file" accept="image/*" className="input" />
              </div>
              <div className="row" style={{ gap: 8 }}>
                <button className="btn">Salva</button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() =>
                    run("Scheda rimossa", async () =>
                      db.from("team_members").delete().eq("id", m.id),
                    )
                  }
                >
                  Rimuovi
                </button>
              </div>
            </form>
          ))}
        </div>
        <div>
          <button
            className="btn btn--ghost"
            onClick={() =>
              run("Nuova scheda", async () =>
                db.from("team_members").insert({
                  name: "[NOME]",
                  role: "[RUOLO]",
                  bio: "",
                  position: team.length,
                }),
              )
            }
          >
            Aggiungi una persona
          </button>
        </div>
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader current="/login" />
      <main className="admin">
        <h1 className="h-section">Gestione del sito</h1>
        {children}
      </main>
    </>
  );
}

function Field({
  label,
  name,
  id,
  ...rest
}: {
  label: string;
  name: string;
  id?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const fieldId = id ?? `f-${name}`;
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      <input id={fieldId} name={name} className="input" {...rest} />
    </div>
  );
}
