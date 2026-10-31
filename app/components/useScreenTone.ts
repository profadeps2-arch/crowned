"use client";

import { useEffect } from "react";

const LIGHT = "#FDFAF6";
const NIGHT = "#0D1723";

/**
 * Call at the top of any screen that fills the viewport. While it is mounted
 * with "dark", the page behind it and the phone's status bar turn night, so
 * there is no cream flash at the edges or when you pull past the top.
 *
 *   useScreenTone(analysing ? "dark" : "light");
 */
export function useScreenTone(tone: "light" | "dark") {
  useEffect(() => {
    const root = document.documentElement;
    const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');

    if (tone === "dark") {
      root.dataset.tone = "dark";
      metas.forEach((m) => (m.content = NIGHT));
    } else {
      delete root.dataset.tone;
      metas.forEach((m) => (m.content = LIGHT));
    }

    return () => {
      delete root.dataset.tone;
      metas.forEach((m) => (m.content = LIGHT));
    };
  }, [tone]);
}
