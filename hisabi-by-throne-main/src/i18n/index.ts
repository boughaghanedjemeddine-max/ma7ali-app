import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.json';
import fr from './locales/fr.json';

export const LANGUAGES = [
  { code: 'ar', label: 'العربية', dir: 'rtl', flag: '🇩🇿' },
  { code: 'fr', label: 'Français', dir: 'ltr', flag: '🇫🇷' },
] as const;

export type LangCode = typeof LANGUAGES[number]['code'];

const LANG_KEY = 'ma7ali-lang';

export function getSavedLang(): LangCode {
  const saved = localStorage.getItem(LANG_KEY) as LangCode | null;
  return saved ?? 'ar';
}

export function saveLang(lang: LangCode) {
  localStorage.setItem(LANG_KEY, lang);
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      fr: { translation: fr },
    },
    lng: getSavedLang(),
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
  });

/** Apply dir + lang attribute to <html> */
export function applyLangToDOM(lang: LangCode) {
  const info = LANGUAGES.find(l => l.code === lang);
  if (!info) return;
  document.documentElement.lang = lang;
  document.documentElement.dir = info.dir;
}

// Apply on startup
applyLangToDOM(getSavedLang());

export default i18n;
