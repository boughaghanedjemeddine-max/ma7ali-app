import { useTranslation } from 'react-i18next';
import { LANGUAGES, LangCode, saveLang, applyLangToDOM } from '@/i18n';

export function useLanguage() {
  const { i18n } = useTranslation();

  const currentLang = i18n.language as LangCode;
  const currentLangInfo = LANGUAGES.find(l => l.code === currentLang) ?? LANGUAGES[0];

  async function setLanguage(lang: LangCode) {
    await i18n.changeLanguage(lang);
    saveLang(lang);
    applyLangToDOM(lang);
  }

  return { currentLang, currentLangInfo, setLanguage, languages: LANGUAGES };
}
