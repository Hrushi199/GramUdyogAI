// /////1st version of i18n.js file

// import i18n from 'i18next';
// import { initReactI18next } from 'react-i18next';


// // Existing namespace translations
// import enSkillBuilder from './locales/skill-builder/english.json';
// import hiSkillBuilder from './locales/skill-builder/hindi.json';
// import bnSkillBuilder from './locales/skill-builder/bengali.json'; // Bengali
// import mrSkillBuilder from './locales/skill-builder/marathi.json'; // Marathi
// import teSkillBuilder from './locales/skill-builder/telugu.json'; // Telugu
// import taSkillBuilder from './locales/skill-builder/tamil.json'; // Tamil
// import guSkillBuilder from './locales/skill-builder/gujarati.json'; // Gujarati
// import urSkillBuilder from './locales/skill-builder/urdu.json'; // Urdu
// import knSkillBuilder from './locales/skill-builder/kannada.json'; // Kannada
// import orSkillBuilder from './locales/skill-builder/odia.json'; // Odia
// import mlSkillBuilder from './locales/skill-builder/malayalam.json'; // Malayalam
// import paSkillBuilder from './locales/skill-builder/punjabi.json'; // Punjabi
// import asSkillBuilder from './locales/skill-builder/assamese.json'; // Assamese


// import enHero from './locales/hero/english.json';
// import hiHero from './locales/hero/hindi.json';
// import bnHero from './locales/hero/bengali.json'; // Bengali
// import mrHero from './locales/hero/marathi.json'; // Marathi
// import teHero from './locales/hero/telugu.json'; // Telugu
// import taHero from './locales/hero/tamil.json'; // Tamil
// import guHero from './locales/hero/gujarati.json'; // Gujarati
// import urHero from './locales/hero/urdu.json'; // Urdu
// import knHero from './locales/hero/kannada.json'; // Kannada
// import orHero from './locales/hero/odia.json'; // Odia
// import mlHero from './locales/hero/malayalam.json'; // Malayalam
// import paHero from './locales/hero/punjabi.json'; // Punjabi
// import asHero from './locales/hero/assamese.json'; // Assamese

// import enFeatures from './locales/features/english.json';
// import hiFeatures from './locales/features/hindi.json';
// import bnFeatures from './locales/features/bengali.json'; // Bengali
// import mrFeatures from './locales/features/marathi.json'; // Marathi
// import teFeatures from './locales/features/telugu.json'; // Telugu
// import taFeatures from './locales/features/tamil.json'; // Tamil
// import guFeatures from './locales/features/gujarati.json'; // Gujarati
// import urFeatures from './locales/features/urdu.json'; // Urdu
// import knFeatures from './locales/features/kannada.json'; // Kannada
// import orFeatures from './locales/features/odia.json'; // Odia
// import mlFeatures from './locales/features/malayalam.json'; // Malayalam
// import paFeatures from './locales/features/punjabi.json'; // Punjabi
// import asFeatures from './locales/features/assamese.json'; // Assamese

// import enSchemeRecommender from './locales/scheme-recommender/english.json';
// import hiSchemeRecommender from './locales/scheme-recommender/hindi.json';
// import bnSchemeRecommender from './locales/scheme-recommender/bengali.json'; // Bengali
// import mrSchemeRecommender from './locales/scheme-recommender/marathi.json'; // Marathi
// import teSchemeRecommender from './locales/scheme-recommender/telugu.json'; // Telugu
// import taSchemeRecommender from './locales/scheme-recommender/tamil.json'; // Tamil
// import guSchemeRecommender from './locales/scheme-recommender/gujarati.json'; // Gujarati
// import urSchemeRecommender from './locales/scheme-recommender/urdu.json'; // Urdu
// import knSchemeRecommender from './locales/scheme-recommender/kannada.json'; // Kannada
// import orSchemeRecommender from './locales/scheme-recommender/odia.json'; // Odia
// import mlSchemeRecommender from './locales/scheme-recommender/malayalam.json'; // Malayalam
// import paSchemeRecommender from './locales/scheme-recommender/punjabi.json'; // Punjabi
// import asSchemeRecommender from './locales/scheme-recommender/assamese.json'; // Assamese

