import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { getProjects } from "@/lib/queries";

export const metadata: Metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
  const projects = await getProjects();

  return (
    <>
      <SiteHeader current="/portfolio" />
      <main>
        <section className="section section--hero">
          <div className="mono">Portfolio del team</div>
          <h1 className="h-hero">Lavori firmati dal team.</h1>
          <p className="lead">
            Campagne, lookbook ed editoriali realizzati dalla stylist e dal
            fotografo, insieme e nei rispettivi percorsi, e le immagini nate
            dalle produzioni condivise.
          </p>
        </section>
        <section className="section" style={{ paddingTop: 0 }}>
          <PortfolioGrid projects={projects} />
        </section>
      </main>
      <SiteFooter title="Il prossimo lavoro può essere il tuo." />
    </>
  );
}
