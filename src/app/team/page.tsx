import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Tile } from "@/components/Tile";
import { instagramUrl } from "@/lib/data";
import { getTeam } from "@/lib/queries";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const team = await getTeam();

  return (
    <>
      <SiteHeader current="/team" />
      <main>
        <section className="section section--hero">
          <div className="mono">Team</div>
          <h1 className="h-hero">Le persone dietro ogni set.</h1>
          <p className="lead">
            Un gruppo stabile di professionisti che lavora insieme produzione
            dopo produzione: stessa direzione, stessa cura, per ogni brand sul
            set.
          </p>
        </section>

        <section className="members">
          {team.map((m, i) => (
            <article className="member" key={m.id ?? i}>
              <Tile
                src={m.photo_url}
                alt={`Ritratto di ${m.name}`}
                placeholder="[RITRATTO]"
              />
              <div className="member__body">
                <div className="mono">
                  {String(i + 1).padStart(2, "0")} · {m.role}
                </div>
                <h2 className="h-name">{m.name}</h2>
                <p>{m.bio}</p>
                {m.credits.length > 0 && (
                  <div className="spec spec--light">
                    {m.credits.map((c, j) => (
                      <div className="spec__row" key={j}>
                        <span>{c.title}</span>
                        <span className="muted">
                          {c.role} · {c.year}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="member__links">
                  <Link href="/portfolio" className="link">
                    Portfolio
                  </Link>
                  {m.instagram ? (
                    <a
                      href={instagramUrl(m.instagram)}
                      className="link"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Instagram @{m.instagram.replace(/^@/, "")}
                    </a>
                  ) : (
                    <span className="link muted">Instagram @[HANDLE]</span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="section">
          <div className="split">
            <div className="split__aside">
              <div className="mono">Casting</div>
              <h2 className="h-section">Modelle e modelli</h2>
              <p className="muted">
                Il casting di ogni produzione viene scelto insieme alla
                stylist, tra le agenzie partner e i talent indipendenti del
                nostro network, e pubblicato prima dell&apos;apertura delle
                prenotazioni.
              </p>
            </div>
            <div className="split__main spec">
              <div className="spec__row">
                <span>[AGENZIA PARTNER]</span>
                <span className="muted">[CITTÀ]</span>
              </div>
              <div className="spec__row">
                <span>[AGENZIA PARTNER]</span>
                <span className="muted">[CITTÀ]</span>
              </div>
              <div className="spec__row">
                <span>Talent indipendenti</span>
                <span className="muted">selezione diretta</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter title="Lavora con questo team." />
    </>
  );
}
