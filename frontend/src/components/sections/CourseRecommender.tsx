// src/components/sections/CourseRecommender.tsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

// --- TypeScript Interfaces for the new structured API response ---
interface RecommendationItem {
    course_title: string;
    reason: string;
    type: "Platform Course" | "Live Course";
    url: string;
}

interface SuggestionResponse {
    introduction: string;
    recommendations: RecommendationItem[];
}

// --- SVG Icons for Visual Distinction ---
const Icons = {
  platform: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>,
  live: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="9" /></svg>,
  ai: (props: any) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8" /><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M14 2v2" /><path d="M14 20v2" /></svg>
};

// --- Main Component ---
export default function CourseRecommender() {
  const { t, i18n } = useTranslation('course-recommender');
  const [query, setQuery] = useState("");
  const [data, setData] = useState<SuggestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError(t('error.emptyQuery', 'Please enter a skill or topic to search for courses.'));
      return;
    }
    if (cooldown > 0) {
      setError(t('error.cooldown', `Please wait {{seconds}} seconds before searching again.`, { seconds: cooldown }));
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/suggest-courses`;
      const response = await axios.post<SuggestionResponse>(apiUrl, { 
        query,
        language: i18n.language 
      });
      setData(response.data);
      setCooldown(10); 
    } catch (err: any) {
      const defaultError = t('error.connection', 'Could not fetch recommendations. Please ensure the backend server is running.');
      if (err.response?.status === 503) {
          setError(t('error.serviceBusy', 'The recommendation service is busy. Please wait a moment and try again.'));
      } else {
          setError(err.response?.data?.detail || err.message || defaultError);
      }
      setCooldown(10);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-28 relative overflow-hidden">
        {/* Enhanced background with matching gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-900/20 to-black"></div>
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600 rounded-full filter blur-[128px] opacity-20"></div>
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600 rounded-full filter blur-[128px] opacity-20"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-full filter blur-[100px]"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
            {/* Enhanced header with glassmorphism */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16"
            >
                <div className="inline-block p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-sm border border-white/10 mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-6">
                        <Icons.ai className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 mb-4">
                        {t('pageTitle', 'AI Course Recommender')}
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        {t('pageDescription', 'Enter a skill you want to learn to discover tailored courses, schemes, and job opportunities.')}
                    </p>
                </div>
            </motion.div>
            
            {/* Enhanced search form with glassmorphism */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="max-w-4xl mx-auto mb-12"
            >
                <div className="bg-gradient-to-br from-white/5 to-white/0 p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-grow relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t('form.skillsPlaceholder', "E.g., 'Sewing and Tailoring', 'Digital Marketing'...")}
                                className="w-full p-4 bg-black/20 border-2 border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 text-white placeholder-gray-500 transition-all backdrop-blur-sm"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading || cooldown > 0} 
                            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-2xl font-bold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {t('form.searching', 'Searching...')}
                                </>
                            ) : cooldown > 0 ? t('form.wait', 'Wait {{seconds}}s', { seconds: cooldown }) : t('form.submitButton', 'Find Courses')}
                        </button>
                    </form>
                </div>
            </motion.div>

            <AnimatePresence>
                {loading && <LoadingSpinner t={t} />}
                {error && <ErrorMessage message={error} t={t} />}
                {data && <ResultsDisplay data={data} t={t} />}
            </AnimatePresence>
        </div>
    </div>
  );
}

// --- Sub-components for Display ---
const ResultsDisplay = ({ data, t }: { data: SuggestionResponse; t: any }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8, delay: 0.2 }}
    className="max-w-6xl mx-auto"
  >
    <div className="mb-12 p-8 bg-gradient-to-br from-white/5 to-white/0 rounded-3xl border border-white/10 backdrop-blur-sm">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
          <Icons.ai className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white">{t('results.title', 'AI-Powered Suggestions')}</h2>
          <p className="text-gray-400">{t('results.subtitle', 'Personalized recommendations for your learning journey')}</p>
        </div>
      </div>
      <p className="text-gray-300 mb-8 text-lg leading-relaxed">{data.introduction}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.recommendations.map((rec, i) => (
            <RecommendationCard key={i} item={rec} index={i} t={t} />
        ))}
      </div>
    </div>
  </motion.div>
);

const RecommendationCard = ({ item, index, t }: { item: RecommendationItem; index: number; t: any }) => {
    const isPlatform = item.type === "Platform Course";
    const typeColor = isPlatform ? "bg-purple-500/20 text-purple-300 border-purple-500/30" : "bg-blue-500/20 text-blue-300 border-blue-500/30";
    const icon = isPlatform ? <Icons.platform className="w-4 h-4" /> : <Icons.live className="w-4 h-4" />;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 * index }}
            className="group bg-gradient-to-br from-white/5 to-white/0 p-6 rounded-2xl border border-white/10 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 h-full flex flex-col transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10"
        >
            <div className="flex justify-between items-start mb-4">
                <h4 className="font-bold text-lg text-white flex-1 pr-3 group-hover:text-purple-300 transition-colors">{item.course_title}</h4>
                <span className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 border ${typeColor}`}>
                    {icon}
                    {item.type}
                </span>
            </div>
            <p className="text-gray-400 text-sm flex-grow mb-6 leading-relaxed">{item.reason}</p>
            <a 
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto block w-full text-center px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
            >
                {t('actions.knowMore', 'Know More')}
            </a>
        </motion.div>
    )
};

const LoadingSpinner = ({ t }: { t: any }) => (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }} 
    className="text-center p-12"
  >
    <div className="max-w-md mx-auto p-8 bg-gradient-to-br from-white/5 to-white/0 rounded-3xl border border-white/10 backdrop-blur-sm">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-purple-500 mx-auto"></div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl"></div>
      </div>
      <h3 className="mt-6 text-xl font-bold text-white">{t('loading.title', 'Searching for Resources')}</h3>
      <p className="mt-2 text-gray-400">{t('loading.description', 'Our AI is finding the best courses for you...')}</p>
    </div>
  </motion.div>
);

const ErrorMessage = ({ message, t }: { message: string; t: any }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }} 
    animate={{ opacity: 1, y: 0 }} 
    exit={{ opacity: 0 }} 
    className="max-w-2xl mx-auto mb-8"
  >
    <div className="p-6 bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 rounded-2xl backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="font-bold text-xl text-red-300">{t('error.title', 'Something went wrong')}</h3>
      </div>
      <p className="text-red-200">{message}</p>
    </div>
  </motion.div>
);