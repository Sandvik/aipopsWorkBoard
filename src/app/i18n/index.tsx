import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Locale, STRINGS, UiStrings } from "./locales";

type LocaleContextValue = {
  locale: Locale;
  strings: UiStrings;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const LOCALE_STORAGE_KEY = "aipops.locale";

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
  if (stored && (stored === "da" || stored === "en")) {
    return stored;
  }
  return "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale());

  useEffect(() => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // ignore
    }
  }, [locale]);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
  };

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      strings: STRINGS[locale],
      setLocale,
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}

export function useStrings(): UiStrings {
  return useLocale().strings;
}

