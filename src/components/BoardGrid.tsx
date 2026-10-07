"use client";

import { useState } from "react";
import { BOARD_LABEL, type BoardItem, type BoardKind } from "@/lib/data";
import { BoardCard } from "./BoardCard";

export function BoardGrid({ items }: { items: BoardItem[] }) {
  const kinds = (Object.keys(BOARD_LABEL) as BoardKind[]).filter((k) =>
    items.some((i) => i.kind === k),
  );
  const [filter, setFilter] = useState<BoardKind | "all">("all");
  const shown = filter === "all" ? items : items.filter((i) => i.kind === filter);

  return (
    <>
      <div className="filters">
        {(["all", ...kinds] as const).map((k) => (
          <button
            key={k}
            type="button"
            className="filter mono"
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
          >
            {k === "all" ? "Tutto" : BOARD_LABEL[k]}
            <sup>{k === "all" ? items.length : items.filter((i) => i.kind === k).length}</sup>
          </button>
        ))}
      </div>
      <div className="board" key={filter}>
        {shown.map((item, i) => (
          <BoardCard key={item.id ?? `${item.kind}-${i}`} item={item} index={i} />
        ))}
      </div>
    </>
  );
}
