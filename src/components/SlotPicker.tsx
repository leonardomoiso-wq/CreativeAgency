"use client";

import { useState } from "react";
import type { Category } from "@/lib/data";
import { browserClient } from "@/lib/supabase";

type Status = "idle" | "sending" | "sent" | "error";

export function SlotPicker({
  categories,
  openCallId,
  depositLabel,
}: {
  categories: Category[];
  openCallId: string | null;
  depositLabel: string;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const category = picked === null ? null : categories[picked];
  const full = categories.every((c) => c.taken);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const db = browserClient();
    if (!db || !openCallId || !category?.id) {
      setStatus("error");
      setError(
        "Le prenotazioni non sono ancora attive. Scrivici via email per riservare il posto.",
      );
      return;
    }
    setStatus("sending");
    const { error: err } = await db.from("bookings").insert({
      open_call_id: openCallId,
      category_id: category.id,
      brand_name: String(form.get("brand") ?? ""),
      email: String(form.get("email") ?? ""),
      website: String(form.get("website") ?? ""),
      message: String(form.get("message") ?? ""),
    });
    if (err) {
      setStatus("error");
      setError("Non siamo riusciti a inviare la richiesta. Riprova tra poco.");
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="split">
      <div className="split__aside">
        <div className="mono">Esclusiva di categoria</div>
        <h2 className="h-section">Un solo brand per categoria.</h2>
        <p className="muted">
          Ogni produzione accoglie un solo brand per categoria merceologica,
          così nessuna collezione condivide il set con un concorrente diretto.
          Scegli la tua tra quelle disponibili e invia la richiesta.
        </p>

        {status === "sent" ? (
          <p className="notice" role="status">
            Richiesta ricevuta per «{category?.name}». Ti scriviamo entro 48 ore
            per confermare il posto.
          </p>
        ) : category ? (
          <form className="form" onSubmit={submit}>
            <div className="mono">Richiesta per: {category.name}</div>
            <div className="field">
              <label htmlFor="bk-brand">Nome del brand</label>
              <input id="bk-brand" name="brand" className="input" required />
            </div>
            <div className="field">
              <label htmlFor="bk-email">Email</label>
              <input
                id="bk-email"
                name="email"
                type="email"
                className="input"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="bk-web">Sito o Instagram del brand</label>
              <input id="bk-web" name="website" className="input" />
            </div>
            <div className="field">
              <label htmlFor="bk-msg">Cosa vorresti scattare</label>
              <textarea id="bk-msg" name="message" className="input" />
            </div>
            <button className="btn" disabled={status === "sending"}>
              {status === "sending" ? "Invio in corso…" : "Richiedi il posto"}
            </button>
            {status === "error" && (
              <p className="notice notice--error" role="alert">
                {error}
              </p>
            )}
            <div className="mono muted">
              Acconto {depositLabel} alla conferma · saldo prima del set
            </div>
          </form>
        ) : (
          <p className="notice">
            {full
              ? "Open Call al completo. Scrivici per entrare in lista d’attesa."
              : "Seleziona una categoria disponibile per richiedere il posto."}
          </p>
        )}
      </div>

      <div className="split__main cats">
        {categories.map((c, i) => (
          <button
            key={c.id ?? c.name}
            type="button"
            className="cat"
            disabled={c.taken}
            aria-pressed={picked === i}
            onClick={() => {
              setPicked(picked === i ? null : i);
              setStatus("idle");
            }}
          >
            <span className="mono cat__num">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="cat__name">{c.name}</span>
            <span className="mono cat__tag">
              {c.taken ? "Occupato" : picked === i ? "Selezionato" : "Libero"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
