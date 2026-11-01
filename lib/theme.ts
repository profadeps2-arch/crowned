export type ThemeChoice = "light" | "dark" | "system";
const KEY = "crowned.theme";
const listeners = new Set<() => void>();

export function getTheme(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {}
  return "light";
}

export function resolveTheme(c: ThemeChoice): "light" | "dark" {
  if (c === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return c;
}

export function applyTheme(c: ThemeChoice) {
  const t = resolveTheme(c);
  document.documentElement.dataset.theme = t;
  const color = t === "dark" ? "#000000" : "#FFFFFF";
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", color));
}

export function setTheme(c: ThemeChoice) {
  try {
    localStorage.setItem(KEY, c);
  } catch {}
  applyTheme(c);
  listeners.forEach((l) => l());
}

export function subscribeTheme(cb: () => void) {
  listeners.add(cb);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (getTheme() === "system") applyTheme("system");
  };
  mq.addEventListener("change", onChange);
  return () => {
    listeners.delete(cb);
    mq.removeEventListener("change", onChange);
  };
}

/** Runs before first paint so there is no flash of the wrong theme. */
export const themeInitScript = `(function(){try{var c=localStorage.getItem("${KEY}");if(c!=="dark"&&c!=="system")c="light";var d=c==="dark"||(c==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";if(d){var m=document.querySelectorAll('meta[name="theme-color"]');for(var i=0;i<m.length;i++)m[i].setAttribute("content","#000000");}}catch(e){}})();`;