// import enBusinessSuggestion from './locales/business-suggestions/english.json';
// import hiBusinessSuggestion from './locales/business-suggestions/hindi.json';
// import bnBusinessSuggestion from './locales/business-suggestions/bengali.json'; // Bengali
// import mrBusinessSuggestion from './locales/business-suggestions/marathi.json'; // Marathi
// import teBusinessSuggestion from './locales/business-suggestions/telugu.json'; // Telugu
// import taBusinessSuggestion from './locales/business-suggestions/tamil.json'; // Tamil
// import guBusinessSuggestion from './locales/business-suggestions/gujarati.json'; // Gujarati
// import urBusinessSuggestion from './locales/business-suggestions/urdu.json'; // Urdu
// import knBusinessSuggestion from './locales/business-suggestions/kannada.json'; // Kannada
// import orBusinessSuggestion from './locales/business-suggestions/odia.json'; // Odia
// import mlBusinessSuggestion from './locales/business-suggestions/malayalam.json'; // Malayalam
// import paBusinessSuggestion from './locales/business-suggestions/punjabi.json'; // Punjabi
// import asBusinessSuggestion from './locales/business-suggestions/assamese.json'; // Assamese

// // New CTA namespace translations
// import enCTA from './locales/cta/english.json';
// import hiCTA from './locales/cta/hindi.json';
// import bnCTA from './locales/cta/bengali.json'; // Bengali
// import mrCTA from './locales/cta/marathi.json'; // Marathi
// import teCTA from './locales/cta/telugu.json'; // Telugu
// import taCTA from './locales/cta/tamil.json'; // Tamil
// import guCTA from './locales/cta/gujarati.json'; // Gujarati
// import urCTA from './locales/cta/urdu.json'; // Urdu
// import knCTA from './locales/cta/kannada.json'; // Kannada
// import orCTA from './locales/cta/odia.json'; // Odia
// import mlCTA from './locales/cta/malayalam.json'; // Malayalam
// import paCTA from './locales/cta/punjabi.json'; // Punjabi
// import asCTA from './locales/cta/assamese.json'; // Assamese

