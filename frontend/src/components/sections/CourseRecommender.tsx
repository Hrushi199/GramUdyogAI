// src/components/sections/CourseRecommender.tsx
import React, { useState, useEffect } from "react";
<<<<<<< HEAD
import { useTranslation } from "react-i18next";
import ParticleBackground from "../ui/ParticleBackground";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
=======
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from 'react-i18next';
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48

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
  const [query, setQuery] = useState("");
  const [data, setData] = useState<SuggestionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
<<<<<<< HEAD
=======
  const [translatingIdx, setTranslatingIdx] = useState<number | null>(null);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { t, i18n } = useTranslation('course-recommender');
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
<<<<<<< HEAD
      setError("Please enter a skill or topic to search for courses.");
      return;
    }
    if (cooldown > 0) {
      setError(`Please wait ${cooldown} seconds before searching again.`);
=======
      setError(t('error.emptyQuery'));
      return;
    }
    if (cooldown > 0) {
      setError(t('error.cooldown', { seconds: cooldown }));
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
<<<<<<< HEAD
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL}/api/suggest-courses`;
      const response = await axios.post<SuggestionResponse>(apiUrl, { query });
      setData(response.data);
      setCooldown(10); 
    } catch (err: any) {
      const defaultError = "Could not fetch recommendations. Please ensure the backend server is running.";
      if (err.response?.status === 503) {
          setError("The recommendation service is busy. Please wait a moment and try again.");
=======
      const response = await axios.post<SuggestionResponse>(`${API_BASE_URL}/api/suggest-courses`, { query });
      setData(response.data);
      setCooldown(10); 
    } catch (err: any) {
      const defaultError = t('error.connection');
      if (err.response?.status === 503) {
          setError(t('error.serviceBusy'));
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
      } else {
          setError(err.response?.data?.detail || err.message || defaultError);
      }
      setCooldown(10);
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
=======
  const handleTranslateCourse = async (idx: number, recommendation: RecommendationItem) => {
    setTranslatingIdx(idx);
    try {
      const tr = await fetch(`${API_BASE_URL}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: recommendation, target_language: i18n.language }),
      });
      if (tr.ok) {
        const translated = await tr.json();
        setData((prev) => {
          if (!prev) return prev;
          const updatedRecommendations = prev.recommendations.map((rec, i) => 
            i === idx ? { ...rec, ...translated } : rec
          );
          return { ...prev, recommendations: updatedRecommendations };
        });
      }
    } catch {
      alert(t('error.translationFailed'));
    }
    setTranslatingIdx(null);
  };

>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
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
<<<<<<< HEAD
                        AI Course Recommender
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Enter a skill you want to learn to discover tailored courses, schemes, and job opportunities.
=======
                        {t('pageTitle')}
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        {t('pageDescription')}
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
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
<<<<<<< HEAD
                                placeholder="E.g., 'Sewing and Tailoring', 'Digital Marketing'..."
=======
                                placeholder={t('form.skillsPlaceholder')}
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
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
<<<<<<< HEAD
                                    Searching...
                                </>
                            ) : cooldown > 0 ? `Wait ${cooldown}s` : "Find Courses"}
=======
                                    {t('form.searching')}
                                </>
                            ) : cooldown > 0 ? t('form.wait', { seconds: cooldown }) : t('form.submitButton')}
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
                        </button>
                    </form>
                </div>
            </motion.div>

            <AnimatePresence>
<<<<<<< HEAD
                {loading && <LoadingSpinner />}
                {error && <ErrorMessage message={error} />}
                {data && <ResultsDisplay data={data} />}
=======
                {loading && <LoadingSpinner t={t} />}
                {error && <ErrorMessage message={error} t={t} />}
                {data && <ResultsDisplay data={data} t={t} handleTranslateCourse={handleTranslateCourse} translatingIdx={translatingIdx} />}
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
            </AnimatePresence>
        </div>
    </div>
  );
}

