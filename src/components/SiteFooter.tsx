import Link from "next/link";
import { CONTACT_EMAIL, LEGAL_LINE } from "@/lib/site";
import { Marquee } from "./Marquee";

export function SiteFooter({ title }: { title: string }) {
  return (
    <footer className="site-footer" id="contatti">
      <Marquee
        className="marquee--footer"
        items={["Candidature aperte", "Posti limitati", "Un brand per categoria"]}
      />
      <h2 className="h-statement" data-reveal>
        {title}
      </h2>
      <div className="site-footer__actions" data-reveal>
        <Link href="/candidatura" className="btn">
          Candida il tuo brand
        </Link>
        <span className="mono">5 minuti · nessun impegno · risposta in 48 ore</span>
      </div>
      <div className="site-footer__links">
        <Link href="/#come" className="link">Come funziona</Link>
        <Link href="/bacheca" className="link">Bacheca</Link>
        <Link href="/team" className="link">Il team</Link>
        <a href={`mailto:${CONTACT_EMAIL}`} className="link">
          {CONTACT_EMAIL}
        </a>
      </div>
      <div className="site-footer__legal mono">
        <div>{LEGAL_LINE}</div>
        <div>Privacy · Termini di partecipazione</div>
      </div>
    </footer>
  );
}
