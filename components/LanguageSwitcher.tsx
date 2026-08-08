"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { Language } from "@/lib/translations";
import { useLanguage } from "@/components/LanguageProvider";

const languageOptions: {
  label: string;
  fullLabel: string;
  value: Language;
}[] = [
  {
    label: "EN",
    fullLabel: "English",
    value: "en",
  },
  {
    label: "UZ",
    fullLabel: "O‘zbek",
    value: "uz",
  },
  {
    label: "RU",
    fullLabel: "Русский",
    value: "ru",
  },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeLanguage =
    languageOptions.find((option) => option.value === language) ||
    languageOptions[0];

  function handleLanguageChange(value: Language) {
    setLanguage(value);
    setIsOpen(false);
  }

  // Prevent hydration mismatch by displaying static label during SSR
  const displayLabel = mounted ? activeLanguage.label : "EN";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex items-center gap-2 rounded-xl border border-orange-100 bg-white px-3 py-2 text-sm font-black text-gray-800 shadow-sm hover:bg-orange-50 transition"
      >
        <Globe size={16} className="text-orange-500" />
        <span>{displayLabel}</span>
        <ChevronDown
          size={15}
          className={`text-gray-500 transition ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-xl">
          {languageOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleLanguageChange(option.value)}
              className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold transition ${
                language === option.value
                  ? "bg-orange-50 text-orange-600"
                  : "text-gray-700 hover:bg-orange-50"
              }`}
            >
              <span>{option.fullLabel}</span>
              <span className="text-xs font-mono">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}