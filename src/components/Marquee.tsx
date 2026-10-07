/** Fascia di parole che scorre all'infinito. */
export function Marquee({
  items,
  className = "",
}: {
  items: string[];
  className?: string;
}) {
  const row = (hidden: boolean) => (
    <div className="marquee__row" aria-hidden={hidden || undefined}>
      {items.map((t, i) => (
        <span key={i}>
          {t}
          <i>✶</i>
        </span>
      ))}
    </div>
  );
  return (
    <div className={`marquee ${className}`}>
      {row(false)}
      {row(true)}
    </div>
  );
}
