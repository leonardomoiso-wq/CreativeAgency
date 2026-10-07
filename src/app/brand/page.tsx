"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Tile } from "@/components/Tile";
import { browserClient } from "@/lib/supabase";
import { uploadImage } from "@/lib/upload";
import {
  APPLICANT_LABEL,
  STATUS_STEPS,
  type ApplicantKind,
  type Application,
  type BoardItem,
  type BrandGroup,
  type MoodboardItem,
} from "@/lib/data";

type Access = "loading" | "anon" | "in";
type GroupBrand = { brand_name: string; kind: ApplicantKind; category: string; website: string; city: string };
type Detail = {
  group: BrandGroup | null;
  location: BoardItem | null;
  wanted: BoardItem[];
  brands: GroupBrand[];
  mood: MoodboardItem[];
};

export default function BrandPanel() {
  const db = browserClient();
  const [access, setAccess] = useState<Access>("loading");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [apps, setApps] = useState<Application[]>([]);
  const [current, setCurrent] = useState(0);
  const [detail, setDetail] = useState<Detail>({
    group: null,
    location: null,
    wanted: [],
    brands: [],
    mood: [],
  });
  const { group, location, wanted, brands, mood } = detail;
  const [message, setMessage] = useState("");

  const app = apps[current] ?? null;

  const loadApps = useCallback(async () => {
    if (!db) return;
    const { data } = await db
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });
    setApps((data ?? []) as Application[]);
  }, [db]);

  const fetchDetail = useCallback(async (): Promise<Detail> => {
    const empty: Detail = { group: null, location: null, wanted: [], brands: [], mood: [] };
    if (!db || !app) return empty;
    const wanted = app.location_ids.length
      ? (((await db.from("board_items").select("*").in("id", app.location_ids)).data ?? []) as BoardItem[])
      : [];
    if (!app.group_id) return { ...empty, wanted };
    const [g, b, m] = await Promise.all([
      db.from("brand_groups").select("*").eq("id", app.group_id).maybeSingle(),
      db.rpc("group_brands", { g: app.group_id }),
      db.from("moodboard_items").select("*").eq("group_id", app.group_id).order("created_at"),
    ]);
    const group = g.data as BrandGroup | null;
    const location = group?.location_id
      ? ((await db.from("board_items").select("*").eq("id", group.location_id).maybeSingle()).data as BoardItem | null)
      : null;
    return {
      group,
      location,
      wanted,
      brands: (b.data ?? []) as GroupBrand[],
      mood: (m.data ?? []) as MoodboardItem[],
    };
  }, [db, app]);

  const loadDetail = () => fetchDetail().then(setDetail);

  useEffect(() => {
    if (!db) return;
    const { data: sub } = db.auth.onAuthStateChange(async (_e, session) => {
      if (!session) {
        setAccess("anon");
        return;
      }
      setEmail(session.user.email ?? "");
      setUserId(session.user.id);
      const { data: profile } = await db
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();
      setIsAdmin(profile?.role === "admin");
      await loadApps();
      setAccess("in");
    });
    return () => sub.subscription.unsubscribe();
  }, [db, loadApps]);

  useEffect(() => {
    fetchDetail().then(setDetail);
  }, [fetchDetail]);

  if (!db) {
    return (
      <Shell>
        <p className="notice notice--error">Il pannello non è ancora configurato.</p>
      </Shell>
    );
  }
  if (access === "loading") return <Shell><p className="muted">Caricamento…</p></Shell>;
  if (access === "anon") {
    return (
      <Shell>
        <p className="lead">Entra con l&apos;email che hai usato per candidarti.</p>
        <div className="row">
          <Link href="/login" className="btn">Accedi</Link>
          <Link href="/candidatura" className="btn btn--ghost">Non ti sei ancora candidato?</Link>
        </div>
      </Shell>
    );
  }

  const stepIndex = app ? STATUS_STEPS.findIndex((s) => s.id === app.status) : -1;
  const declined = app?.status === "non_selezionata";
  const moodOpen = app && !declined && stepIndex >= STATUS_STEPS.findIndex((s) => s.id === "moodboard");

  return (
    <Shell>
      <div className="row row--between">
        <div className="mono">Accesso come {email}</div>
        <div className="row" style={{ gap: 12 }}>
          {isAdmin && <Link href="/admin" className="btn btn--small">Media center</Link>}
          <button className="btn btn--ghost btn--small" onClick={() => db.auth.signOut()}>Esci</button>
        </div>
      </div>

      {!app ? (
        <div className="stack">
          <p className="lead">
            Non troviamo candidature collegate a {email}. Se ti sei candidato con
            un&apos;altra email, entra con quella.
          </p>
          <div><Link href="/candidatura" className="btn btn--accent">Candida il tuo brand</Link></div>
        </div>
      ) : (
        <>
          {apps.length > 1 && (
            <div className="filters">
              {apps.map((a, i) => (
                <button key={a.id} className="filter mono" aria-pressed={i === current} onClick={() => setCurrent(i)}>
                  {a.brand_name} · {new Date(a.created_at).toLocaleDateString("it-IT")}
                </button>
              ))}
            </div>
          )}

          <section className="panel-head" data-reveal>
            <div className="mono">{APPLICANT_LABEL[app.kind]} · {app.city} · {app.category}</div>
            <h1 className="h-hero">{app.brand_name}</h1>
          </section>

          {/* ---------- stato ---------- */}
          <section className="panel-block">
            <div className="row row--between">
              <h2 className="h-card">Stato della candidatura</h2>
              {!declined && (
                <div className="mono">Passaggio {stepIndex + 1} di {STATUS_STEPS.length}</div>
              )}
            </div>
            {declined ? (
              <p className="notice">
                Per questa giornata non siamo riusciti a inserirti in un gruppo
                coerente. Teniamo il tuo profilo per le prossime Open Call: ti
                scriviamo quando c&apos;è una location adatta ai tuoi capi.
              </p>
            ) : (
              <>
                <div className="meter" aria-hidden="true">
                  <div style={{ transform: `scaleX(${(stepIndex + 1) / STATUS_STEPS.length})` }} />
                </div>
                <ol className="timeline timeline--panel">
                  {STATUS_STEPS.map((s, i) => (
                    <li key={s.id} data-state={i < stepIndex ? "done" : i === stepIndex ? "current" : "next"}>
                      <strong>{s.label}</strong>
                      {i === stepIndex && <span>{s.text}</span>}
                    </li>
                  ))}
                </ol>
              </>
            )}
            {app.team_note && (
              <div className="note">
                <div className="mono">Messaggio dal team</div>
                <p>{app.team_note}</p>
              </div>
            )}
          </section>

          {/* ---------- gruppo ---------- */}
          <section className="panel-block">
            <h2 className="h-card">Il tuo gruppo</h2>
            {!group ? (
              <div className="group-wait">
                <div className="group-wait__slots" aria-hidden="true">
                  <span data-me="true">{app.brand_name}</span>
                  <span>?</span>
                  <span>?</span>
                  <span>?</span>
                </div>
                <p className="muted">
                  Stiamo cercando i brand giusti da affiancarti: categorie
                  diverse, un&apos;estetica che si parla. Quando il gruppo è
                  formato li vedi qui, con la location e la data.
                </p>
              </div>
            ) : (
              <div className="group">
                <div className="group__info">
                  <div className="mono">{group.date_label || "Data da fissare"}</div>
                  <h3 className="h-section">{group.name}</h3>
                  {group.concept && <p className="lead lead--narrow">{group.concept}</p>}
                  <div className="group__brands">
                    {brands.map((b, i) => {
                      const me = b.brand_name === app.brand_name;
                      return (
                        <div className="group__brand" data-me={me} key={i} data-reveal style={{ "--d": `${i * 80}ms` } as React.CSSProperties}>
                          <span className="mono">{b.category || APPLICANT_LABEL[b.kind]}</span>
                          <strong>{b.brand_name}{me ? " (tu)" : ""}</strong>
                          <span className="muted">{b.city}{b.website ? ` · ${b.website}` : ""}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {location && (
                  <div className="group__loc">
                    <Tile src={location.image_url} alt={location.title} placeholder="[FOTO LOCATION]" />
                    <div className="mono">Location · {location.city}</div>
                    <strong className="h-step">{location.title}</strong>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ---------- moodboard ---------- */}
          <section className="panel-block">
            <div className="row row--between">
              <h2 className="h-card">Moodboard comune</h2>
              <div className="mono">{mood.length} riferimenti</div>
            </div>
            {!moodOpen || !group ? (
              <p className="muted">
                La moodboard si apre quando il gruppo è formato. Intanto puoi
                cominciare a raccogliere riferimenti: luce, pose, palette,
                dettagli dei tuoi capi.
              </p>
            ) : (
              <>
                <form
                  className="mood-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const f = new FormData(form);
                    const file = f.get("image") as File | null;
                    if (!file || file.size === 0) return;
                    setMessage("Caricamento…");
                    try {
                      const image_url = await uploadImage(db, `moodboard/${userId}`, file);
                      const { error } = await db.from("moodboard_items").insert({
                        group_id: group.id,
                        application_id: app.id,
                        image_url,
                        caption: String(f.get("caption") ?? ""),
                      });
                      if (error) throw error;
                      form.reset();
                      setMessage("");
                      loadDetail();
                    } catch {
                      setMessage("Non siamo riusciti a caricare l'immagine. Riprova.");
                    }
                  }}
                >
                  <input name="image" type="file" accept="image/*" className="input" required />
                  <input name="caption" className="input" placeholder="Una nota: perché questa immagine?" maxLength={300} />
                  <button className="btn">Aggiungi</button>
                </form>
                {message && <p className="notice" role="status">{message}</p>}
                <div className="board">
                  {mood.map((m, i) => (
                    <figure className="board-card" key={m.id} data-reveal style={{ "--d": `${(i % 4) * 60}ms` } as React.CSSProperties}>
                      <div className="board-card__img" style={{ aspectRatio: ["4 / 5", "1 / 1", "3 / 4"][i % 3] }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.image_url} alt={m.caption || "Riferimento"} loading="lazy" />
                      </div>
                      <figcaption className="board-card__cap">
                        <span className="mono">{m.application_id === app.id ? "Tuo" : m.application_id ? "Dal gruppo" : "Dal team"}</span>
                        {m.caption && <span>{m.caption}</span>}
                        {m.application_id === app.id && (
                          <button
                            className="link"
                            onClick={async () => {
                              await db.from("moodboard_items").delete().eq("id", m.id);
                              loadDetail();
                            }}
                          >
                            Rimuovi
                          </button>
                        )}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* ---------- profilo ---------- */}
          <section className="panel-block">
            <h2 className="h-card">La tua candidatura</h2>
            <div className="summary">
              <div><span className="mono">Inviata il</span>{new Date(app.created_at).toLocaleDateString("it-IT")}</div>
              <div><span className="mono">Sito / Instagram</span>{app.website}</div>
              <div><span className="mono">Capi</span>{app.category} · {app.pieces}</div>
              <div><span className="mono">Stile</span>{app.keywords}</div>
              <div><span className="mono">Location scelte</span>{wanted.length ? wanted.map((w) => w.title).join(", ") : "Scegliete voi"}</div>
              {app.message && <div><span className="mono">Obiettivo</span>{app.message}</div>}
            </div>
          </section>
        </>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader current="/login" />
      <main className="admin panel">
        <div className="mono">Pannello brand</div>
        {children}
      </main>
    </>
  );
}
