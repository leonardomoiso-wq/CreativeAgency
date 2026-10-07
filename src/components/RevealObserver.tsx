"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Fa entrare in scena gli elementi con [data-reveal] quando arrivano nello
 * schermo. Segue anche i contenuti aggiunti dopo (filtri, moduli a passi).
 */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    const scan = () =>
      document
        .querySelectorAll("[data-reveal]:not(.is-in)")
        .forEach((el) => io.observe(el));
    scan();
    let frame = 0;
    const mo = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
