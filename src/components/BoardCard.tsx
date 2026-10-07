import { BOARD_LABEL, type BoardItem } from "@/lib/data";

/** Una scheda della bacheca: immagine piena, didascalia che sale al passaggio. */
export function BoardCard({ item, index }: { item: BoardItem; index: number }) {
  const ratio = ["4 / 5", "3 / 4", "1 / 1", "4 / 5", "2 / 3", "5 / 4"][index % 6];
  const body = (
    <>
      <div className="board-card__img" style={{ aspectRatio: ratio }}>
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.title} loading="lazy" />
        ) : (
          <span className="mono">[FOTO — {BOARD_LABEL[item.kind].toUpperCase()}]</span>
        )}
        {item.kind === "location" && (
          <span className="board-card__tag mono" data-on={item.available}>
            {item.available ? "Disponibile" : "Già prenotata"}
          </span>
        )}
      </div>
      <div className="board-card__cap">
        <span className="mono">
          {BOARD_LABEL[item.kind]}
          {item.city ? ` · ${item.city}` : ""}
        </span>
        <strong>{item.title}</strong>
        {item.subtitle && <span className="muted">{item.subtitle}</span>}
      </div>
    </>
  );
  return (
    <figure
      className="board-card"
      data-reveal
      style={{ "--d": `${(index % 4) * 70}ms` } as React.CSSProperties}
    >
      {item.link ? (
        <a href={item.link} target="_blank" rel="noreferrer">
          {body}
        </a>
      ) : (
        body
      )}
    </figure>
  );
}
