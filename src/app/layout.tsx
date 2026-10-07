import type { Metadata } from "next";
import { ViewTransition } from "react";
import "./globals.css";
import { SITE_NAME } from "@/lib/site";
import { Intro } from "@/components/Intro";
import { RevealObserver } from "@/components/RevealObserver";
import { SettingsProvider } from "@/components/Logo";
import { getSettings } from "@/lib/queries";

export const metadata: Metadata = {
  title: `${SITE_NAME} — Open Call`,
  description:
    "Giornate di shooting condivise per brand indipendenti, negozi e atelier: una location, più brand abbinati, una direzione creativa comune.",
};

// Prima del primo paint: attiva le animazioni (se l'utente non le ha
// ridotte) e salta l'intro se è già stata vista in questa sessione.
const BOOT = `(function(){var d=document.documentElement;try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('motion');if(sessionStorage.getItem('intro'))d.classList.add('intro-seen');else sessionStorage.setItem('intro','1')}catch(e){}})()`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>
        <SettingsProvider value={settings}>
          <Intro name={SITE_NAME} />
          <ViewTransition>{children}</ViewTransition>
          <RevealObserver />
        </SettingsProvider>
      </body>
    </html>
  );
}
