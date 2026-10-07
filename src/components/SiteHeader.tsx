import Link from "next/link";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/#come", label: "Come funziona" },
  { href: "/bacheca", label: "Bacheca" },
  { href: "/team", label: "Team" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/login", label: "Area brand" },
];

export function SiteHeader({ current }: { current?: string }) {
  return (
    <header className="site-header">
      <Link href="/" className="wordmark">
        <Logo />
      </Link>
      <nav className="site-nav mono" aria-label="Principale">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={current === l.href ? "page" : undefined}
          >
            {l.label}
          </Link>
        ))}
        <Link href="/candidatura" className="btn btn--small btn--accent">
          Candidati
        </Link>
      </nav>
    </header>
  );
}
