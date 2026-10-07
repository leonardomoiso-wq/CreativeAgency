"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, OpenCall } from "@/lib/data";
import { Field, type Run } from "./shared";

type Call = OpenCall & { id: string; published: boolean };

export function OpenCallAdmin({ db, run }: { db: SupabaseClient; run: Run }) {
  const [call, setCall] = useState<Call | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const fetchCall = useCallback(async () => {
    const { data: c } = await db
      .from("open_calls")
      .select("*")
      .order("number", { ascending: false })
      .limit(1)
      .maybeSingle();
    const cats = c
      ? ((await db.from("categories").select("*").eq("open_call_id", c.id).order("position")).data ?? [])
      : [];
    return { call: c as Call | null, categories: cats as Category[] };
  }, [db]);

  const apply = (r: { call: Call | null; categories: Category[] }) => {
    setCall(r.call);
    setCategories(r.categories);
  };

  useEffect(() => {
    fetchCall().then((r) => {
      setCall(r.call);
      setCategories(r.categories);
    });
  }, [fetchCall]);

  const act: Run = (label, fn) => run(label, fn).then(() => fetchCall().then(apply));

  if (!call) {
    return <p className="muted">Nessuna Open Call nel database: esegui il file supabase/schema.sql.</p>;
  }

  return (
    <div className="admin__grid">
      <form
        className="form"
        key={call.id + call.number}
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          act("Open Call", async () =>
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
        <Field label="Chiusura candidature" name="closes_label" defaultValue={call.closes_label} />
        <Field label="Acconto" name="deposit_label" defaultValue={call.deposit_label} />
        <label className="check">
          <input type="checkbox" name="published" defaultChecked={call.published} /> Pubblicata sul sito
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
                    act("Categoria", async () =>
                      db.from("categories").update({ taken: e.target.checked }).eq("id", c.id),
                    )
                  }
                />{" "}
                Occupata
              </label>
              <button
                className="btn btn--ghost btn--small"
                onClick={() =>
                  act("Categoria rimossa", async () => db.from("categories").delete().eq("id", c.id))
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
            act("Categoria aggiunta", async () =>
              db.from("categories").insert({ open_call_id: call.id, name, position: categories.length }),
            ).then(() => form.reset());
          }}
        >
          <Field label="Nuova categoria" name="name" required />
          <button className="btn btn--ghost">Aggiungi categoria</button>
        </form>
      </div>
    </div>
  );
}
