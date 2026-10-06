"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { browserClient } from "@/lib/supabase";

export default function LoginPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "");
    const db = browserClient();
    if (!db) {
      setStatus("error");
      setError("Il login non è ancora configurato.");
      return;
    }
    setStatus("sending");
    const { error: err } = await db.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    if (err) {
      setStatus("error");
      setError(err.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <>
      <SiteHeader current="/login" />
      <main className="section section--hero">
        <div className="mono">Area riservata</div>
        <h1 className="h-section">Accedi</h1>
        {status === "sent" ? (
          <p className="notice" role="status">
            Ti abbiamo inviato un link di accesso. Aprilo da questo dispositivo
            per entrare.
          </p>
        ) : (
          <form className="form" onSubmit={submit}>
            <p className="muted">
              Inserisci la tua email: ricevi un link per entrare, senza
              password.
            </p>
            <div className="field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                className="input"
                autoComplete="email"
                required
              />
            </div>
            <button className="btn" disabled={status === "sending"}>
              {status === "sending" ? "Invio in corso…" : "Invia il link"}
            </button>
            {status === "error" && (
              <p className="notice notice--error" role="alert">
                {error}
              </p>
            )}
          </form>
        )}
      </main>
    </>
  );
}
