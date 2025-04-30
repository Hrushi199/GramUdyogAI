import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enSkillBuilder from './locales/skill-builder/english.json';
import hiSkillBuilder from './locales/skill-builder/hindi.json';
import enHero from './locales/hero/english.json';
import hiHero from './locales/hero/hindi.json';
import enFeatures from './locales/features/english.json';
import hiFeatures from './locales/features/hindi.json';
// Add other languages as needed
// import hiTranslation from './locales/hi/translation.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { skillbuilder: enSkillBuilder, hero: enHero, featuresname: enFeatures },
      hi: { skillbuilder: hiSkillBuilder, hero: hiHero, featuresname: hiFeatures },
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    ns: ['skillbuilder', 'hero', 'featuresname'], // Include features namespace
    defaultNS: 'translation', // Default namespace for SkillBuilder
    interpolation: {
      escapeValue: false, // React handles XSS
    },
    saveMissing: true,
    missingKeyHandler: (lng, ns, key) => {
      console.warn(`Missing translation: ${key} in namespace ${ns} for language ${lng}`);
    },
  });

export default i18n;