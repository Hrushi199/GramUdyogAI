import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';


// Import job_mentor_dashboard translations
import jobMentorDashboardEn from './locales/jobmentordashboard/english.json';
import jobMentorDashboardHi from './locales/jobmentordashboard/hindi.json';
import jobMentorDashboardBn from './locales/jobmentordashboard/bengali.json';
import jobMentorDashboardMr from './locales/jobmentordashboard/marathi.json';
import jobMentorDashboardTe from './locales/jobmentordashboard/telugu.json';
import jobMentorDashboardTa from './locales/jobmentordashboard/tamil.json';
import jobMentorDashboardGu from './locales/jobmentordashboard/gujarati.json';
import jobMentorDashboardUr from './locales/jobmentordashboard/urdu.json';
import jobMentorDashboardKn from './locales/jobmentordashboard/kannada.json';
import jobMentorDashboardOr from './locales/jobmentordashboard/odia.json';
import jobMentorDashboardMl from './locales/jobmentordashboard/malayalam.json';
import jobMentorDashboardPa from './locales/jobmentordashboard/punjabi.json';
import jobMentorDashboardAs from './locales/jobmentordashboard/assamese.json';

// Import auth translations
import authEn from './locales/auth/english.json';
import authHi from './locales/auth/hindi.json';
import authBn from './locales/auth/bengali.json';
import authMr from './locales/auth/marathi.json';
import authTe from './locales/auth/telugu.json';
import authTa from './locales/auth/tamil.json';
import authGu from './locales/auth/gujarati.json';
import authUr from './locales/auth/urdu.json';
import authKn from './locales/auth/kannada.json';
import authOr from './locales/auth/odia.json';
import authMl from './locales/auth/malayalam.json';
import authPa from './locales/auth/punjabi.json';
import authAs from './locales/auth/assamese.json';

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

// Import community translations
import communityEn from './locales/community/english.json';
import communityHi from './locales/community/hindi.json';
import communityBn from './locales/community/bengali.json';
import communityMr from './locales/community/marathi.json';
import communityTe from './locales/community/telugu.json';
import communityTa from './locales/community/tamil.json';
import communityGu from './locales/community/gujarati.json';
import communityUr from './locales/community/urdu.json';
import communityKn from './locales/community/kannada.json';
import communityOr from './locales/community/odia.json';
import communityMl from './locales/community/malayalam.json';
import communityPa from './locales/community/punjabi.json';
import communityAs from './locales/community/assamese.json';

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

// Import translation files for stats namespace
import statsEn from './locales/stats/english.json';
import statsHi from './locales/stats/hindi.json';
import statsBn from './locales/stats/bengali.json';
import statsMr from './locales/stats/marathi.json';
import statsTe from './locales/stats/telugu.json';
import statsTa from './locales/stats/tamil.json';
import statsGu from './locales/stats/gujarati.json';
import statsUr from './locales/stats/urdu.json';
import statsKn from './locales/stats/kannada.json';
import statsOr from './locales/stats/odia.json';
import statsMl from './locales/stats/malayalam.json';
import statsPa from './locales/stats/punjabi.json';
import statsAs from './locales/stats/assamese.json';

// Import translation files for ai-assistant namespace
import aiAssistantEn from './locales/ai-assistant/english.json';
import aiAssistantHi from './locales/ai-assistant/hindi.json';
import aiAssistantBn from './locales/ai-assistant/bengali.json';
import aiAssistantMr from './locales/ai-assistant/marathi.json';
import aiAssistantTe from './locales/ai-assistant/telugu.json';
import aiAssistantTa from './locales/ai-assistant/tamil.json';
import aiAssistantGu from './locales/ai-assistant/gujarati.json';
import aiAssistantUr from './locales/ai-assistant/urdu.json';
import aiAssistantKn from './locales/ai-assistant/kannada.json';
import aiAssistantOr from './locales/ai-assistant/odia.json';
import aiAssistantMl from './locales/ai-assistant/malayalam.json';
import aiAssistantPa from './locales/ai-assistant/punjabi.json';
import aiAssistantAs from './locales/ai-assistant/assamese.json';

