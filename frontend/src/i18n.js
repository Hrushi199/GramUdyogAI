import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enSkillBuilder from './locales/skill-builder/english.json';
import hiSkillBuilder from './locales/skill-builder/hindi.json';
// Add other languages as needed
// import hiTranslation from './locales/hi/translation.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { skillbuilder: enSkillBuilder },
      hi: { skillbuilder: hiSkillBuilder },
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React handles XSS
    },
  });

export default i18n;