import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enSkillBuilder from './locales/skill-builder/english.json';
import hiSkillBuilder from './locales/skill-builder/hindi.json';
import enHero from './locales/hero/english.json';
import hiHero from './locales/hero/hindi.json';
import enFeatures from './locales/features/english.json';
import hiFeatures from './locales/features/hindi.json';
// Import the scheme-recommender namespace translations
import enSchemeRecommender from './locales/scheme-recommender/english.json';
import hiSchemeRecommender from './locales/scheme-recommender/hindi.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { 
        skillbuilder: enSkillBuilder, 
        hero: enHero, 
        featuresname: enFeatures,
        'scheme-recommender': enSchemeRecommender // Add scheme-recommender namespace
      },
      hi: { 
        skillbuilder: hiSkillBuilder, 
        hero: hiHero, 
        featuresname: hiFeatures,
        'scheme-recommender': hiSchemeRecommender // Add scheme-recommender namespace
      },
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    ns: ['skillbuilder', 'hero', 'featuresname', 'scheme-recommender'], // Include scheme-recommender namespace
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