import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Existing namespace translations
import enSkillBuilder from './locales/skill-builder/english.json';
import hiSkillBuilder from './locales/skill-builder/hindi.json';

import enHero from './locales/hero/english.json';
import hiHero from './locales/hero/hindi.json';

import enFeatures from './locales/features/english.json';
import hiFeatures from './locales/features/hindi.json';

import enSchemeRecommender from './locales/scheme-recommender/english.json';
import hiSchemeRecommender from './locales/scheme-recommender/hindi.json';

import enBusinessSuggestion from './locales/business-suggestions/english.json';
import hiBusinessSuggestion from './locales/business-suggestions/hindi.json';

// ✅ New CTA namespace translations
import enCTA from './locales/cta/english.json';
import hiCTA from './locales/cta/hindi.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        skillbuilder: enSkillBuilder,
        hero: enHero,
        featuresname: enFeatures,
        'scheme-recommender': enSchemeRecommender,
        'business-suggestions': enBusinessSuggestion,
        cta: enCTA, // ✅ Added CTA namespace
      },
      hi: {
        skillbuilder: hiSkillBuilder,
        hero: hiHero,
        featuresname: hiFeatures,
        'scheme-recommender': hiSchemeRecommender,
        'business-suggestions': hiBusinessSuggestion,
        cta: hiCTA, // ✅ Added CTA namespace
      },
    },
    lng: 'en',
    fallbackLng: 'en',
    ns: [
      'skillbuilder',
      'hero',
      'featuresname',
      'scheme-recommender',
      'business-suggestions',
      'cta' // ✅ Added CTA to namespaces list
    ],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    saveMissing: true,
    missingKeyHandler: (lng, ns, key) => {
      console.warn(`Missing translation: ${key} in namespace ${ns} for language ${lng}`);
    },
  });

export default i18n;
