'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Dictionary } from './types';
import { de } from './de';
import { en } from './en';

type Locale = 'de' | 'en';

const DICTIONARIES: Record<Locale, Dictionary> = { de, en };

interface I18nContextValue {
  locale: Locale;
  t: Dictionary;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Deterministischer Default für Server- UND allerersten Client-Render.
 * Node 21+ bringt einen globalen `navigator` mit (typischerweise
 * `language: "en-US"`), der beim Static-Export-Build fälschlich als
 * "echter" Browser gelesen würde — das hätte Server-HTML (Node-navigator)
 * und Client-HTML (echter Browser-navigator) auseinanderlaufen lassen und
 * einen React-Hydration-Mismatch ausgelöst. Deshalb wird die Spracherkennung
 * bewusst erst nach dem Mount in einem Effekt durchgeführt.
 */
const DEFAULT_LOCALE: Locale = 'de';

function detectBrowserLocale(): Locale {
  return navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocale(detectBrowserLocale());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<I18nContextValue>(() => ({ locale, t: DICTIONARIES[locale], setLocale }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
