import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Tile } from "@/components/Tile";
import { Marquee } from "@/components/Marquee";
import { CountUp } from "@/components/CountUp";
import { BoardCard } from "@/components/BoardCard";
import { APPLICANT_LABEL, KIND_LABEL } from "@/lib/data";
import { getBoard, getOpenCall, getProjects, getTeam, getTexts } from "@/lib/queries";
import { lines } from "@/lib/texts";

function statusLine(left: number, missing: number) {
  if (left === 0) return "Open Call al completo";
  if (missing === 0) return "Giornata confermata";
  if (missing === 1) return "Manca 1 brand alla conferma";
  return `Mancano ${missing} brand alla conferma`;
}

export default async function Home() {
  const [{ call, categories }, team, projects, board, t] = await Promise.all([
    getOpenCall(),
    getTeam(),
    getProjects(),
    getBoard(),
    getTexts(),
  ]);
  const steps = [1, 2, 3, 4, 5, 6].map((n) => t[`come_${n}`]);
  const criteria = [1, 2, 3, 4, 5, 6].map((n) => t[`criterio_${n}`]);
  const facts = [1, 2, 3].map((n) => t[`fatto_${n}`]);

  const total = categories.length;
  const booked = categories.filter((c) => c.taken).length;
  const left = total - booked;
  const threshold = Math.min(call.threshold, total);
  const missing = Math.max(0, threshold - booked);
  const number = String(call.number).padStart(2, "0");

  const locations = board.filter((b) => b.kind === "location");
  const network = board.filter((b) => b.kind !== "location");
  const agencies = board.filter((b) => b.kind === "agenzia").map((b) => b.title);
  // Il collage d'apertura usa il portfolio; senza foto, le location.
  const withPhoto = projects.filter((p) => p.image_url);
  const heroShots =
    withPhoto.length >= 3
      ? withPhoto.slice(0, 3).map((p) => ({ id: p.id, image_url: p.image_url, label: p.client || p.title }))
      : locations.slice(0, 3).map((l) => ({ id: l.id, image_url: l.image_url, label: `${l.title} · ${l.city}` }));

  return (
    <>
      <SiteHeader current="/" />
      <main>
        {/* ---------- apertura: chi arriva dall'email ---------- */}
        <section className="section section--hero hero">
          <div className="hero__text">
            <div className="mono hero__kicker anim-in" style={{ "--d": "0ms" } as React.CSSProperties}>
              Open Call {number} · {t.hero.kicker}
            </div>
            <h1 className="h-hero">
              {lines(t.hero.title).map((line, i) => (
                <span className="line" key={line}>
                  <span style={{ "--d": `${120 + i * 110}ms` } as React.CSSProperties}>
                    {line}
                  </span>
                </span>
              ))}
            </h1>
            <div className="row row--end anim-in" style={{ "--d": "520ms" } as React.CSSProperties}>
              <p className="lead">{t.hero.body}</p>
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
                <Tile src={l.image_url} alt="" placeholder={`[FOTO ${String(i + 1).padStart(2, "0")}]`} />
                <span className="mono">{l.label}</span>
              </div>
            ))}
          </div>
        </section>

        <Marquee items={["Location", "Abbinamento", "Moodboard", "Casting", "Shooting", "Consegna"]} />

        {/* ---------- il meccanismo, prima di tutto ---------- */}
        <section className="section how" id="come">
          <div className="how__aside">
            <div className="mono" data-reveal>{t.come.kicker}</div>
            <h2 className="h-section" data-reveal>{t.come.title}</h2>
            <p className="muted" data-reveal>{t.come.body}</p>
            <div className="how__progress" aria-hidden="true">
              <div />
            </div>
          </div>
          <ol className="how__steps">
            {steps.map((s, i) => (
              <li className="how__step" key={i} data-reveal>
                <span className="how__num">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="h-card">{s.title}</h3>
                  <p className="muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- location disponibili ---------- */}
        <section className="section section--dark" id="location">
          <div className="row row--between">
            <div className="stack">
              <div className="mono" data-reveal>{t.location.kicker}</div>
              <h2 className="h-section" data-reveal>{t.location.title}</h2>
            </div>
            <p className="lead lead--narrow" data-reveal>{t.location.body}</p>
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
              <div className="mono" data-reveal>{t.bacheca.kicker}</div>
              <h2 className="h-section" data-reveal>{t.bacheca.title}</h2>
            </div>
            <p className="lead lead--narrow" data-reveal>{t.bacheca.body}</p>
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
              <div className="mono" data-reveal>{t.criteri.kicker}</div>
              <h2 className="h-section" data-reveal>{t.criteri.title}</h2>
            </div>
            <div className="chips" data-reveal>
              {Object.values(APPLICANT_LABEL).map((l) => (
                <span className="chip mono" key={l}>{l}</span>
              ))}
            </div>
          </div>
          <div className="criteria">
            {criteria.map((c, i) => (
              <div
                className="criterion"
                key={i}
                data-reveal
                style={{ "--d": `${(i % 3) * 90}ms` } as React.CSSProperties}
              >
                <span className="criterion__num">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="h-step">{c.title}</h3>
                <p className="muted">{c.body}</p>
              </div>
            ))}
          </div>
          <p className="muted" data-reveal>{t.criteri.body}</p>
        </section>

        <section className="section section--dark">
          <h2 className="h-statement" data-reveal>
            {lines(t.costo.title).map((l, i) => (
              <span key={i} style={{ display: "block" }}>{l}</span>
            ))}
          </h2>
          <div className="facts">
            {facts.map((f, i) => (
              <div className="fact" key={i} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
                <h3 className="h-step">{f.title}</h3>
                <p>{f.body}</p>
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
      <SiteFooter title={t.footer_home.title} />
    </>
  );
}
