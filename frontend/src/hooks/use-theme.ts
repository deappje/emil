import { useCallback, useState } from "react";

/** Light or dark, following the system until the visitor picks one. */
export function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Private mode: the choice lasts for this visit only.
    }
    setDark(next);
  }, []);

  return { dark, toggle };
}
