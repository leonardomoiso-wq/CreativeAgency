import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SlotPicker } from "@/components/SlotPicker";
import { Tile } from "@/components/Tile";
import { KIND_LABEL } from "@/lib/data";
import { getOpenCall, getProjects, getTeam } from "@/lib/queries";


function statusLine(left: number, missing: number) {
  if (left === 0) return "Open Call al completo";
  if (missing === 0) return "Produzione confermata";
  if (missing === 1) return "Manca 1 brand alla conferma";
  return `Mancano ${missing} brand alla conferma`;
}

function leftLine(left: number) {
  if (left === 0) return "Nessun posto rimasto.";
  if (left === 1) return "Resta 1 posto.";
  return `Restano ${left} posti.`;
}

export default async function Home() {
  const [{ call, categories }, team, projects] = await Promise.all([
    getOpenCall(),
    getTeam(),
    getProjects(),
  ]);

  const total = categories.length;
  const booked = categories.filter((c) => c.taken).length;
  const left = total - booked;
  const threshold = Math.min(call.threshold, total);
  const missing = Math.max(0, threshold - booked);
  const number = String(call.number).padStart(2, "0");

  return (
    <>
      <SiteHeader current="/" />
      <main>
        <section className="section section--hero">
          <div className="mono">
            Open call · produzioni condivise per brand indipendenti
          </div>
          <h1 className="h-hero">
            Una produzione.
            <br />
            Posti limitati.
            <br />
            Qualità piena.
          </h1>
          <div className="row row--end">
            <p className="lead">
              Ogni Open Call è una produzione editoriale firmata dal team:
              concept, location, casting e styling. I brand selezionati entrano
              con la propria collezione e ne condividono i costi.
            </p>
            <a href="#open-call" className="btn">
              Open Call {number}
            </a>
          </div>
        </section>

        <section className="section section--accent" id="open-call">
          <div className="oc-meta mono">
            <div>Open Call {number}</div>
            <div>{call.date_label}</div>
            <div>{call.location}</div>
            <div>{call.casting_label}</div>
          </div>
          <div className="oc-status__title">{call.concept}</div>
          <div className="oc-main">
            <div className="oc-number" aria-label={`${booked} posti su ${total}`}>
              {booked}
              <span>/{total}</span>
            </div>
            <div className="oc-status">
              <div className="oc-status__title">{statusLine(left, missing)}</div>
              <p>
                {leftLine(left)} La produzione si conferma a {threshold} brand;
                in caso contrario l&apos;acconto viene restituito per intero.
              </p>
            </div>
          </div>
          <div className="oc-bar" aria-hidden="true">
            {categories.map((c, i) => (
              <div key={i} data-on={i < booked} />
            ))}
          </div>
          <div className="oc-meta mono">
            <div>{booked} brand confermati</div>
            <div>Soglia di conferma: {threshold}</div>
            <div>Chiusura prenotazioni: {call.closes_label}</div>
          </div>
        </section>

        <section className="section">
          <SlotPicker
            categories={categories}
            openCallId={call.id}
            depositLabel={call.deposit_label}
          />
        </section>

        <section className="section section--dark">
          <h2 className="h-statement">
            Il costo si divide. La qualità no.
          </h2>
          <p className="lead">
            Ogni brand ha il proprio tempo sul set, uno styling costruito sulla
            collezione e un ambiente dedicato della location. Le immagini
            raccontano la tua identità, non quella della giornata.
          </p>
        </section>

        <section className="section" id="formati">
          <div className="row row--between">
            <h2 className="h-section">Modi di partecipare</h2>
            <div className="mono">Tre formati, stesso team</div>
          </div>
          <div className="cols">
            <div className="col">
              <div className="mono">Il più accessibile</div>
              <h3 className="h-card">Condiviso</h3>
              <p className="muted">
                Più brand di categorie diverse nella stessa produzione, ognuno
                con i propri look e il proprio tempo sul set.
              </p>
            </div>
            <div className="col">
              <div className="mono">Visibilità incrociata</div>
              <h3 className="h-card">Capsule</h3>
              <p className="muted">
                Due o tre brand complementari scattati insieme in total look:
                ognuno compare nelle immagini e nei canali degli altri.
              </p>
            </div>
            <div className="col">
              <div className="mono">Su richiesta</div>
              <h3 className="h-card">Solo</h3>
              <p className="muted">
                Stesso team e stessa cura, con il set dedicato a un unico brand
                e un concept costruito su misura.
              </p>
            </div>
          </div>
        </section>

        <section className="section section--rule" id="come">
          <div className="row row--between">
            <h2 className="h-section">Come funziona</h2>
            <div className="mono">Quattro passaggi</div>
          </div>
          <div className="cols">
            <div className="col">
              <div className="col__num">01</div>
              <h3 className="h-step">Riservi il posto</h3>
              <p className="muted">
                Scegli la tua categoria e invii la richiesta. Il team conferma
                i brand coerenti con il concept e il posto si blocca con un
                acconto.
              </p>
            </div>
            <div className="col">
              <div className="col__num">02</div>
              <h3 className="h-step">Brief creativo</h3>
              <p className="muted">
                Collezione, moodboard, riferimenti e destinazione delle
                immagini. Su questa base la stylist costruisce i look.
              </p>
            </div>
            <div className="col">
              <div className="col__num">03</div>
              <h3 className="h-step">Sul set</h3>
              <p className="muted">
                Ogni brand ha il proprio call time con casting, fotografo e
                crew. Puoi seguire lo shooting di persona o inviare i capi.
              </p>
            </div>
            <div className="col">
              <div className="col__num">04</div>
              <h3 className="h-step">Selezione e consegna</h3>
              <p className="muted">
                Immagini selezionate e post-prodotte in una gallery privata,
                con licenza d&apos;uso definita per canali e durata.
              </p>
            </div>
          </div>
        </section>

        <section className="section section--rule">
          <div className="row row--between">
            <h2 className="h-section">Il team</h2>
            <Link href="/team" className="link">
              Tutto il team
            </Link>
          </div>
          <div className="cards">
            {team.slice(0, 3).map((m, i) => (
              <div className="card" key={m.id ?? i}>
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
            <h2 className="h-section">Portfolio</h2>
            <Link href="/portfolio" className="link">
              Tutto il portfolio
            </Link>
          </div>
          <div className="cards">
            {projects.slice(0, 3).map((p, i) => (
              <div className="card" key={p.id ?? i}>
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
      <SiteFooter title="Non restare fuori dalla prossima Open Call." />
    </>
  );
}
