/** Riquadro immagine: mostra la foto se c'è, altrimenti un segnaposto. */
export function Tile({
  src,
  alt,
  placeholder,
  wide,
}: {
  src: string | null;
  alt: string;
  placeholder: string;
  wide?: boolean;
}) {
  const cls = `tile${wide ? " tile--wide" : ""}${src ? " tile--photo" : ""}`;
  return (
    <div className={cls}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt={alt} loading="lazy" /> : placeholder}
    </div>
  );
}
