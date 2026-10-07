"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  APPLICANT_LABEL,
  STATUS_STEPS,
  type ApplicantKind,
  type BoardItem,
  type Category,
} from "@/lib/data";
import { browserClient } from "@/lib/supabase";
import { CONTACT_EMAIL } from "@/lib/site";
import { Tile } from "./Tile";

const STEPS = ["Prima di iniziare", "Chi sei", "I tuoi capi", "Location", "Il tuo accesso"];

const KIND_HINT: Record<ApplicantKind, string> = {
  brand: "Hai una collezione tua, venduta online o in negozi.",
  negozio: "Selezioni e vendi capi di più marchi, o il tuo.",
  atelier: "Realizzi capi su misura o in piccole serie.",
  designer: "Stai lanciando la tua prima collezione o capsule.",
};

const PIECES = ["Fino a 5 capi", "Da 6 a 15 capi", "Oltre 15 capi"];

type Draft = {
  kind: ApplicantKind;
  brand_name: string;
  city: string;
  website: string;
  category: string;
  pieces: string;
  keywords: string;
  message: string;
  location_ids: string[];
  email: string;
};

export function ApplyFlow({
  categories,
  locations,
}: {
  categories: Category[];
  locations: BoardItem[];
}) {
  const params = useSearchParams();
  const free = categories.filter((c) => !c.taken).map((c) => c.name);
  const preset = params.get("categoria") ?? "";

  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [d, setD] = useState<Draft>({
    kind: "brand",
    brand_name: "",
    city: "",
    website: "",
    category: free.includes(preset) ? preset : "",
    pieces: "",
    keywords: "",
    message: "",
    location_ids: [],
    email: "",
  });

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  function next(e?: React.FormEvent) {
    e?.preventDefault();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const db = browserClient();
    if (!db) {
      setStatus("error");
      setError(`Le candidature online non sono ancora attive. Scrivici a ${CONTACT_EMAIL}.`);
      return;
    }
    setStatus("sending");
    const email = d.email.trim().toLowerCase();
    const { error: err } = await db.from("applications").insert({
      ...d,
      email,
      // le location segnaposto (database vuoto) non hanno un id vero
      location_ids: d.location_ids.filter((id) => !id.startsWith("fallback-")),
    });
    if (err) {
      setStatus("error");
      setError("Non siamo riusciti a inviare la candidatura. Riprova tra poco.");
      return;
    }
    // Il link d'accesso apre il pannello del brand.
    await db.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/brand` },
    });
    setStatus("sent");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (status === "sent") {
    return (
      <div className="apply__done step-in">
        <div className="mono">Candidatura inviata</div>
        <h1 className="h-section">Grazie, {d.brand_name}.</h1>
        <p className="lead">
          Ti abbiamo mandato un link a <strong>{d.email}</strong>. Aprilo per
          entrare nel tuo pannello: da lì segui ogni passaggio, dalla
          valutazione alla consegna delle immagini.
        </p>
        <ol className="timeline">
          {STATUS_STEPS.slice(0, 5).map((s, i) => (
            <li key={s.id} data-state={i === 0 ? "current" : "next"}>
              <strong>{s.label}</strong>
              <span className="muted">{s.text}</span>
            </li>
          ))}
        </ol>
        <Link href="/" className="link">Torna alla Open Call</Link>
      </div>
    );
  }

  return (
    <div className="apply__wrap">
      <ol className="apply__steps mono" aria-label="Passaggi">
        {STEPS.map((s, i) => (
          <li key={s} data-state={i < step ? "done" : i === step ? "current" : "next"}>
            <button type="button" disabled={i > step} onClick={() => setStep(i)}>
              <span>{String(i).padStart(2, "0")}</span> {s}
            </button>
          </li>
        ))}
      </ol>
      <div className="apply__bar" aria-hidden="true">
        <div style={{ transform: `scaleX(${step / (STEPS.length - 1)})` }} />
      </div>

      <div className="step-in" key={step}>
        {step === 0 && (
          <div className="apply__step">
            <h1 className="h-section">Prima di candidarti, tre cose.</h1>
            <div className="apply__intro">
              <div>
                <span className="how__num">01</span>
                <p>
                  <strong>Si parte da una location.</strong> Scegli i luoghi
                  in cui vedresti i tuoi capi; la giornata si costruisce lì.
                </p>
              </div>
              <div>
                <span className="how__num">02</span>
                <p>
                  <strong>Scatti con altri brand.</strong> Ti abbiniamo a
                  brand complementari, mai a un concorrente diretto. Insieme
                  costruite la moodboard.
                </p>
              </div>
              <div>
                <span className="how__num">03</span>
                <p>
                  <strong>Candidarsi non impegna.</strong> L&apos;acconto si
                  versa solo quando il gruppo è formato e tu confermi.
                </p>
              </div>
            </div>
            <p className="muted">
              Ti servono cinque minuti, il link al tuo sito o profilo
              Instagram e un&apos;idea dei capi che porteresti.
            </p>
            <div>
              <button type="button" className="btn btn--accent" onClick={() => next()}>
                Iniziamo
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <form className="apply__step" onSubmit={next}>
            <h2 className="h-section">Chi sei?</h2>
            <div className="choice-grid" role="radiogroup" aria-label="Tipo di attività">
              {(Object.keys(APPLICANT_LABEL) as ApplicantKind[]).map((k) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={d.kind === k}
                  className="choice"
                  key={k}
                  onClick={() => set("kind", k)}
                >
                  <strong>{APPLICANT_LABEL[k]}</strong>
                  <span className="muted">{KIND_HINT[k]}</span>
                </button>
              ))}
            </div>
            <div className="form">
              <Input label="Nome del brand o del negozio" value={d.brand_name} onChange={(v) => set("brand_name", v)} required />
              <Input label="Città" value={d.city} onChange={(v) => set("city", v)} required />
              <Input label="Sito o profilo Instagram" value={d.website} onChange={(v) => set("website", v)} placeholder="@tuobrand oppure tuobrand.it" required />
            </div>
            <Nav onBack={() => setStep(0)} />
          </form>
        )}

        {step === 2 && (
          <form className="apply__step" onSubmit={next}>
            <h2 className="h-section">Cosa porteresti sul set?</h2>
            <div className="form">
              <div className="field">
                <label htmlFor="ap-cat">Categoria principale</label>
                <select id="ap-cat" className="input" value={d.category} onChange={(e) => set("category", e.target.value)} required>
                  <option value="" disabled>Scegli una categoria</option>
                  {free.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Altro">Altro (lo racconti sotto)</option>
                </select>
                <span className="hint">Un solo brand per categoria in ogni giornata: niente concorrenti accanto a te.</span>
              </div>
              <fieldset className="field">
                <legend>Quanti capi potresti portare?</legend>
                <div className="pills">
                  {PIECES.map((p) => (
                    <label className="pill" key={p}>
                      <input type="radio" name="pieces" value={p} checked={d.pieces === p} onChange={() => set("pieces", p)} required />
                      <span>{p}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <Input label="Il tuo stile in tre parole" value={d.keywords} onChange={(v) => set("keywords", v)} placeholder="es. sartoriale, essenziale, mediterraneo" required />
              <div className="field">
                <label htmlFor="ap-msg">Cosa vorresti ottenere da queste immagini? (facoltativo)</label>
                <textarea id="ap-msg" className="input" value={d.message} onChange={(e) => set("message", e.target.value)} placeholder="Nuova collezione, e-commerce, campagna social, lookbook per i buyer…" />
              </div>
            </div>
            <Nav onBack={() => setStep(1)} />
          </form>
        )}

        {step === 3 && (
          <form className="apply__step" onSubmit={next}>
            <h2 className="h-section">Dove vedi i tuoi capi?</h2>
            <p className="muted">
              Scegli una o più location. È il primo criterio con cui
              componiamo i gruppi: puoi anche saltare e lasciar decidere a noi.
            </p>
            <div className="loc-pick">
              {locations.map((l, i) => {
                const id = l.id ?? `fallback-${i}`;
                const on = d.location_ids.includes(id);
                return (
                  <button
                    type="button"
                    key={id}
                    className="loc-pick__item"
                    aria-pressed={on}
                    disabled={!l.available}
                    onClick={() =>
                      set(
                        "location_ids",
                        on ? d.location_ids.filter((x) => x !== id) : [...d.location_ids, id],
                      )
                    }
                  >
                    <Tile src={l.image_url} alt={l.title} placeholder={`[FOTO — ${l.city}]`} />
                    <span className="mono">{l.available ? l.city : "Già prenotata"}</span>
                    <strong>{l.title}</strong>
                    <span className="loc-pick__check" aria-hidden="true">{on ? "✓" : "+"}</span>
                  </button>
                );
              })}
            </div>
            <Nav onBack={() => setStep(2)} nextLabel={d.location_ids.length ? `Avanti con ${d.location_ids.length} location` : "Avanti, scegliete voi"} />
          </form>
        )}

        {step === 4 && (
          <form className="apply__step" onSubmit={submit}>
            <h2 className="h-section">Il tuo accesso.</h2>
            <p className="muted">
              Con la tua email apriamo il tuo pannello brand: lì vedi lo stato
              della candidatura, i brand con cui verrai abbinato e la moodboard
              comune. Niente password: ricevi un link.
            </p>
            <div className="summary">
              <div><span className="mono">Attività</span>{APPLICANT_LABEL[d.kind]} · {d.brand_name} · {d.city}</div>
              <div><span className="mono">Capi</span>{d.category} · {d.pieces}</div>
              <div><span className="mono">Stile</span>{d.keywords}</div>
              <div><span className="mono">Location</span>{d.location_ids.length ? locations.filter((l, i) => d.location_ids.includes(l.id ?? `fallback-${i}`)).map((l) => l.title).join(", ") : "Scegliete voi"}</div>
            </div>
            <div className="form">
              <Input label="Email" type="email" value={d.email} onChange={(v) => set("email", v)} required autoComplete="email" />
              <label className="check">
                <input type="checkbox" required /> Accetto che i miei dati siano usati per valutare la candidatura.
              </label>
            </div>
            {status === "error" && (
              <p className="notice notice--error" role="alert">{error}</p>
            )}
            <div className="apply__nav">
              <button type="button" className="btn btn--ghost" onClick={() => setStep(3)}>Indietro</button>
              <button className="btn btn--accent" disabled={status === "sending"}>
                {status === "sending" ? "Invio in corso…" : "Invia la candidatura"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Nav({ onBack, nextLabel = "Avanti" }: { onBack: () => void; nextLabel?: string }) {
  return (
    <div className="apply__nav">
      <button type="button" className="btn btn--ghost" onClick={onBack}>Indietro</button>
      <button className="btn">{nextLabel}</button>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  const id = `ap-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </div>
  );
}
