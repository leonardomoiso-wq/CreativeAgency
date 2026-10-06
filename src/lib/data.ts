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
