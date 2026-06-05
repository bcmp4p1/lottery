"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Start with a deterministic value so SSR and the first client render match
  // (avoids a hydration mismatch); adopt the real theme right after mount.
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // The no-flash script in the layout already applied the class before paint.
    const applied = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(applied);
  }, []);

  // Side effects live in the handler (not in the state updater, which stays pure).
  // We persist only on an explicit toggle, so visitors who never toggle keep
  // following their OS preference on each load.
  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
