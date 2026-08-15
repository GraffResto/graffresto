"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useSyncExternalStore,
} from "react";
import { Language, translations } from "@/lib/translations";

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (typeof translations)["en"];
};

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = "dineflow_language";
const DEFAULT_LANGUAGE: Language = "en";

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "uz" || value === "ru";
}

// localStorage is an external store, so the language is read through
// useSyncExternalStore. The server snapshot is the default language, which
// keeps the server HTML and the hydration render identical; React then swaps
// in the stored choice on its own — no setState in an effect, no mismatch.
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

// Chosen this session. Keeps the switcher working even when localStorage is
// unavailable, and survives a storage write that silently fails.
let sessionLanguage: Language | null = null;

function getClientLanguage(): Language {
  if (sessionLanguage) return sessionLanguage;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return isLanguage(saved) ? saved : DEFAULT_LANGUAGE;
  } catch {
    // Storage can be blocked (private mode); fall back to the default
    return DEFAULT_LANGUAGE;
  }
}

function getServerLanguage(): Language {
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(
    subscribe,
    getClientLanguage,
    getServerLanguage
  );

  const setLanguage = useCallback((newLanguage: Language) => {
    sessionLanguage = newLanguage;

    try {
      localStorage.setItem(STORAGE_KEY, newLanguage);
    } catch {
      // Not persisted, but the choice still applies for this session
    }

    emitChange();
  }, []);

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
