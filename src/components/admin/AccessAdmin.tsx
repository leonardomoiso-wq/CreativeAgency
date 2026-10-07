"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

type Profile = { id: string; email: string | null };

/** Chi del team entra nel media center, e cambio della propria password. */
export function AccessAdmin({
  db,
  me,
  notify,
}: {
  db: SupabaseClient;
  me: string;
  notify: (msg: string) => void;
}) {
  const [admins, setAdmins] = useState<Profile[]>([]);

  const fetchAdmins = useCallback(async () => {
    const { data } = await db.from("profiles").select("id, email").eq("role", "admin").order("email");
    return (data ?? []) as Profile[];
  }, [db]);

  useEffect(() => {
    fetchAdmins().then(setAdmins);
  }, [fetchAdmins]);

  return (
    <div className="admin__grid">
      <div className="stack">
        <div className="mono">Persone con accesso</div>
        <div className="admin__list">
          {admins.map((a) => (
            <div className="admin__item" key={a.id}>
              <strong>{a.email}</strong>
              {a.email === me ? (
                <span className="mono">Tu</span>
              ) : (
                <button
                  className="btn btn--ghost btn--small"
                  onClick={async () => {
                    if (!confirm(`Togliere l'accesso a ${a.email}?`)) return;
                    const { error } = await db.from("profiles").update({ role: "brand" }).eq("id", a.id);
                    notify(error ? `Errore: ${error.message}` : `Accesso tolto a ${a.email}.`);
                    fetchAdmins().then(setAdmins);
                  }}
                >
                  Togli accesso
                </button>
              )}
            </div>
          ))}
        </div>
        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const email = String(new FormData(form).get("email") ?? "").trim().toLowerCase();
            const { data, error } = await db
              .from("profiles")
              .update({ role: "admin" })
              .ilike("email", email)
              .select("id");
            if (error) notify(`Errore: ${error.message}`);
            else if (!data?.length)
              notify(
                `Nessun account con ${email}. Crealo prima in Supabase > Authentication > Users > Add user, con email e password.`,
              );
            else {
              notify(`${email} ora entra nel media center.`);
              form.reset();
            }
            fetchAdmins().then(setAdmins);
          }}
        >
          <div className="field">
            <label htmlFor="ac-email">Dai accesso a un&apos;email</label>
            <input id="ac-email" name="email" type="email" className="input" required />
            <span className="hint">
              L&apos;account deve esistere: crealo in Supabase (Authentication &gt;
              Users &gt; Add user) con email e password, poi aggiungilo qui.
            </span>
          </div>
          <button className="btn btn--ghost">Dai accesso</button>
        </form>
      </div>

      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const f = new FormData(form);
          const password = String(f.get("password") ?? "");
          if (password !== String(f.get("again") ?? "")) {
            notify("Le due password non coincidono.");
            return;
          }
          const { error } = await db.auth.updateUser({ password });
          notify(error ? `Errore: ${error.message}` : "Password aggiornata.");
          if (!error) form.reset();
        }}
      >
        <div className="mono">La tua password</div>
        <div className="field">
          <label htmlFor="ac-pw">Nuova password</label>
          <input id="ac-pw" name="password" type="password" minLength={8} className="input" autoComplete="new-password" required />
        </div>
        <div className="field">
          <label htmlFor="ac-pw2">Ripeti la password</label>
          <input id="ac-pw2" name="again" type="password" minLength={8} className="input" autoComplete="new-password" required />
        </div>
        <button className="btn btn--ghost">Cambia password</button>
      </form>
    </div>
  );
}
