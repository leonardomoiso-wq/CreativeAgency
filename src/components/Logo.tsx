"use client";

import { createContext, useContext } from "react";
import { SITE_NAME } from "@/lib/site";
import type { SiteSettings } from "@/lib/queries";

export const SettingsCtx = createContext<SiteSettings>({ logo_url: "", logo_light_url: "" });

export function SettingsProvider({
  value,
  children,
}: {
  value: SiteSettings;
  children: React.ReactNode;
}) {
  return <SettingsCtx.Provider value={value}>{children}</SettingsCtx.Provider>;
}

/**
 * Il logo caricato dal media center; senza logo, il nome in lettere.
 * `light` sceglie la versione per sfondi scuri, se c'è.
 */
export function Logo({ light = false }: { light?: boolean }) {
  const s = useContext(SettingsCtx);
  const src = (light && s.logo_light_url) || s.logo_url;
  if (!src) return <>{SITE_NAME}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={SITE_NAME} className="logo-img" />
  );
}
