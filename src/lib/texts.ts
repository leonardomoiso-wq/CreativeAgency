/**
 * Testi del sito, con tre livelli di lettura: occhiello, titolo, testo.
 * Questi sono i valori predefiniti; dal media center il team li sovrascrive
 * (tabella site_texts). Nei titoli, un a capo diventa una riga a sé.
 * Un livello che un blocco non usa ha `null` e non compare nella gestione.
 */

export type TextBlock = { kicker: string; title: string; body: string };

type Def = {
  key: string;
  page: string;
  label: string;
  kicker: string | null;
  title: string | null;
  body: string | null;
};

const step = (n: number, title: string, body: string): Def => ({
  key: `come_${n}`,
  page: "Homepage",
  label: `Come funziona · passaggio ${n}`,
  kicker: null,
  title,
  body,
});

const criterion = (n: number, title: string, body: string): Def => ({
  key: `criterio_${n}`,
  page: "Homepage",
  label: `Criteri · ${n}`,
  kicker: null,
  title,
  body,
});

const fact = (n: number, title: string, body: string): Def => ({
  key: `fatto_${n}`,
  page: "Homepage",
  label: `Il costo si divide · punto ${n}`,
  kicker: null,
  title,
  body,
});

export const TEXT_DEFS: Def[] = [
  {
    key: "hero",
    page: "Homepage",
    label: "Apertura",
    kicker: "Hai ricevuto il nostro invito? Sei nel posto giusto.",
    title: "Una location.\nPiù brand.\nUn'unica storia.",
    body: "Organizziamo giornate di shooting in cui brand diversi scattano insieme, nella stessa location, con lo stesso team. Ognuno porta i propri capi; location, casting, styling e fotografia si dividono.",
  },
  {
    key: "come",
    page: "Homepage",
    label: "Come funziona",
    kicker: "Il meccanismo",
    title: "Come funziona, prima di tutto.",
    body: "Sei passaggi, dalla location alle immagini consegnate. Puoi seguirli tutti dal tuo pannello brand, una volta candidato.",
  },
  step(1, "Partiamo dalle location", "Ogni giornata nasce da un luogo che abbiamo già visto, fotografato e bloccato. La location è il punto fermo: tutto il resto si costruisce intorno."),
  step(2, "Ti candidi", "Racconti chi sei, cosa porteresti sul set e quali location senti tue. Cinque minuti, nessun impegno."),
  step(3, "Ti abbiniamo", "Scegliamo brand che si completano in un total look: un solo brand per categoria, nessun concorrente diretto accanto a te."),
  step(4, "Moodboard comune", "Il gruppo costruisce la moodboard nel pannello: riferimenti, palette, pose. Ognuno ci mette i propri; lo styling li tiene insieme."),
  step(5, "La giornata di shooting", "Casting dalle agenzie con cui lavoriamo, styling, fotografo, make-up e hair. Ogni brand ha il proprio call time. Porti i capi o li spedisci."),
  step(6, "Consegna", "Immagini selezionate e ritoccate per ogni brand, più gli scatti di gruppo. Licenza d'uso scritta, per canali e durata."),
  {
    key: "location",
    page: "Homepage",
    label: "Location disponibili",
    kicker: "Tutto parte da qui",
    title: "Location disponibili",
    body: "Luoghi che conosciamo di persona: luce, spazi, orari, permessi. Nella candidatura scegli quelli in cui vedresti i tuoi capi.",
  },
  {
    key: "bacheca",
    page: "Homepage",
    label: "Bacheca",
    kicker: "La bacheca",
    title: "Conosciamo i luoghi e le persone.",
    body: "Agenzie di modelle, volti, crew, backstage: la rete con cui lavoriamo ogni giornata. Non un elenco di contatti, ma persone con cui abbiamo già scattato.",
  },
  {
    key: "criteri",
    page: "Homepage",
    label: "Criteri di selezione",
    kicker: "Criteri di selezione",
    title: "Chi cerchiamo.",
    body: "Non serve avere già un ufficio stampa o un e-commerce. Serve avere capi veri e voglia di farli vedere bene.",
  },
  criterion(1, "Un'identità riconoscibile", "Non contano le dimensioni: conta che i tuoi capi si riconoscano anche senza logo."),
  criterion(2, "Capi pronti per il set", "Campionario disponibile nella data dello shooting, in taglia campionario, da indossare e da restituire."),
  criterion(3, "Complementarità", "Cerchiamo brand che stiano bene accanto ad altri: abbigliamento, gioielli, borse, scarpe si completano in un unico look."),
  criterion(4, "Affinità con la location", "Il tuo stile deve dialogare con i luoghi disponibili. È il primo filtro della selezione."),
  criterion(5, "Spirito di gruppo", "Le immagini di gruppo vivono sui canali di tutti: tag reciproci e uscite coordinate fanno parte del patto."),
  criterion(6, "Tempi rispettati", "Capi, riferimenti e saldo arrivano nelle date concordate. Una giornata condivisa funziona solo se tutti sono puntuali."),
  {
    key: "costo",
    page: "Homepage",
    label: "Il costo si divide",
    kicker: null,
    title: "Il costo si divide.\nL'identità no.",
    body: null,
  },
  fact(1, "Tempo tuo sul set", "Un call time dedicato, look costruiti sulla tua collezione."),
  fact(2, "Scatti tuoi", "Immagini solo tue, più gli scatti di gruppo da condividere."),
  fact(3, "Diritti chiari", "Licenza d'uso scritta: canali, durata, nessuna sorpresa."),
  {
    key: "footer_home",
    page: "Homepage",
    label: "Chiusura in fondo alla pagina",
    kicker: null,
    title: "La prossima giornata può partire dai tuoi capi.",
    body: null,
  },
  {
    key: "page_bacheca",
    page: "Bacheca",
    label: "Apertura della pagina",
    kicker: "La bacheca",
    title: "Luoghi,\nagenzie,\nvolti.",
    body: "Le location che abbiamo già fotografato, le agenzie con cui facciamo casting, i volti e la crew che tornano sui nostri set. È da qui che nasce ogni giornata.",
  },
  {
    key: "page_team",
    page: "Team",
    label: "Apertura della pagina",
    kicker: "Team",
    title: "Le persone dietro ogni set.",
    body: "Un gruppo stabile di professionisti che lavora insieme giornata dopo giornata: stessa direzione, stessa cura, per ogni brand sul set.",
  },
  {
    key: "page_portfolio",
    page: "Portfolio",
    label: "Apertura della pagina",
    kicker: "Portfolio del team",
    title: "Lavori firmati dal team.",
    body: "Campagne, lookbook ed editoriali realizzati dalla stylist e dal fotografo, insieme e nei rispettivi percorsi, e le immagini nate dalle giornate condivise.",
  },
];

const DEFAULTS = new Map(TEXT_DEFS.map((d) => [d.key, d]));

/** Unisce i testi salvati con i predefiniti: un campo vuoto usa il predefinito. */
export function mergeTexts(
  saved: Partial<TextBlock & { key: string }>[],
): Record<string, TextBlock> {
  const byKey = new Map(saved.map((s) => [s.key, s]));
  const out: Record<string, TextBlock> = {};
  for (const d of TEXT_DEFS) {
    const s = byKey.get(d.key);
    out[d.key] = {
      kicker: s?.kicker?.trim() || d.kicker || "",
      title: s?.title?.trim() || d.title || "",
      body: s?.body?.trim() || d.body || "",
    };
  }
  return out;
}

export function textDef(key: string) {
  return DEFAULTS.get(key);
}

/** Righe di un titolo: ogni a capo è una riga. */
export function lines(title: string) {
  return title.split("\n").map((l) => l.trim()).filter(Boolean);
}
