import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Tile } from "@/components/Tile";
import { Marquee } from "@/components/Marquee";
import { CountUp } from "@/components/CountUp";
import { BoardCard } from "@/components/BoardCard";
import { APPLICANT_LABEL, KIND_LABEL } from "@/lib/data";
import { getBoard, getOpenCall, getProjects, getTeam } from "@/lib/queries";

const STEPS = [
  {
    title: "Partiamo dalle location",
    text: "Ogni giornata nasce da un luogo che abbiamo già visto, fotografato e bloccato. La location è il punto fermo: tutto il resto si costruisce intorno.",
  },
  {
    title: "Ti candidi",
    text: "Racconti chi sei, cosa porteresti sul set e quali location senti tue. Cinque minuti, nessun impegno.",
  },
  {
    title: "Ti abbiniamo",
    text: "Scegliamo brand che si completano in un total look: un solo brand per categoria, nessun concorrente diretto accanto a te.",
  },
  {
    title: "Moodboard comune",
    text: "Il gruppo costruisce la moodboard nel pannello: riferimenti, palette, pose. Ognuno ci mette i propri; lo styling li tiene insieme.",
  },
  {
    title: "La giornata di shooting",
    text: "Casting dalle agenzie con cui lavoriamo, styling, fotografo, make-up e hair. Ogni brand ha il proprio call time. Porti i capi o li spedisci.",
  },
  {
    title: "Consegna",
    text: "Immagini selezionate e ritoccate per ogni brand, più gli scatti di gruppo. Licenza d'uso scritta, per canali e durata.",
  },
];

const CRITERIA = [
  {
    title: "Un'identità riconoscibile",
    text: "Non contano le dimensioni: conta che i tuoi capi si riconoscano anche senza logo.",
  },
  {
    title: "Capi pronti per il set",
    text: "Campionario disponibile nella data dello shooting, in taglia campionario, da indossare e da restituire.",
  },
  {
    title: "Complementarità",
    text: "Cerchiamo brand che stiano bene accanto ad altri: abbigliamento, gioielli, borse, scarpe si completano in un unico look.",
  },
  {
    title: "Affinità con la location",
    text: "Il tuo stile deve dialogare con i luoghi disponibili. È il primo filtro della selezione.",
  },
  {
    title: "Spirito di gruppo",
    text: "Le immagini di gruppo vivono sui canali di tutti: tag reciproci e uscite coordinate fanno parte del patto.",
  },
  {
    title: "Tempi rispettati",
    text: "Capi, riferimenti e saldo arrivano nelle date concordate. Una giornata condivisa funziona solo se tutti sono puntuali.",
  },
];

function statusLine(left: number, missing: number) {
  if (left === 0) return "Open Call al completo";
  if (missing === 0) return "Giornata confermata";
  if (missing === 1) return "Manca 1 brand alla conferma";
  return `Mancano ${missing} brand alla conferma`;
}

