export type Locale = 'en' | 'np';

export const LOCALE_STORAGE_KEY = 'shopflow_locale';

const localeLabels: Record<Locale, string> = {
  en: 'English',
  np: 'नेपlी',
};

const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  np: 'ltr',
};

// English-only for now — Nepali is disabled at the source so it can never
// be loaded or selected, even if an old value is sitting in localStorage.
export function isLocale(value: string | null | undefined): value is Locale {
  return value === 'en';
}

let currentLocale: Locale = getStoredLocale();
const listeners = new Set<(locale: Locale) => void>();

export function getLocaleLabel(locale: Locale) {
  return localeLabels[locale];
}

export function getLocaleDirection(locale: Locale) {
  return localeDirections[locale];
}

export function getStoredLocale(): Locale {
  return 'en';
}

export function getCurrentLocale() {
  return currentLocale;
}

export function setCurrentLocale(locale: Locale) {
  currentLocale = locale;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }
  listeners.forEach((listener) => listener(locale));
}

export function subscribeLocale(listener: (locale: Locale) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}