"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type SupportedLang = "en" | "ko" | "ja" | "zh";

export const LANG_OPTIONS: { value: SupportedLang; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "ko", label: "KO" },
  { value: "ja", label: "JA" },
  { value: "zh", label: "ZH" },
];

type LanguageContextValue = {
  lang: SupportedLang;
  setLang: (lang: SupportedLang) => void;
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
});

const STORAGE_KEY = "admin_lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<SupportedLang>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as SupportedLang | null;
    if (stored && LANG_OPTIONS.some((o) => o.value === stored)) {
      setLangState(stored);
    }
  }, []);

  function setLang(next: SupportedLang) {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