import courseRecommenderEn from './locales/course-recommender/english.json';
import courseRecommenderHi from './locales/course-recommender/hindi.json';
import courseRecommenderBn from './locales/course-recommender/bengali.json';
import courseRecommenderMr from './locales/course-recommender/marathi.json';
import courseRecommenderTe from './locales/course-recommender/telugu.json';
import courseRecommenderTa from './locales/course-recommender/tamil.json';
import courseRecommenderGu from './locales/course-recommender/gujarati.json';
import courseRecommenderUr from './locales/course-recommender/urdu.json';
import courseRecommenderKn from './locales/course-recommender/kannada.json';
import courseRecommenderOr from './locales/course-recommender/odia.json';
import courseRecommenderMl from './locales/course-recommender/malayalam.json';
import courseRecommenderPa from './locales/course-recommender/punjabi.json';
import courseRecommenderAs from './locales/course-recommender/assamese.json';

import publicProjectsEn from './locales/public-projects/english.json';
import publicProjectsHi from './locales/public-projects/hindi.json';
import publicProjectsBn from './locales/public-projects/bengali.json';
import publicProjectsMr from './locales/public-projects/marathi.json';  
import publicProjectsTe from './locales/public-projects/telugu.json';
import publicProjectsTa from './locales/public-projects/tamil.json';
import publicProjectsGu from './locales/public-projects/gujarati.json';
import publicProjectsUr from './locales/public-projects/urdu.json';
import publicProjectsKn from './locales/public-projects/kannada.json';
import publicProjectsOr from './locales/public-projects/odia.json';
import publicProjectsMl from './locales/public-projects/malayalam.json';
import publicProjectsPa from './locales/public-projects/punjabi.json';
import publicProjectsAs from './locales/public-projects/assamese.json';

// Event Details namespace imports
import eventDetailsEn from './locales/event-details/english.json';
import eventDetailsHi from './locales/event-details/hindi.json';
import eventDetailsBn from './locales/event-details/bengali.json';
import eventDetailsMr from './locales/event-details/marathi.json';
import eventDetailsTe from './locales/event-details/telugu.json';
import eventDetailsTa from './locales/event-details/tamil.json';
import eventDetailsGu from './locales/event-details/gujarati.json';
import eventDetailsPa from './locales/event-details/punjabi.json';
import eventDetailsAs from './locales/event-details/assamese.json';
import eventDetailsUr from './locales/event-details/urdu.json';
import eventDetailsKn from './locales/event-details/kannada.json';
import eventDetailsOr from './locales/event-details/odia.json';
import eventDetailsMl from './locales/event-details/malayalam.json';



// Event Management translations
import eventManagementEn from './locales/event-management/english.json';
import eventManagementHi from './locales/event-management/hindi.json';
import eventManagementBn from './locales/event-management/bengali.json';
import eventManagementTa from './locales/event-management/tamil.json';
import eventManagementTe from './locales/event-management/telugu.json';
import eventManagementMr from './locales/event-management/marathi.json';
import eventManagementGu from './locales/event-management/gujarati.json';
import eventManagementUr from './locales/event-management/urdu.json';
import eventManagementKn from './locales/event-management/kannada.json';
import eventManagementOr from './locales/event-management/odia.json';
import eventManagementMl from './locales/event-management/malayalam.json';
import eventManagementPa from './locales/event-management/punjabi.json';
import eventManagementAs from './locales/event-management/assamese.json';

// Job Board translations
import jobBoardEn from './locales/job-board/english.json';
import jobBoardHi from './locales/job-board/hindi.json';
import jobBoardBn from './locales/job-board/bengali.json';
import jobBoardTa from './locales/job-board/tamil.json';
import jobBoardTe from './locales/job-board/telugu.json';
import jobBoardMr from './locales/job-board/marathi.json';
import jobBoardGu from './locales/job-board/gujarati.json';
import jobBoardUr from './locales/job-board/urdu.json';
import jobBoardKn from './locales/job-board/kannada.json';
import jobBoardOr from './locales/job-board/odia.json';
import jobBoardMl from './locales/job-board/malayalam.json';
import jobBoardPa from './locales/job-board/punjabi.json';
import jobBoardAs from './locales/job-board/assamese.json';

// CSR Dashboard translations














