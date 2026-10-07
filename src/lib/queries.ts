import { cacheLife } from "next/cache";
import { publicClient } from "./supabase";
import type {
  BoardItem,
  BoardKind,
  Category,
  Credit,
  OpenCall,
  Project,
  ProjectKind,
  TeamMember,
} from "./data";

/* ---------- contenuti di esempio, usati finché il database è vuoto ---------- */

const FALLBACK_CALL: OpenCall = {
  id: null,
  number: 1,
  concept: "[CONCEPT DELLA PRODUZIONE]",
  date_label: "[DATA]",
  location: "[LOCATION, CITTÀ]",
  casting_label: "[N] modelle · [N] set",
  threshold: 4,
  closes_label: "[DATA]",
  deposit_label: "[IMPORTO]",
};

const FALLBACK_CATEGORIES: Category[] = [
  "Abbigliamento donna",
  "Gioielli",
  "Borse e accessori",
  "Calzature",
  "Occhiali",
  "Beachwear",
].map((name, i) => ({ id: null, name, position: i, taken: i < 3 }));

const placeholderCredits: Credit[] = [1, 2, 3].map(() => ({
  title: "[PROGETTO / BRAND]",
  role: "[RUOLO]",
  year: "[ANNO]",
}));

const FALLBACK_TEAM: TeamMember[] = [
  {
    id: null,
    name: "[NOME STYLIST]",
    role: "Styling e direzione dei look",
    bio: "[Bio in tre o quattro righe: formazione, estetica, tipo di brand e di progetti seguiti.]",
    instagram: null,
    photo_url: null,
    position: 0,
    credits: placeholderCredits,
  },
  {
    id: null,
    name: "[NOME FOTOGRAFO]",
    role: "Fotografia",
    bio: "[Bio in tre o quattro righe: linguaggio fotografico, luce, clienti e pubblicazioni.]",
    instagram: null,
    photo_url: null,
    position: 1,
    credits: placeholderCredits,
  },
  {
    id: null,
    name: "[NOME]",
    role: "Produzione e rapporto con i brand",
    bio: "[Bio in tre o quattro righe: chi coordina la produzione, seleziona i brand e segue il brief fino alla consegna.]",
    instagram: null,
    photo_url: null,
    position: 2,
    credits: [],
  },
];

const FALLBACK_KINDS: ProjectKind[] = [
  "shared",
  "styling",
  "foto",
  "shared",
  "foto",
  "styling",
];

const FALLBACK_CREDIT: Record<ProjectKind, string> = {
  styling: "Styling [NOME STYLIST]",
  foto: "Foto [NOME FOTOGRAFO]",
  shared: "Styling [NOME STYLIST], foto [NOME FOTOGRAFO]",
};

const FALLBACK_PROJECTS: Project[] = FALLBACK_KINDS.map((kind) => ({
  id: null,
  title: "[TITOLO PROGETTO]",
  client: "[BRAND / TESTATA]",
  year: "[ANNO]",
  kind,
  credit: FALLBACK_CREDIT[kind],
  image_url: null,
}));

const FALLBACK_BOARD_SPEC: [BoardKind, string, string][] = [
  ["location", "[VILLA SUL LAGO]", "[COMO]"],
  ["location", "[EX FILANDA]", "[MILANO]"],
  ["location", "[MASSERIA]", "[PUGLIA]"],
  ["location", "[STUDIO CON LUCE NATURALE]", "[TORINO]"],
  ["agenzia", "[AGENZIA MODELLE]", "[MILANO]"],
  ["agenzia", "[AGENZIA MODELLE]", "[ROMA]"],
  ["volto", "[NOME MODELLA]", "[AGENZIA]"],
  ["volto", "[NOME MODELLO]", "[AGENZIA]"],
  ["crew", "[MAKE-UP ARTIST]", "[CITTÀ]"],
  ["crew", "[HAIR STYLIST]", "[CITTÀ]"],
  ["backstage", "[BACKSTAGE — SET 01]", "[LOCATION]"],
  ["agenzia", "[AGENZIA MODELLE]", "[FIRENZE]"],
];

const FALLBACK_BOARD: BoardItem[] = FALLBACK_BOARD_SPEC.map(
  ([kind, title, city], i) => ({
    id: null,
    kind,
    title,
    subtitle: "",
    city,
    description: "",
    image_url: null,
    link: null,
    available: true,
    position: i,
  }),
);

/* ---------- letture ---------- */

export async function getOpenCall(): Promise<{
  call: OpenCall;
  categories: Category[];
}> {
  "use cache";
  cacheLife("minutes");
  const db = publicClient();
  if (!db) return { call: FALLBACK_CALL, categories: FALLBACK_CATEGORIES };

  const { data: call } = await db
    .from("open_calls")
    .select("*")
    .eq("published", true)
    .order("number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!call) return { call: FALLBACK_CALL, categories: FALLBACK_CATEGORIES };

  const { data: categories } = await db
    .from("categories")
    .select("id, name, position, taken")
    .eq("open_call_id", call.id)
    .order("position");

  return { call: call as OpenCall, categories: (categories ?? []) as Category[] };
}

export async function getTeam(): Promise<TeamMember[]> {
  "use cache";
  cacheLife("minutes");
  const db = publicClient();
  if (!db) return FALLBACK_TEAM;
  const { data } = await db.from("team_members").select("*").order("position");
  if (!data || data.length === 0) return FALLBACK_TEAM;
  return data.map((m) => ({ ...m, credits: m.credits ?? [] })) as TeamMember[];
}

export async function getProjects(): Promise<Project[]> {
  "use cache";
  cacheLife("minutes");
  const db = publicClient();
  if (!db) return FALLBACK_PROJECTS;
  const { data } = await db
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (!data || data.length === 0) return FALLBACK_PROJECTS;
  return data as Project[];
}

export async function getBoard(): Promise<BoardItem[]> {
  "use cache";
  cacheLife("minutes");
  const db = publicClient();
  if (!db) return FALLBACK_BOARD;
  const { data } = await db
    .from("board_items")
    .select("*")
    .order("position")
    .order("created_at", { ascending: false });
  if (!data || data.length === 0) return FALLBACK_BOARD;
  return data as BoardItem[];
}
