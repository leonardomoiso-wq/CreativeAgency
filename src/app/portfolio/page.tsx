import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PortfolioGrid } from "@/components/PortfolioGrid";
import { getProjects, getTexts } from "@/lib/queries";
import { lines } from "@/lib/texts";

export const metadata: Metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
  const [projects, texts] = await Promise.all([getProjects(), getTexts()]);
  const t = texts.page_portfolio;

  return (
    <>
      <SiteHeader current="/portfolio" />
      <main>
        <section className="section section--hero">
          <div className="mono anim-in">{t.kicker}</div>
          <h1 className="h-hero">
            {lines(t.title).map((line, i) => (
              <span className="line" key={i}>
                <span style={{ "--d": `${100 + i * 110}ms` } as React.CSSProperties}>{line}</span>
              </span>
            ))}
          </h1>
          <p className="lead anim-in" style={{ "--d": "400ms" } as React.CSSProperties}>{t.body}</p>
        </section>
        <section className="section" style={{ paddingTop: 0 }}>
          <PortfolioGrid projects={projects} />
        </section>
      </main>
      <SiteFooter title="Il prossimo lavoro può essere il tuo." />
    </>
  );
}
