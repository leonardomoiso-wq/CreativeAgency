import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ApplyFlow } from "@/components/ApplyFlow";
import { getBoard, getOpenCall } from "@/lib/queries";

export const metadata: Metadata = { title: "Candidatura" };

export default async function CandidaturaPage() {
  const [{ categories }, board] = await Promise.all([getOpenCall(), getBoard()]);
  const locations = board.filter((b) => b.kind === "location");

  return (
    <>
      <SiteHeader current="/candidatura" />
      <main className="section section--hero apply">
        <Suspense fallback={<p className="muted">Caricamento…</p>}>
          <ApplyFlow categories={categories} locations={locations} />
        </Suspense>
      </main>
    </>
  );
}
