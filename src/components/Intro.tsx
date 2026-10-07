"use client";

import { usePathname } from "next/navigation";
import { SettingsCtx } from "./Logo";
import { useContext, useState } from "react";

const WORDS = ["Location", "Brand", "Moodboard", "Casting", "Shooting"];

/**
 * Schermata iniziale. Tutta l'animazione è in CSS, così parte prima che la
 * pagina diventi interattiva; qui si gestisce solo il "salta" e la rimozione.
 */
export function Intro({ name }: { name: string }) {
  const [gone, setGone] = useState(false);
  const path = usePathname();
  const settings = useContext(SettingsCtx);
  const logo = settings.logo_light_url || settings.logo_url;
  // niente intro nelle aree di lavoro
  if (gone || path.startsWith("/admin") || path.startsWith("/brand")) return null;

  return (
    <div
      className="intro"
      aria-hidden="true"
      onClick={(e) => e.currentTarget.classList.add("intro--skip")}
      onAnimationEnd={(e) => {
        if (e.animationName === "intro-out") setGone(true);
      }}
    >
      <div className="intro__top mono">
        <span>Open Call</span>
        <span>Giornate di shooting condivise</span>
      </div>
      {logo ? (
        <div className="intro__logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="" />
        </div>
      ) : (
        <div className="intro__name">
          {name.split("").map((ch, i) => (
            <span key={i} style={{ "--i": i } as React.CSSProperties}>
              {ch === " " ? "\u00a0" : ch}
            </span>
          ))}
        </div>
      )}
      <div className="intro__bottom">
        <div className="intro__words mono">
          <div>
            {WORDS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
        </div>
        <div className="intro__count" />
      </div>
      <div className="intro__bar" />
    </div>
  );
}
