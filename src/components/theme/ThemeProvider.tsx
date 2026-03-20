"use client";

import * as React from "react";

type Theme = "dark" | "light";

type ThemeCtx = {
  theme: Theme;
  toggle: () => void;
};

const Ctx = React.createContext<ThemeCtx>({ theme: "dark", toggle: () => {} });

export function useTheme() {
  return React.useContext(Ctx);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>("dark");

  // 초기화: localStorage에서 읽기
  React.useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    const initial = saved ?? "dark";
    setTheme(initial);
    document.documentElement.className = document.documentElement.className
      .replace(/\b(dark|light)\b/g, "")
      .trim() + ` ${initial}`;
  }, []);

  const toggle = React.useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      document.documentElement.className = document.documentElement.className
        .replace(/\b(dark|light)\b/g, "")
        .trim() + ` ${next}`;
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}