// --- Sub-components for Display ---
<<<<<<< HEAD
const ResultsDisplay = ({ data }: { data: SuggestionResponse }) => (
=======
const ResultsDisplay = ({ data, t, handleTranslateCourse, translatingIdx }: { 
  data: SuggestionResponse; 
  t: any; 
  handleTranslateCourse: (idx: number, recommendation: RecommendationItem) => Promise<void>;
  translatingIdx: number | null;
}) => (
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
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
<<<<<<< HEAD
          <h2 className="text-3xl font-bold text-white">AI-Powered Suggestions</h2>
          <p className="text-gray-400">Personalized recommendations for your learning journey</p>
=======
          <h2 className="text-3xl font-bold text-white">{t('results.title')}</h2>
          <p className="text-gray-400">{t('results.subtitle')}</p>
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
        </div>
      </div>
      <p className="text-gray-300 mb-8 text-lg leading-relaxed">{data.introduction}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.recommendations.map((rec, i) => (
<<<<<<< HEAD
            <RecommendationCard key={i} item={rec} index={i} />
=======
            <RecommendationCard 
              key={i} 
              item={rec} 
              index={i} 
              t={t} 
              handleTranslateCourse={handleTranslateCourse} 
              translatingIdx={translatingIdx} 
            />
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
        ))}
      </div>
    </div>
  </motion.div>
);

<<<<<<< HEAD
const RecommendationCard = ({ item, index }: { item: RecommendationItem; index: number }) => {
=======
const RecommendationCard = ({ item, index, t, handleTranslateCourse, translatingIdx }: { 
    item: RecommendationItem; 
    index: number;
    t: any;
    handleTranslateCourse: (idx: number, recommendation: RecommendationItem) => Promise<void>;
    translatingIdx: number | null;
}) => {
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
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
<<<<<<< HEAD
                <span className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 border ${typeColor}`}>
                    {icon}
                    {item.type}
                </span>
=======
                <div className="flex flex-col items-end gap-2">
                    <span className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 border ${typeColor}`}>
                        {icon}
                        {item.type}
                    </span>
                    <button
                        className="bg-purple-700 text-xs px-3 py-1 rounded-full text-white hover:bg-purple-600 transition-all transform hover:scale-105 shadow-md flex items-center"
                        onClick={e => {
                            e.stopPropagation();
                            handleTranslateCourse(index, item);
                        }}
                        disabled={translatingIdx === index}
                    >
                        {translatingIdx === index ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {t('actions.translating')}
                            </>
                        ) : (
                            <>
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                </svg>
                                {t('actions.translate')}
                            </>
                        )}
                    </button>
                </div>
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
            </div>
            <p className="text-gray-400 text-sm flex-grow mb-6 leading-relaxed">{item.reason}</p>
            <a 
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto block w-full text-center px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
            >
<<<<<<< HEAD
                Know More
=======
                {t('actions.knowMore')}
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
            </a>
        </motion.div>
    )
};

<<<<<<< HEAD
const LoadingSpinner = () => (
=======
const LoadingSpinner = ({ t }: { t: any }) => (
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
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
<<<<<<< HEAD
      <h3 className="mt-6 text-xl font-bold text-white">Searching for Resources</h3>
      <p className="mt-2 text-gray-400">Our AI is finding the best courses for you...</p>
=======
      <h3 className="mt-6 text-xl font-bold text-white">{t('loading.title')}</h3>
      <p className="mt-2 text-gray-400">{t('loading.description')}</p>
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
    </div>
  </motion.div>
);

<<<<<<< HEAD
const ErrorMessage = ({ message }: { message: string }) => (
=======
const ErrorMessage = ({ message, t }: { message: string; t: any }) => (
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
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
<<<<<<< HEAD
        <h3 className="font-bold text-xl text-red-300">Something went wrong</h3>
=======
        <h3 className="font-bold text-xl text-red-300">{t('error.title')}</h3>
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
      </div>
      <p className="text-red-200">{message}</p>
    </div>
  </motion.div>
);