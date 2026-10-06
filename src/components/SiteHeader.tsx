import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

const LINKS = [
  { href: "/", label: "Open Call" },
  { href: "/team", label: "Team" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/login", label: "Area riservata" },
];

export function SiteHeader({ current }: { current?: string }) {
  return (
    <header className="site-header">
      <Link href="/" className="wordmark">
        {SITE_NAME}
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
      </nav>
    </header>
  );
}
