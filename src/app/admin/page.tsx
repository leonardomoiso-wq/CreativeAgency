"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SITE_NAME } from "@/lib/site";
import { browserClient, missingEnv } from "@/lib/supabase";
import { MediaCenter } from "@/components/admin/MediaCenter";
import { TextsAdmin } from "@/components/admin/TextsAdmin";
import { ApplicationsAdmin } from "@/components/admin/ApplicationsAdmin";
import { OpenCallAdmin } from "@/components/admin/OpenCallAdmin";
import { AccessAdmin } from "@/components/admin/AccessAdmin";
import type { Run } from "@/components/admin/shared";

type Access = "loading" | "anon" | "recovery" | "denied" | "admin";

const TABS = [
  { id: "media", label: "Immagini" },
  { id: "testi", label: "Testi" },
  { id: "candidature", label: "Candidature" },
  { id: "opencall", label: "Open Call" },
  { id: "accessi", label: "Accessi" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export default function MediaCenterPage() {
  const db = browserClient();
  const [access, setAccess] = useState<Access>("loading");
  const [email, setEmail] = useState("");
  const [tab, setTab] = useState<Tab>("media");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!db) return;
    const { data: sub } = db.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setAccess("recovery");
        return;
      }
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
      setAccess((a) => (a === "recovery" ? a : profile?.role === "admin" ? "admin" : "denied"));
    });
    return () => sub.subscription.unsubscribe();
  }, [db]);

  // i messaggi spariscono da soli dopo qualche secondo
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 5000);
    return () => clearTimeout(t);
  }, [message]);

  if (!db) {
    return (
      <Shell>
        <div className="notice notice--error stack">
          <p>
            Supabase non è collegato: su Vercel mancano{" "}
            {missingEnv.map((v) => <code key={v}>{v} </code>)}
          </p>
          <p>
            Aggiungile in Vercel &gt; Settings &gt; Environment Variables, per
            Production e Preview, poi rifai il deploy: il sito le legge solo
            durante la build.
          </p>
        </div>
      </Shell>
    );
  }
  if (access === "loading") return <Shell><p className="muted">Caricamento…</p></Shell>;
  if (access === "anon") return <Shell><PasswordLogin /></Shell>;
  if (access === "recovery") {
    return (
      <Shell>
        <NewPassword onDone={() => setAccess("loading")} />
      </Shell>
    );
  }
  if (access === "denied") {
    return (
      <Shell>
        <p className="notice">
          L&apos;account {email} non ha accesso al media center.
        </p>
        <div className="row" style={{ gap: 12 }}>
          <Link href="/brand" className="btn">Vai al pannello brand</Link>
          <button className="btn btn--ghost" onClick={() => db.auth.signOut()}>Esci</button>
        </div>
      </Shell>
    );
  }

  // Tabelle mancanti = schema.sql non rieseguito dopo l'aggiornamento.
  const explain = (msg: string) =>
    /schema cache|does not exist/i.test(msg)
      ? "Il database non è aggiornato: in Supabase apri SQL Editor, incolla tutto supabase/schema.sql ed esegui. Poi ricarica questa pagina."
      : msg;
  const notify = (msg: string) => setMessage(explain(msg));
  const run: Run = async (label, fn) => {
    setMessage("Salvataggio…");
    try {
      const res = await fn();
      if (res && res.error) throw res.error;
      setMessage(`${label}: fatto. Sul sito entro un minuto.`);
    } catch (e) {
      setMessage(explain(`${label}: errore. ${(e as { message?: string })?.message ?? ""}`));
    }
  };

  return (
    <Shell
      bar={
        <>
          <nav className="mc-tabs" aria-label="Media center">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className="mc-tab"
                aria-current={tab === t.id}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <div className="mc-user mono">
            <span>{email}</span>
            <button className="link" onClick={() => db.auth.signOut()}>Esci</button>
          </div>
        </>
      }
    >
      {message && (
        <p className="toast" role="status">
          {message}
        </p>
      )}
      {tab === "media" && <MediaCenter db={db} notify={notify} />}
      {tab === "testi" && <TextsAdmin db={db} notify={notify} />}
      {tab === "candidature" && <ApplicationsAdmin db={db} run={run} />}
      {tab === "opencall" && <OpenCallAdmin db={db} run={run} />}
      {tab === "accessi" && <AccessAdmin db={db} me={email} notify={notify} />}
    </Shell>
  );
}

function PasswordLogin() {
  const db = browserClient()!;
  const [status, setStatus] = useState<"idle" | "sending" | "reset-sent">("idle");
  const [error, setError] = useState("");

  return (
    <form
      className="form mc-login"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setStatus("sending");
        setError("");
        const { error: err } = await db.auth.signInWithPassword({
          email: String(f.get("email") ?? ""),
          password: String(f.get("password") ?? ""),
        });
        setStatus("idle");
        if (err) setError("Email o password non corretti.");
      }}
    >
      <h1 className="h-section">Media center</h1>
      <p className="muted">Accesso riservato al team.</p>
      <div className="field">
        <label htmlFor="mc-email">Email</label>
        <input id="mc-email" name="email" type="email" className="input" autoComplete="username" required />
      </div>
      <div className="field">
        <label htmlFor="mc-pw">Password</label>
        <input id="mc-pw" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>
      <button className="btn" disabled={status === "sending"}>
        {status === "sending" ? "Accesso…" : "Entra"}
      </button>
      {error && <p className="notice notice--error" role="alert">{error}</p>}
      {status === "reset-sent" ? (
        <p className="notice" role="status">
          Se l&apos;email è del team, ti è arrivato un link per scegliere una nuova password.
        </p>
      ) : (
        <button
          type="button"
          className="link"
          onClick={async (e) => {
            const email = (e.currentTarget.form?.elements.namedItem("email") as HTMLInputElement)?.value;
            if (!email) {
              setError("Scrivi prima la tua email, poi clicca qui.");
              return;
            }
            await db.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/admin`,
            });
            setStatus("reset-sent");
          }}
        >
          Password dimenticata?
        </button>
      )}
    </form>
  );
}

function NewPassword({ onDone }: { onDone: () => void }) {
  const db = browserClient()!;
  const [error, setError] = useState("");
  return (
    <form
      className="form mc-login"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const password = String(f.get("password") ?? "");
        if (password !== String(f.get("again") ?? "")) {
          setError("Le due password non coincidono.");
          return;
        }
        const { error: err } = await db.auth.updateUser({ password });
        if (err) setError(err.message);
        else {
          onDone();
          window.location.reload();
        }
      }}
    >
      <h1 className="h-section">Nuova password</h1>
      <div className="field">
        <label htmlFor="np-1">Nuova password (almeno 8 caratteri)</label>
        <input id="np-1" name="password" type="password" minLength={8} className="input" autoComplete="new-password" required />
      </div>
      <div className="field">
        <label htmlFor="np-2">Ripetila</label>
        <input id="np-2" name="again" type="password" minLength={8} className="input" autoComplete="new-password" required />
      </div>
      <button className="btn">Salva e entra</button>
      {error && <p className="notice notice--error" role="alert">{error}</p>}
    </form>
  );
}

function Shell({ children, bar }: { children: React.ReactNode; bar?: React.ReactNode }) {
  return (
    <div className="mc-shell">
      <header className="mc-top">
        <Link href="/" className="wordmark">{SITE_NAME}</Link>
        <span className="mono mc-top__label">Media center</span>
        {bar}
      </header>
      <main className="mc-body">{children}</main>
    </div>
  );
}