// i18n
//   .use(initReactI18next)
//   .init({
//     resources: {
//       en: {
//         skillbuilder: enSkillBuilder,
//         hero: enHero,
//         featuresname: enFeatures,
//         'scheme-recommender': enSchemeRecommender,
//         'business-suggestions': enBusinessSuggestion,
//         cta: enCTA, //   Added CTA namespace
//       },
//       hi: {
//         skillbuilder: hiSkillBuilder,
//         hero: hiHero,
//         featuresname: hiFeatures,
//         'scheme-recommender': hiSchemeRecommender,
//         'business-suggestions': hiBusinessSuggestion,
//         cta: hiCTA, //   Added CTA namespace
//       },
//       bn: {
//         'business-suggestions': bnBusinessSuggestion,
//         cta: bnCTA, //   Added CTA namespace
//         featuresname: bnFeatures,
//         hero: bnHero,
//         'scheme-recommender': bnSchemeRecommender,
//         skillbuilder: bnSkillBuilder,
//       },
//       mr: {
//         'business-suggestions': mrBusinessSuggestion,
//         cta: mrCTA, //   Added CTA 
//         featuresname: mrFeatures,
//         hero: mrHero,
//         'scheme-recommender': mrSchemeRecommender,
//         skillbuilder: mrSkillBuilder,
//       },
//       te: {
//         'business-suggestions': teBusinessSuggestion,
//         cta: teCTA, //   Added CTA 
//         featuresname: teFeatures,
//         hero: teHero,
//         'scheme-recommender': teSchemeRecommender,
//         skillbuilder: teSkillBuilder,
//       },
//       ta: {
//         'business-suggestions': taBusinessSuggestion,
//         cta: taCTA, //   Added CTA namespace
//         featuresname: taFeatures,
//         hero: taHero,
//         'scheme-recommender': taSchemeRecommender,
//         skillbuilder: taSkillBuilder,
//       },
//       gu: {
//         'business-suggestions': guBusinessSuggestion,
//         cta: guCTA, //   Added CTA namespace
//         featuresname: guFeatures,
//         hero: guHero,
//         'scheme-recommender': guSchemeRecommender,
//         skillbuilder: guSkillBuilder,
//       },
//       ur: {
//         'business-suggestions': urBusinessSuggestion,
//         cta: urCTA, //   Added CTA 
//         featuresname: urFeatures,
//         hero: urHero,
//         'scheme-recommender': urSchemeRecommender,
//         skillbuilder: urSkillBuilder,
//       },
//       kn: {
//         'business-suggestions': knBusinessSuggestion,
//         cta: knCTA, //   Added CTA 
//         featuresname: knFeatures,
//         hero: knHero,
//         'scheme-recommender': knSchemeRecommender,
//         skillbuilder: knSkillBuilder,
//       },
//       or: {
//         'business-suggestions': orBusinessSuggestion,
//         cta: orCTA, //   Added CTA 
//         featuresname: orFeatures,
//         hero: orHero, 
//         'scheme-recommender': orSchemeRecommender,
//         skillbuilder: orSkillBuilder,
//       },
//       ml: {
//         'business-suggestions': mlBusinessSuggestion,
//         cta: mlCTA, //   Added CTA 
//         featuresname: mlFeatures,
//         hero: mlHero,
//         'scheme-recommender': mlSchemeRecommender,  
//         skillbuilder: mlSkillBuilder,
//       },
//       pa: {
//         'business-suggestions': paBusinessSuggestion,
//         cta: paCTA, //   Added CTA 
//         featuresname: paFeatures,
//         hero: paHero,
//         'scheme-recommender': paSchemeRecommender,
//         skillbuilder: paSkillBuilder,
//       },
//       as: {
//         'business-suggestions': asBusinessSuggestion,
//         cta: asCTA, //   Added CTA 
//         featuresname: asFeatures,
//         hero: asHero,
//         'scheme-recommender': asSchemeRecommender,
//         skillbuilder: asSkillBuilder,
//       },
//     },
//     lng: 'en',
//     fallbackLng: 'en',
//     ns: [
//       'skillbuilder',
//       'hero',
//       'featuresname',
//       'scheme-recommender',
//       'business-suggestions',
//       'cta' //  Added CTA to namespaces list
//     ],
//     defaultNS: 'translation',
//     interpolation: {
//       escapeValue: false,
//     },
//     saveMissing: true,
//     missingKeyHandler: (lng, ns, key) => {
//       console.warn(`Missing translation: ${key} in namespace ${ns} for language ${lng}`);
//     },
//   });

// export default i18n;

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Existing namespace translations
import enSkillBuilder from './locales/skill-builder/english.json';
import hiSkillBuilder from './locales/skill-builder/hindi.json';
import bnSkillBuilder from './locales/skill-builder/bengali.json';
import mrSkillBuilder from './locales/skill-builder/marathi.json';
import teSkillBuilder from './locales/skill-builder/telugu.json';
import taSkillBuilder from './locales/skill-builder/tamil.json';
import guSkillBuilder from './locales/skill-builder/gujarati.json';
import urSkillBuilder from './locales/skill-builder/urdu.json';
import knSkillBuilder from './locales/skill-builder/kannada.json';
import orSkillBuilder from './locales/skill-builder/odia.json';
import mlSkillBuilder from './locales/skill-builder/malayalam.json';
import paSkillBuilder from './locales/skill-builder/punjabi.json';
import asSkillBuilder from './locales/skill-builder/assamese.json';

import enHero from './locales/hero/english.json';
import hiHero from './locales/hero/hindi.json';
import bnHero from './locales/hero/bengali.json';
import mrHero from './locales/hero/marathi.json';
import teHero from './locales/hero/telugu.json';
import taHero from './locales/hero/tamil.json';
import guHero from './locales/hero/gujarati.json';
import urHero from './locales/hero/urdu.json';
import knHero from './locales/hero/kannada.json';
import orHero from './locales/hero/odia.json';
import mlHero from './locales/hero/malayalam.json';
import paHero from './locales/hero/punjabi.json';
import asHero from './locales/hero/assamese.json';

