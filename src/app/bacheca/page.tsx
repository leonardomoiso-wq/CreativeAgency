import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { BoardGrid } from "@/components/BoardGrid";
import { getBoard } from "@/lib/queries";

export const metadata: Metadata = { title: "Bacheca" };

export default async function BachecaPage() {
  const board = await getBoard();

  return (
    <>
      <SiteHeader current="/bacheca" />
      <main>
        <section className="section section--hero">
          <div className="mono anim-in">La bacheca</div>
          <h1 className="h-hero">
            {["Luoghi,", "agenzie,", "volti."].map((line, i) => (
              <span className="line" key={line}>
                <span style={{ "--d": `${100 + i * 110}ms` } as React.CSSProperties}>{line}</span>
              </span>
            ))}
          </h1>
          <div className="row row--end anim-in" style={{ "--d": "450ms" } as React.CSSProperties}>
            <p className="lead">
              Le location che abbiamo già fotografato, le agenzie con cui
              facciamo casting, i volti e la crew che tornano sui nostri set.
              È da qui che nasce ogni giornata.
            </p>
            <Link href="/candidatura" className="btn btn--accent">
              Candida il tuo brand
            </Link>
          </div>
        </section>
        <section className="section" style={{ paddingTop: 0 }}>
          <BoardGrid items={board} />
        </section>
      </main>
      <SiteFooter title="Scegli il luogo. Al resto pensiamo noi." />
    </>
  );
}
