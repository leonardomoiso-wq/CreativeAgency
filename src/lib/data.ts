export type OpenCall = {
  id: string | null;
  number: number;
  concept: string;
  date_label: string;
  location: string;
  casting_label: string;
  threshold: number;
  closes_label: string;
  deposit_label: string;
};

export type Category = {
  id: string | null;
  name: string;
  position: number;
  taken: boolean;
};

export type Credit = { title: string; role: string; year: string };

export type TeamMember = {
  id: string | null;
  name: string;
  role: string;
  bio: string;
  instagram: string | null;
  photo_url: string | null;
  position: number;
  credits: Credit[];
};

export type ProjectKind = "styling" | "foto" | "shared";

export type Project = {
  id: string | null;
  title: string;
  client: string;
  year: string;
  kind: ProjectKind;
  credit: string;
  image_url: string | null;
};

export const KIND_LABEL: Record<ProjectKind, string> = {
  styling: "Styling",
  foto: "Fotografia",
  shared: "Produzione condivisa",
};

export function instagramUrl(handle: string): string {
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

/* ---------- bacheca ---------- */

export type BoardKind = "location" | "agenzia" | "volto" | "crew" | "backstage";

export type BoardItem = {
  id: string | null;
  kind: BoardKind;
  title: string;
  subtitle: string;
  city: string;
  description: string;
  image_url: string | null;
  link: string | null;
  available: boolean;
  position: number;
};

export const BOARD_LABEL: Record<BoardKind, string> = {
  location: "Location",
  agenzia: "Agenzie",
  volto: "Volti",
  crew: "Crew",
  backstage: "Backstage",
};

/* ---------- candidature ---------- */

export type ApplicantKind = "brand" | "negozio" | "atelier" | "designer";

export const APPLICANT_LABEL: Record<ApplicantKind, string> = {
  brand: "Brand",
  negozio: "Negozio o boutique",
  atelier: "Atelier o sartoria",
  designer: "Designer indipendente",
};

export type ApplicationStatus =
  | "ricevuta"
  | "valutazione"
  | "abbinamento"
  | "moodboard"
  | "confermata"
  | "scattata"
  | "consegnata"
  | "non_selezionata";

/** Il percorso di una candidatura, nell'ordine in cui il brand lo vive. */
export const STATUS_STEPS: {
  id: Exclude<ApplicationStatus, "non_selezionata">;
  label: string;
  text: string;
}[] = [
  {
    id: "ricevuta",
    label: "Candidatura ricevuta",
    text: "Abbiamo il tuo profilo. Lo leggiamo entro 48 ore lavorative.",
  },
  {
    id: "valutazione",
    label: "In valutazione",
    text: "Guardiamo i tuoi capi accanto alle location disponibili e agli altri brand in lista.",
  },
  {
    id: "abbinamento",
    label: "Abbinamento",
    text: "Stiamo componendo il gruppo: brand diversi, nessun concorrente diretto, un total look che regge.",
  },
  {
    id: "moodboard",
    label: "Moodboard",
    text: "Il gruppo è formato. Costruiamo insieme la moodboard: aggiungi i tuoi riferimenti qui sotto.",
  },
  {
    id: "confermata",
    label: "Giornata confermata",
    text: "Location, data e call time sono fissati. Ti mandiamo il foglio di produzione.",
  },
  {
    id: "scattata",
    label: "Post-produzione",
    text: "Lo shooting è fatto. Selezione e ritocco delle immagini in corso.",
  },
  {
    id: "consegnata",
    label: "Immagini consegnate",
    text: "Le immagini sono pronte, con la licenza d'uso concordata.",
  },
];

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  ...(Object.fromEntries(STATUS_STEPS.map((s) => [s.id, s.label])) as Record<
    Exclude<ApplicationStatus, "non_selezionata">,
    string
  >),
  non_selezionata: "Non selezionata",
};

export type Application = {
  id: string;
  created_at: string;
  email: string;
  kind: ApplicantKind;
  brand_name: string;
  city: string;
  website: string;
  category: string;
  pieces: string;
  keywords: string;
  location_ids: string[];
  message: string;
  status: ApplicationStatus;
  group_id: string | null;
  team_note: string;
};

export type BrandGroup = {
  id: string;
  name: string;
  concept: string;
  location_id: string | null;
  date_label: string;
};

export type MoodboardItem = {
  id: string;
  group_id: string;
  application_id: string | null;
  image_url: string;
  caption: string;
};
