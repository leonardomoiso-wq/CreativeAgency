/** Le sezioni del media center: dove finiscono le immagini e quali etichette hanno. */

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "checkbox" | "credits";
};

export type SectionDef = {
  id: string;
  group: string;
  label: string;
  hint: string;
  table: "board_items" | "projects" | "team_members";
  match: Record<string, string>;
  folder: string;
  imageField: "image_url" | "photo_url";
  /** Il campo che fa da etichetta sulla scheda: si modifica direttamente. */
  labelField: string;
  labelName: string;
  fields: FieldDef[];
  defaults?: Record<string, unknown>;
  publicPath: string;
};

const board = (
  kind: string,
  label: string,
  hint: string,
  labelName: string,
  fields: FieldDef[],
): SectionDef => ({
  id: kind,
  group: "Bacheca",
  label,
  hint,
  table: "board_items",
  match: { kind },
  folder: `bacheca/${kind}`,
  imageField: "image_url",
  labelField: "title",
  labelName,
  fields,
  publicPath: kind === "location" ? "/#location" : "/bacheca",
});

const portfolio = (kind: string, label: string): SectionDef => ({
  id: `portfolio-${kind}`,
  group: "Portfolio",
  label,
  hint: "Compare nella pagina Portfolio, filtrabile per sezione. Le prime tre foto aprono anche la homepage.",
  table: "projects",
  match: { kind },
  folder: `portfolio/${kind}`,
  imageField: "image_url",
  labelField: "title",
  labelName: "Titolo del progetto",
  fields: [
    { name: "client", label: "Brand o testata" },
    { name: "year", label: "Anno" },
    { name: "credit", label: "Credits (es. Styling Nome, foto Nome)" },
  ],
  publicPath: "/portfolio",
});

export const SECTIONS: SectionDef[] = [
  board("location", "Location", "Le location disponibili: homepage, candidatura e pannello brand.", "Nome della location", [
    { name: "city", label: "Città" },
    { name: "subtitle", label: "Tipo di spazio (es. villa, studio, ex fabbrica)" },
    { name: "description", label: "Descrizione breve: luce, spazi, atmosfera", type: "textarea" },
    { name: "available", label: "Disponibile per le prossime giornate", type: "checkbox" },
    { name: "link", label: "Link (facoltativo)" },
  ]),
  board("agenzia", "Agenzie", "Le agenzie di modelle con cui fate casting. I nomi scorrono anche in homepage.", "Nome dell'agenzia", [
    { name: "city", label: "Città" },
    { name: "subtitle", label: "Specialità (es. donna, new faces)" },
    { name: "link", label: "Sito o Instagram" },
  ]),
  board("volto", "Volti", "Modelle e modelli che hanno già lavorato con voi.", "Nome", [
    { name: "subtitle", label: "Agenzia" },
    { name: "city", label: "Città" },
    { name: "link", label: "Instagram" },
  ]),
  board("crew", "Crew", "Make-up, hair, assistenti, video.", "Nome", [
    { name: "subtitle", label: "Ruolo" },
    { name: "city", label: "Città" },
    { name: "link", label: "Instagram" },
  ]),
  board("backstage", "Backstage", "Foto di lavoro dai set: mostrano come si svolge una giornata.", "Didascalia", [
    { name: "city", label: "Location o città" },
    { name: "subtitle", label: "Nota" },
  ]),
  portfolio("styling", "Styling"),
  portfolio("foto", "Fotografia"),
  portfolio("shared", "Giornate condivise"),
  {
    id: "team",
    group: "Team",
    label: "Team",
    hint: "Ritratti e schede delle persone. Le prime tre compaiono anche in homepage.",
    table: "team_members",
    match: {},
    folder: "team",
    imageField: "photo_url",
    labelField: "name",
    labelName: "Nome e cognome",
    fields: [
      { name: "role", label: "Ruolo" },
      { name: "bio", label: "Bio (tre o quattro righe)", type: "textarea" },
      { name: "instagram", label: "Instagram personale (senza @)" },
      { name: "credits", label: "Credits, uno per riga: Progetto | Ruolo | Anno", type: "credits" },
    ],
    defaults: { role: "", bio: "" },
    publicPath: "/team",
  },
];