import enFeatures from './locales/features/english.json';
import hiFeatures from './locales/features/hindi.json';
import bnFeatures from './locales/features/bengali.json';
import mrFeatures from './locales/features/marathi.json';
import teFeatures from './locales/features/telugu.json';
import taFeatures from './locales/features/tamil.json';
import guFeatures from './locales/features/gujarati.json';
import urFeatures from './locales/features/urdu.json';
import knFeatures from './locales/features/kannada.json';
import orFeatures from './locales/features/odia.json';
import mlFeatures from './locales/features/malayalam.json';
import paFeatures from './locales/features/punjabi.json';
import asFeatures from './locales/features/assamese.json';

import enSchemeRecommender from './locales/scheme-recommender/english.json';
import hiSchemeRecommender from './locales/scheme-recommender/hindi.json';
import bnSchemeRecommender from './locales/scheme-recommender/bengali.json';
import mrSchemeRecommender from './locales/scheme-recommender/marathi.json';
import teSchemeRecommender from './locales/scheme-recommender/telugu.json';
import taSchemeRecommender from './locales/scheme-recommender/tamil.json';
import guSchemeRecommender from './locales/scheme-recommender/gujarati.json';
import urSchemeRecommender from './locales/scheme-recommender/urdu.json';
import knSchemeRecommender from './locales/scheme-recommender/kannada.json';
import orSchemeRecommender from './locales/scheme-recommender/odia.json';
import mlSchemeRecommender from './locales/scheme-recommender/malayalam.json';
import paSchemeRecommender from './locales/scheme-recommender/punjabi.json';
import asSchemeRecommender from './locales/scheme-recommender/assamese.json';

import enBusinessSuggestion from './locales/business-suggestions/english.json';
import hiBusinessSuggestion from './locales/business-suggestions/hindi.json';
import bnBusinessSuggestion from './locales/business-suggestions/bengali.json';
import mrBusinessSuggestion from './locales/business-suggestions/marathi.json';
import teBusinessSuggestion from './locales/business-suggestions/telugu.json';
import taBusinessSuggestion from './locales/business-suggestions/tamil.json';
import guBusinessSuggestion from './locales/business-suggestions/gujarati.json';
import urBusinessSuggestion from './locales/business-suggestions/urdu.json';
import knBusinessSuggestion from './locales/business-suggestions/kannada.json';
import orBusinessSuggestion from './locales/business-suggestions/odia.json';
import mlBusinessSuggestion from './locales/business-suggestions/malayalam.json';
import paBusinessSuggestion from './locales/business-suggestions/punjabi.json';
import asBusinessSuggestion from './locales/business-suggestions/assamese.json';

import enCTA from './locales/cta/english.json';
import hiCTA from './locales/cta/hindi.json';
import bnCTA from './locales/cta/bengali.json';
import mrCTA from './locales/cta/marathi.json';
import teCTA from './locales/cta/telugu.json';
import taCTA from './locales/cta/tamil.json';
import guCTA from './locales/cta/gujarati.json';
import urCTA from './locales/cta/urdu.json';
import knCTA from './locales/cta/kannada.json';
import orCTA from './locales/cta/odia.json';
import mlCTA from './locales/cta/malayalam.json';
import paCTA from './locales/cta/punjabi.json';
import asCTA from './locales/cta/assamese.json';

