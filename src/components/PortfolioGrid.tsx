"use client";

import { useState } from "react";
import { KIND_LABEL, type Project, type ProjectKind } from "@/lib/data";
import { Tile } from "./Tile";

const FILTERS: { id: ProjectKind | "all"; label: string }[] = [
  { id: "all", label: "Tutti" },
  { id: "styling", label: "Styling" },
  { id: "foto", label: "Fotografia" },
  { id: "shared", label: "Produzioni condivise" },
];

export function PortfolioGrid({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<ProjectKind | "all">("all");
  const shown =
    filter === "all" ? projects : projects.filter((p) => p.kind === filter);

  return (
    <>
      <div className="filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="filter mono"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
        <div className="filters__count mono">
          {shown.length} {shown.length === 1 ? "progetto" : "progetti"}
        </div>
      </div>
      <div className="cards">
        {shown.map((p, i) => (
          <div className="card" key={p.id ?? i}>
            <Tile
              src={p.image_url}
              alt={p.title}
              placeholder={`[FOTO — PROGETTO ${String(i + 1).padStart(2, "0")}]`}
            />
            <div className="card__meta mono">
              <span>{KIND_LABEL[p.kind]}</span>
              <span>{p.year}</span>
            </div>
            <h2 className="h-card">{p.title}</h2>
            <div className="muted">
              {p.client} · {p.credit}
            </div>
          </div>
        ))}
        {shown.length === 0 && (
          <p className="muted">Nessun progetto in questa sezione, per ora.</p>
        )}
      </div>
    </>
  );
}