i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        auth: authEn, // Added auth namespace
        skillbuilder: enSkillBuilder,
        hero: enHero,
        featuresname: enFeatures,
        'scheme-recommender': enSchemeRecommender,
        'business-suggestions': enBusinessSuggestion,
        cta: enCTA,
        create_profile: enCreateProfile, // Added create_profile namespacee
        jobmentordashboard: jobMentorDashboardEn, // Added job_mentor_dashboard namespac
        community: communityEn, // Added community namespace
        stats: statsEn, // Added stats namespace
        'ai-assistant': aiAssistantEn, // Added ai-assistant namespace
        'course-recommender': courseRecommenderEn, // Added course-recommender namespace
        'public-projects': publicProjectsEn, // Added public-projects namespace
        'event-details': eventDetailsEn, // Added event-details namespace
        'event-management': eventManagementEn, // Added event-management namespace
        'job-board': jobBoardEn, // Added job-board namespace

      },
      hi: {
        auth: authHi, // Added auth namespace
        skillbuilder: hiSkillBuilder,
        hero: hiHero,
        featuresname: hiFeatures,
        'scheme-recommender': hiSchemeRecommender,
        'business-suggestions': hiBusinessSuggestion,
        cta: hiCTA,
        create_profile: hiCreateProfile, // Added create_profile namespace
        jobmentordashboard: jobMentorDashboardHi, // Added job_mentor_dashboard namespace
        community: communityHi, // Added community namespace
        stats: statsHi, // Added stats namespace
        'ai-assistant': aiAssistantHi, // Added ai-assistant namespace
        'course-recommender': courseRecommenderHi, // Added course-recommender namespace
        'public-projects': publicProjectsHi, // Added public-projects namespace
        'event-details': eventDetailsHi, // Added event-details namespace
        'event-management': eventManagementHi, // Added event-management namespace
        'job-board': jobBoardHi, // Added job-board namespace

      },
      bn: {
        auth: authBn, // Added auth namespace
        skillbuilder: bnSkillBuilder,
        hero: bnHero,
        featuresname: bnFeatures,
        'scheme-recommender': bnSchemeRecommender,
        'business-suggestions': bnBusinessSuggestion,
        cta: bnCTA,
        create_profile: bnCreateProfile, // Added create_profile namespace
        jobmentordashboard: jobMentorDashboardBn, // Added job_mentor_dashboard namespace
        community: communityBn, // Added community namespace
        stats: statsBn, // Added stats namespace
        'ai-assistant': aiAssistantBn, // Added ai-assistant namespace
        'course-recommender': courseRecommenderBn, // Added course-recommender namespace
        'public-projects': publicProjectsBn, // Added public-projects namespace

        'event-details': eventDetailsBn, // Added event-details namespace
        'event-management': eventManagementBn, // Added event-management namespace
        'job-board': jobBoardBn, // Added job-board namespace

      },
      mr: {
        auth: authMr, // Added auth namespace
        skillbuilder: mrSkillBuilder,
        hero: mrHero,
        featuresname: mrFeatures,
        'scheme-recommender': mrSchemeRecommender,
        'business-suggestions': mrBusinessSuggestion,
        cta: mrCTA,
        create_profile: mrCreateProfile, // Added create_profile namespace
        jobmentordashboard: jobMentorDashboardMr, // Added job_mentor_dashboard namespace
        community: communityMr, // Added community namespace
        stats: statsMr, // Added stats namespace
        'ai-assistant': aiAssistantMr, // Added ai-assistant namespace
        'course-recommender': courseRecommenderMr, // Added course-recommender namespace
        'public-projects': publicProjectsMr, // Added public-projects namespace

        'event-details': eventDetailsMr, // Added event-details namespace
        'event-management': eventManagementMr, // Added event-management namespace
        'job-board': jobBoardMr, // Added job-board namespace

      },
      te: {
        auth: authTe, // Added auth namespace
        skillbuilder: teSkillBuilder,
        hero: teHero,
        featuresname: teFeatures,
        'scheme-recommender': teSchemeRecommender,
        'business-suggestions': teBusinessSuggestion,
        cta: teCTA,
        create_profile: teCreateProfile, // Added create_profile namespace
        jobmentordashboard: jobMentorDashboardTe, // Added job_mentor_dashboard namespace
        community: communityTe, // Added community namespace
        stats: statsTe, // Added stats namespace
        'ai-assistant': aiAssistantTe, // Added ai-assistant namespace
        'course-recommender': courseRecommenderTe, // Added course-recommender namespace
        'public-projects': publicProjectsTe, // Added public-projects namespace

        'event-details': eventDetailsTe, // Added event-details namespace
        'event-management': eventManagementTe, // Added event-management namespace
        'job-board': jobBoardTe, // Added job-board namespace

      },
      ta: {
        auth: authTa, // Added auth namespace
        skillbuilder: taSkillBuilder,
        hero: taHero,
        featuresname: taFeatures,
        'scheme-recommender': taSchemeRecommender,
        'business-suggestions': taBusinessSuggestion,
        cta: taCTA,
        create_profile: taCreateProfile, // Added create_profile namespace
        jobmentordashboard: jobMentorDashboardTa, // Added job_mentor_dashboard namespace
        community: communityTa, // Added community namespace
        stats: statsTa, // Added stats namespace
        'ai-assistant': aiAssistantTa, // Added ai-assistant namespace
        'course-recommender': courseRecommenderTa, // Added course-recommender namespace
        'public-projects': publicProjectsTa, // Added public-projects namespace

        'event-details': eventDetailsTa, // Added event-details namespace
        'event-management': eventManagementTa, // Added event-management namespace
        'job-board': jobBoardTa, // Added job-board namespace

      },
      gu: {
        auth: authGu, // Added auth namespace
        skillbuilder: guSkillBuilder,
        hero: guHero,
        featuresname: guFeatures,
        'scheme-recommender': guSchemeRecommender,
        'business-suggestions': guBusinessSuggestion,
        cta: guCTA,
        create_profile: guCreateProfile, // Added create_profile namespace
        jobmentordashboard: jobMentorDashboardGu, // Added job_mentor_dashboard namespace
        community: communityGu, // Added community namespace
        stats: statsGu, // Added stats namespace
        'ai-assistant': aiAssistantGu, // Added ai-assistant namespace
        'course-recommender': courseRecommenderGu, // Added course-recommender namespace
        'public-projects': publicProjectsGu, // Added public-projects namespace

        'event-details': eventDetailsGu, // Added event-details namespace
        'event-management': eventManagementGu, // Added event-management namespace
        'job-board': jobBoardGu, // Added job-board namespace

      },
      ur: {
        auth: authUr, // Added auth namespace
        skillbuilder: urSkillBuilder,
        hero: urHero,
        featuresname: urFeatures,
        'scheme-recommender': urSchemeRecommender,
        'business-suggestions': urBusinessSuggestion,
        cta: urCTA,
        create_profile: urCreateProfile, // Added create_profile namespace
        jobmentordashboard: jobMentorDashboardUr, // Added job_mentor_dashboard namespace
        community: communityUr, // Added community namespace
        stats: statsUr, // Added stats namespace
        'ai-assistant': aiAssistantUr, // Added ai-assistant namespace
        'course-recommender': courseRecommenderUr, // Added course-recommender namespace
        'public-projects': publicProjectsUr, // Added public-projects namespace

        'event-details': eventDetailsUr, // Added event-details namespace
        'event-management': eventManagementUr, // Added event-management namespace
        'job-board': jobBoardUr, // Added job-board namespace

      },
      kn: {
        auth: authKn, // Added auth namespace
        skillbuilder: knSkillBuilder,
        hero: knHero,
        featuresname: knFeatures,
        'scheme-recommender': knSchemeRecommender,
        'business-suggestions': knBusinessSuggestion,
        cta: knCTA,
        create_profile: knCreateProfile, // Added create_profile namespace
        jobmentordashboard: jobMentorDashboardKn, // Added job_mentor_dashboard namespace
        community: communityKn, // Added community 
        stats: statsKn, // Added stats namespace
        'ai-assistant': aiAssistantKn, // Added ai-assistant namespace
        'course-recommender': courseRecommenderKn, // Added course-recommender namespace
        'public-projects': publicProjectsKn, // Added public-projects namespace

        'event-details': eventDetailsKn, // Added event-details namespace
        'event-management': eventManagementKn, // Added event-management namespace
        'job-board': jobBoardKn, // Added job-board namespace

      },
      or: {
        auth: authOr, // Added auth namespace
        skillbuilder: orSkillBuilder,
        hero: orHero,
        featuresname: orFeatures,
        'scheme-recommender': orSchemeRecommender,
        'business-suggestions': orBusinessSuggestion,
        cta: orCTA,
        create_profile: orCreateProfile, // Added create_profile namespace
        jobmentordashboard: jobMentorDashboardOr, // Added job_mentor_dashboard namespace
        community: communityOr, // Added community namespace
        stats: statsOr, // Added stats namespace
        'ai-assistant': aiAssistantOr, // Added ai-assistant namespace
        'course-recommender': courseRecommenderOr, // Added course-recommender namespace
        'public-projects': publicProjectsOr, // Added public-projects namespace

        'event-details': eventDetailsOr, // Added event-details namespace
        'event-management': eventManagementOr, // Added event-management namespace
        'job-board': jobBoardOr, // Added job-board namespace

      },
      ml: {
        auth: authMl, // Added auth namespace
        skillbuilder: mlSkillBuilder,
        hero: mlHero,
        featuresname: mlFeatures,
        'scheme-recommender': mlSchemeRecommender,
        'business-suggestions': mlBusinessSuggestion,
        cta: mlCTA,
        create_profile: mlCreateProfile, // Added create_profile namespace
        jobmentordashboard: jobMentorDashboardMl, // Added job_mentor_dashboard namespace
        community: communityMl, // Added community 
        stats: statsMl, // Added stats namespace
        'ai-assistant': aiAssistantMl, // Added ai-assistant namespace
        'course-recommender': courseRecommenderMl, // Added course-recommender namespace
        'public-projects': publicProjectsMl, // Added public-projects namespace

        'event-details': eventDetailsMl, // Added event-details namespace
        'event-management': eventManagementMl, // Added event-management namespace
        'job-board': jobBoardMl, // Added job-board namespace

      },
      pa: {
        auth: authPa, // Added auth namespace
        skillbuilder: paSkillBuilder,
        hero: paHero,
        featuresname: paFeatures,
        'scheme-recommender': paSchemeRecommender,
        'business-suggestions': paBusinessSuggestion,
        cta: paCTA,
        create_profile: paCreateProfile, // Added create_profile namespace
        jobmentordashboard: jobMentorDashboardPa, // Added job_mentor_dashboard namespace
        community: communityPa, // Added community namespace
        stats: statsPa, // Added stats namespace
        'ai-assistant': aiAssistantPa, // Added ai-assistant namespace
        'course-recommender': courseRecommenderPa, // Added course-recommender namespace
        'public-projects': publicProjectsPa, // Added public-projects namespace

        'event-details': eventDetailsPa, // Added event-details namespace
        'event-management': eventManagementPa, // Added event-management namespace
        'job-board': jobBoardPa, // Added job-board namespace

      },
      as: {
        auth: authAs, // Added auth namespace
        skillbuilder: asSkillBuilder,
        hero: asHero,
        featuresname: asFeatures,
        'scheme-recommender': asSchemeRecommender,
        'business-suggestions': asBusinessSuggestion,
        cta: asCTA,
        create_profile: asCreateProfile, // Added create_profile namespace
        jobmentordashboard: jobMentorDashboardAs, // Added job_mentor_dashboard namespace
        community: communityAs, // Added community namespace
        stats: statsAs, // Added stats namespace
        'ai-assistant': aiAssistantAs, // Added ai-assistant namespace
        'course-recommender': courseRecommenderAs, // Added course-recommender namespace
        'public-projects': publicProjectsAs, // Added public-projects namespace

        'event-details': eventDetailsAs, // Added event-details namespace
        'event-management': eventManagementAs, // Added event-management namespace
        'job-board': jobBoardAs, // Added job-board namespace

      },
    },
    lng: 'en',
    fallbackLng: 'en',
    ns: [
      'auth', // Added auth to namespaces list
      'skillbuilder',
      'hero',
      'featuresname',
      'scheme-recommender',
      'business-suggestions',
      'cta',
      'create_profile', // Added create_profile to namespaces list
      'jobmentordashboard', // Added job_mentor_dashboard to namespaces list
      'community', // Added community to namespaces list
      'stats', // Added stats to namespaces list
      'ai-assistant', // Added ai-assistant to namespaces list
      'course-recommender', // Added course-recommender to namespaces list
      'public-projects', // Added public-projects to namespaces list
      'event-details', // Added event-details to namespaces list
      'event-management', // Added event-management to namespaces list
      'job-board', // Added job-board to namespaces list
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
