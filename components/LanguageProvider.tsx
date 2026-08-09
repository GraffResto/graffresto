"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useState,
} from "react";
import { Language, translations } from "@/lib/translations";

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (typeof translations)["en"];
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dineflow_language") as Language;
      if (saved === "en" || saved === "uz" || saved === "ru") {
        return saved;
      }
    }
    return "en";
  });

  function setLanguage(newLanguage: Language) {
    setLanguageState(newLanguage);
    if (typeof window !== "undefined") {
      localStorage.setItem("dineflow_language", newLanguage);
    }
  }

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}