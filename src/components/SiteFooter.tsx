import Link from "next/link";
import { CONTACT_EMAIL, LEGAL_LINE } from "@/lib/site";

export function SiteFooter({ title }: { title: string }) {
  return (
    <footer className="site-footer" id="contatti">
      <h2 className="h-statement">{title}</h2>
      <div className="site-footer__actions">
        <Link href="/#open-call" className="btn">
          Vedi la Open Call
        </Link>
        <Link href="/team" className="link">
          Il team su Instagram
        </Link>
        <a href={`mailto:${CONTACT_EMAIL}`} className="link">
          {CONTACT_EMAIL}
        </a>
      </div>
      <div className="site-footer__legal mono">
        <div>{LEGAL_LINE}</div>
        <div>Privacy · Termini di prenotazione</div>
      </div>
    </footer>
  );
}