// New create_profile namespace translations
import enCreateProfile from './locales/create-profile/english.json';
import hiCreateProfile from './locales/create-profile/hindi.json';
import bnCreateProfile from './locales/create-profile/bengali.json';
import mrCreateProfile from './locales/create-profile/marathi.json';
import teCreateProfile from './locales/create-profile/telugu.json';
import taCreateProfile from './locales/create-profile/tamil.json';
import guCreateProfile from './locales/create-profile/gujarati.json';
import urCreateProfile from './locales/create-profile/urdu.json';
import knCreateProfile from './locales/create-profile/kannada.json';
import orCreateProfile from './locales/create-profile/odia.json';
import mlCreateProfile from './locales/create-profile/malayalam.json';
import paCreateProfile from './locales/create-profile/punjabi.json';
import asCreateProfile from './locales/create-profile/assamese.json';

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
        cta: enCTA,
        create_profile: enCreateProfile, // Added create_profile namespace
      },
      hi: {
        skillbuilder: hiSkillBuilder,
        hero: hiHero,
        featuresname: hiFeatures,
        'scheme-recommender': hiSchemeRecommender,
        'business-suggestions': hiBusinessSuggestion,
        cta: hiCTA,
        create_profile: hiCreateProfile, // Added create_profile namespace
      },
      bn: {
        skillbuilder: bnSkillBuilder,
        hero: bnHero,
        featuresname: bnFeatures,
        'scheme-recommender': bnSchemeRecommender,
        'business-suggestions': bnBusinessSuggestion,
        cta: bnCTA,
        create_profile: bnCreateProfile, // Added create_profile namespace
      },
      mr: {
        skillbuilder: mrSkillBuilder,
        hero: mrHero,
        featuresname: mrFeatures,
        'scheme-recommender': mrSchemeRecommender,
        'business-suggestions': mrBusinessSuggestion,
        cta: mrCTA,
        create_profile: mrCreateProfile, // Added create_profile namespace
      },
      te: {
        skillbuilder: teSkillBuilder,
        hero: teHero,
        featuresname: teFeatures,
        'scheme-recommender': teSchemeRecommender,
        'business-suggestions': teBusinessSuggestion,
        cta: teCTA,
        create_profile: teCreateProfile, // Added create_profile namespace
      },
      ta: {
        skillbuilder: taSkillBuilder,
        hero: taHero,
        featuresname: taFeatures,
        'scheme-recommender': taSchemeRecommender,
        'business-suggestions': taBusinessSuggestion,
        cta: taCTA,
        create_profile: taCreateProfile, // Added create_profile namespace
      },
      gu: {
        skillbuilder: guSkillBuilder,
        hero: guHero,
        featuresname: guFeatures,
        'scheme-recommender': guSchemeRecommender,
        'business-suggestions': guBusinessSuggestion,
        cta: guCTA,
        create_profile: guCreateProfile, // Added create_profile namespace
      },
      ur: {
        skillbuilder: urSkillBuilder,
        hero: urHero,
        featuresname: urFeatures,
        'scheme-recommender': urSchemeRecommender,
        'business-suggestions': urBusinessSuggestion,
        cta: urCTA,
        create_profile: urCreateProfile, // Added create_profile namespace
      },
      kn: {
        skillbuilder: knSkillBuilder,
        hero: knHero,
        featuresname: knFeatures,
        'scheme-recommender': knSchemeRecommender,
        'business-suggestions': knBusinessSuggestion,
        cta: knCTA,
        create_profile: knCreateProfile, // Added create_profile namespace
      },
      or: {
        skillbuilder: orSkillBuilder,
        hero: orHero,
        featuresname: orFeatures,
        'scheme-recommender': orSchemeRecommender,
        'business-suggestions': orBusinessSuggestion,
        cta: orCTA,
        create_profile: orCreateProfile, // Added create_profile namespace
      },
      ml: {
        skillbuilder: mlSkillBuilder,
        hero: mlHero,
        featuresname: mlFeatures,
        'scheme-recommender': mlSchemeRecommender,
        'business-suggestions': mlBusinessSuggestion,
        cta: mlCTA,
        create_profile: mlCreateProfile, // Added create_profile namespace
      },
      pa: {
        skillbuilder: paSkillBuilder,
        hero: paHero,
        featuresname: paFeatures,
        'scheme-recommender': paSchemeRecommender,
        'business-suggestions': paBusinessSuggestion,
        cta: paCTA,
        create_profile: paCreateProfile, // Added create_profile namespace
      },
      as: {
        skillbuilder: asSkillBuilder,
        hero: asHero,
        featuresname: asFeatures,
        'scheme-recommender': asSchemeRecommender,
        'business-suggestions': asBusinessSuggestion,
        cta: asCTA,
        create_profile: asCreateProfile, // Added create_profile namespace
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
      'cta',
      'create_profile' // Added create_profile to namespaces list
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