export default async function Home() {
  const [{ call, categories }, team, projects, board] = await Promise.all([
    getOpenCall(),
    getTeam(),
    getProjects(),
    getBoard(),
  ]);

  const total = categories.length;
  const booked = categories.filter((c) => c.taken).length;
  const left = total - booked;
  const threshold = Math.min(call.threshold, total);
  const missing = Math.max(0, threshold - booked);
  const number = String(call.number).padStart(2, "0");

  const locations = board.filter((b) => b.kind === "location");
  const network = board.filter((b) => b.kind !== "location");
  const agencies = board.filter((b) => b.kind === "agenzia").map((b) => b.title);
  const heroShots = locations.slice(0, 3);

  return (
    <>
      <SiteHeader current="/" />
      <main>
        {/* ---------- apertura: chi arriva dall'email ---------- */}
        <section className="section section--hero hero">
          <div className="hero__text">
            <div className="mono hero__kicker anim-in" style={{ "--d": "0ms" } as React.CSSProperties}>
              Open Call {number} · Hai ricevuto il nostro invito? Sei nel posto giusto.
            </div>
            <h1 className="h-hero">
              {["Una location.", "Più brand.", "Un'unica storia."].map((line, i) => (
                <span className="line" key={line}>
                  <span style={{ "--d": `${120 + i * 110}ms` } as React.CSSProperties}>
                    {line}
                  </span>
                </span>
              ))}
            </h1>
            <div className="row row--end anim-in" style={{ "--d": "520ms" } as React.CSSProperties}>
              <p className="lead">
                Organizziamo giornate di shooting in cui brand diversi scattano
                insieme, nella stessa location, con lo stesso team. Ognuno porta
                i propri capi; location, casting, styling e fotografia si
                dividono.
              </p>
              <div className="hero__ctas">
                <Link href="/candidatura" className="btn btn--accent">
                  Candida il tuo brand
                </Link>
                <a href="#come" className="link">
                  Prima, come funziona ↓
                </a>
              </div>
            </div>
          </div>
          <div className="hero__shots" aria-hidden="true">
            {heroShots.map((l, i) => (
              <div className="hero__shot" key={l.id ?? i} style={{ "--i": i } as React.CSSProperties}>
                <Tile src={l.image_url} alt="" placeholder={`[LOCATION ${String(i + 1).padStart(2, "0")}]`} />
                <span className="mono">{l.title} · {l.city}</span>
              </div>
            ))}
          </div>
        </section>

        <Marquee items={["Location", "Abbinamento", "Moodboard", "Casting", "Shooting", "Consegna"]} />

        {/* ---------- il meccanismo, prima di tutto ---------- */}
        <section className="section how" id="come">
          <div className="how__aside">
            <div className="mono" data-reveal>Il meccanismo</div>
            <h2 className="h-section" data-reveal>
              Come funziona, prima di tutto.
            </h2>
            <p className="muted" data-reveal>
              Sei passaggi, dalla location alle immagini consegnate. Puoi
              seguirli tutti dal tuo pannello brand, una volta candidato.
            </p>
            <div className="how__progress" aria-hidden="true">
              <div />
            </div>
          </div>
          <ol className="how__steps">
            {STEPS.map((s, i) => (
              <li className="how__step" key={s.title} data-reveal>
                <span className="how__num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="h-card">{s.title}</h3>
                  <p className="muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- location disponibili ---------- */}
        <section className="section section--dark" id="location">
          <div className="row row--between">
            <div className="stack">
              <div className="mono" data-reveal>Tutto parte da qui</div>
              <h2 className="h-section" data-reveal>Location disponibili</h2>
            </div>
            <p className="lead lead--narrow" data-reveal>
              Luoghi che conosciamo di persona: luce, spazi, orari, permessi.
              Nella candidatura scegli quelli in cui vedresti i tuoi capi.
            </p>
          </div>
          <div className="loc-strip">
            {locations.map((l, i) => (
              <article
                className="loc"
                key={l.id ?? i}
                data-reveal
                style={{ "--d": `${i * 80}ms` } as React.CSSProperties}
              >
                <Tile src={l.image_url} alt={l.title} placeholder={`[FOTO LOCATION — ${l.city}]`} />
                <div className="loc__meta mono">
                  <span>{String(i + 1).padStart(2, "0")} · {l.city}</span>
                  <span data-on={l.available}>{l.available ? "Disponibile" : "Prenotata"}</span>
                </div>
                <h3 className="h-card">{l.title}</h3>
                {l.description && <p className="loc__desc">{l.description}</p>}
              </article>
            ))}
          </div>
          <div>
            <Link href="/candidatura" className="btn btn--accent">
              Scegli la tua location e candidati
            </Link>
          </div>
        </section>

        {/* ---------- stato della Open Call ---------- */}
        <section className="section section--accent" id="open-call">
          <div className="oc-meta mono">
            <div>Open Call {number}</div>
            <div>{call.date_label}</div>
            <div>{call.location}</div>
            <div>{call.casting_label}</div>
          </div>
          <div className="oc-status__title" data-reveal>{call.concept}</div>
          <div className="oc-main">
            <div className="oc-number" aria-label={`${booked} categorie occupate su ${total}`}>
              <CountUp to={booked} />
              <span>/{total}</span>
            </div>
            <div className="oc-status" data-reveal>
              <div className="oc-status__title">{statusLine(left, missing)}</div>
              <p>
                {left === 1 ? "Resta 1 categoria libera." : `Restano ${left} categorie libere.`}{" "}
                La giornata si conferma a {threshold} brand; se non si arriva
                alla soglia, l&apos;acconto torna indietro per intero.
              </p>
            </div>
          </div>
          <div className="oc-bar" aria-hidden="true">
            {categories.map((c, i) => (
              <div key={i} data-on={i < booked} style={{ "--i": i } as React.CSSProperties} />
            ))}
          </div>
          <div className="cats cats--links">
            {categories.map((c, i) => {
              const inner = (
                <>
                  <span className="mono cat__num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="cat__name">{c.name}</span>
                  <span className="mono cat__tag">{c.taken ? "Occupata" : "Candidati →"}</span>
                </>
              );
              return c.taken ? (
                <div className="cat" data-taken="true" key={c.id ?? c.name}>{inner}</div>
              ) : (
                <Link
                  className="cat"
                  key={c.id ?? c.name}
                  href={`/candidatura?categoria=${encodeURIComponent(c.name)}`}
                >
                  {inner}
                </Link>
              );
            })}
          </div>
        </section>

        {/* ---------- bacheca ---------- */}
        <section className="section" id="bacheca">
          <div className="row row--between">
            <div className="stack">
              <div className="mono" data-reveal>La bacheca</div>
              <h2 className="h-section" data-reveal>Conosciamo i luoghi e le persone.</h2>
            </div>
            <p className="lead lead--narrow" data-reveal>
              Agenzie di modelle, volti, crew, backstage: la rete con cui
              lavoriamo ogni giornata. Non un elenco di contatti, ma persone
              con cui abbiamo già scattato.
            </p>
          </div>
          {agencies.length > 0 && (
            <Marquee className="marquee--ghost" items={agencies} />
          )}
          <div className="board">
            {network.slice(0, 8).map((item, i) => (
              <BoardCard key={item.id ?? i} item={item} index={i} />
            ))}
          </div>
          <div>
            <Link href="/bacheca" className="btn btn--ghost">
              Apri tutta la bacheca
            </Link>
          </div>
        </section>

        {/* ---------- criteri ---------- */}
        <section className="section section--rule" id="criteri">
          <div className="row row--between">
            <div className="stack">
              <div className="mono" data-reveal>Criteri di selezione</div>
              <h2 className="h-section" data-reveal>Chi cerchiamo.</h2>
            </div>
            <div className="chips" data-reveal>
              {Object.values(APPLICANT_LABEL).map((l) => (
                <span className="chip mono" key={l}>{l}</span>
              ))}
            </div>
          </div>
          <div className="criteria">
            {CRITERIA.map((c, i) => (
              <div
                className="criterion"
                key={c.title}
                data-reveal
                style={{ "--d": `${(i % 3) * 90}ms` } as React.CSSProperties}
              >
                <span className="criterion__num">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="h-step">{c.title}</h3>
                <p className="muted">{c.text}</p>
              </div>
            ))}
          </div>
          <p className="muted" data-reveal>
            Non serve avere già un ufficio stampa o un e-commerce. Serve avere
            capi veri e voglia di farli vedere bene.
          </p>
        </section>

        <section className="section section--dark">
          <h2 className="h-statement" data-reveal>
            Il costo si divide.
            <br />
            L&apos;identità no.
          </h2>
          <div className="facts">
            {[
              ["Tempo tuo sul set", "Un call time dedicato, look costruiti sulla tua collezione."],
              ["Scatti tuoi", "Immagini solo tue, più gli scatti di gruppo da condividere."],
              ["Diritti chiari", "Licenza d'uso scritta: canali, durata, nessuna sorpresa."],
            ].map(([t, d], i) => (
              <div className="fact" key={t} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
                <h3 className="h-step">{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section section--rule">
          <div className="row row--between">
            <h2 className="h-section" data-reveal>Il team</h2>
            <Link href="/team" className="link">
              Tutto il team
            </Link>
          </div>
          <div className="cards">
            {team.slice(0, 3).map((m, i) => (
              <div className="card" key={m.id ?? i} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
                <Tile
                  src={m.photo_url}
                  alt={m.name}
                  placeholder={`[RITRATTO — ${m.role.toUpperCase()}]`}
                />
                <div className="mono">{m.role}</div>
                <h3 className="h-card">{m.name}</h3>
              </div>
            ))}
          </div>
        </section>

        <section className="section section--rule">
          <div className="row row--between">
            <h2 className="h-section" data-reveal>Portfolio</h2>
            <Link href="/portfolio" className="link">
              Tutto il portfolio
            </Link>
          </div>
          <div className="cards">
            {projects.slice(0, 3).map((p, i) => (
              <div className="card" key={p.id ?? i} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
                <Tile
                  src={p.image_url}
                  alt={p.title}
                  placeholder={`[FOTO — PROGETTO ${String(i + 1).padStart(2, "0")}]`}
                />
                <div className="card__meta mono">
                  <span>{KIND_LABEL[p.kind]}</span>
                  <span>{p.year}</span>
                </div>
                <h3 className="h-card">{p.title}</h3>
                <div className="muted">
                  {p.client} · {p.credit}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter title="La prossima giornata può partire dai tuoi capi." />
    </>
  );
}
