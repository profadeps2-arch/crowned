"use client";

import { useEffect } from "react";

/**
 * Call at the top of any screen that fills the viewport. While it is mounted
 * with "dark", the page behind it and the phone's status bar turn black, so
 * there is no light flash at the edges or when you pull past the top.
 * With "light" the screen follows the phone's own light or dark setting.
 *
 *   useScreenTone(analysing ? "dark" : "light");
 */
export function useScreenTone(tone: "light" | "dark") {
  useEffect(() => {
    const root = document.documentElement;
    const metas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
    const originals = metas.map((m) => m.content);

    if (tone === "dark") {
      root.dataset.tone = "dark";
      metas.forEach((m) => (m.content = "#120F0C"));
    }

    return () => {
      delete root.dataset.tone;
      metas.forEach((m, i) => (m.content = originals[i]));
    };
  }, [tone]);
}
