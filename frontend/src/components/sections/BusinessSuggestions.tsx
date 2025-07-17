import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ParticleBackground from '../ui/ParticleBackground';
import { Toaster, toast } from 'react-hot-toast';


interface DetailedStep {
  step_number: number;
  title: string;
  description: string;
  estimated_time: string;
  estimated_cost: string;
  youtube_links: string[];
  shopping_links: string[];
  required_documents: string[];
  document_process: string[];
  tips: string[];
}

interface Suggestion {
  idea_name: string;
  business_type: string;
  required_resources: string[];
  initial_steps: string[];
  why_it_suits: string;
  detailed_guide: DetailedStep[];
  total_estimated_cost: string;
  total_time_to_start: string;
  difficulty_level: string;
  profit_potential: string;
}

const BusinessSuggestion: React.FC = () => {
  const [skills, setSkills] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [openStepIndexes, setOpenStepIndexes] = useState<{[key: string]: number[]}>({});
  const [translatingIdx, setTranslatingIdx] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { t, i18n } = useTranslation('business-suggestions');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuggestions([]);
    setHasSubmitted(true);

    try {
      const response = await fetch(`${API_BASE_URL}/suggest-business`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skills }),
      });

      const data = await response.json();
      if (response.ok) {
        let suggestions = data.suggestions || [];
        // Always use English suggestions, do not translate here
        setSuggestions([...suggestions]);
      } else {
        setError(data.error || t('error.generic'));
      }
    } catch (err) {
      setError(t('error.connection'));
    } finally {
      setLoading(false);
    }
  };



  const handleTranslateSuggestion = async (idx: number, suggestion: Suggestion) => {
    setTranslatingIdx(idx);
    try {
      const tr = await fetch(`${API_BASE_URL}/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: suggestion, target_language: i18n.language }),
      });
      if (tr.ok) {
        const translated = await tr.json();
        setSuggestions((prev) =>
          prev.map((s, i) => (i === idx ? { ...s, ...translated } : s))
        );
      }
    } catch {
      toast.error('Translation failed.', { style: { background: 'rgba(30, 0, 60, 0.8)', color: '#fff', border: '1px solid #a259ec', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' } });
    }
    setTranslatingIdx(null);
  };

  const toggleCollapse = (idx: number) => {
    setOpenIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const toggleStepCollapse = (suggestionIdx: number, stepIdx: number) => {
    const key = `${suggestionIdx}`;
    setOpenStepIndexes((prev) => {
      const current = prev[key] || [];
      const updated = current.includes(stepIdx) 
        ? current.filter(i => i !== stepIdx)
        : [...current, stepIdx];
      return { ...prev, [key]: updated };
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-gray-900 rounded-xl shadow-2xl">
      <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-purple-500">{t('pageTitle')}</h2>
      <p className="text-purple-100 mb-8">{t('pageDescription')}</p>
      
      <form onSubmit={handleSubmit} className="space-y-6 mb-8">
        <div className="space-y-2">
          <label className="block text-purple-200 font-medium text-lg mb-2">{t('form.skillsLabel')}</label>
          <textarea
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder={t('form.skillsPlaceholder')}
            className="w-full p-4 rounded-lg bg-gray-800 border border-purple-700 text-white focus:border-purple-400 focus:ring focus:ring-purple-500/30 transition-all shadow-md"
            rows={4}
            required
          />
        </div>
        
        <button
          type="submit"
          className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white py-3 px-8 rounded-lg transition-all transform hover:scale-105 font-medium shadow-lg flex items-center justify-center"
        >
          <span>{t('form.submitButton')}</span>
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </form>

      {loading && (
        <div className="flex items-center justify-center space-x-3 text-purple-400 mt-6 bg-gray-800/50 p-4 rounded-lg">
          <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>{t('loading')}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/20 border border-red-700 text-red-200 p-4 rounded-lg mt-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>{error}</p>
        </div>
      )}
      
      {suggestions.length > 0 && (
        <div className="mt-8 space-y-6">
          <h3 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-purple-500">
            {t('businessIdeas')}
          </h3>
          {suggestions.map((suggestion, idx) => (
            <div key={idx} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl overflow-hidden transition-all border border-purple-800/40 hover:border-purple-700/60">
              <button
                className="w-full flex justify-between items-center px-6 py-5 text-left focus:outline-none group"
                onClick={() => toggleCollapse(idx)}
              >
                <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-purple-500">
                  {suggestion.idea_name}
                </span>
                <div className="bg-purple-900/30 p-2 rounded-full transition-all group-hover:bg-purple-800/50">
                  <svg
                    className={`w-5 h-5 transform transition-transform text-purple-400 ${
                      openIndexes.includes(idx) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              <div
                className={`transition-all duration-300 ${
                  openIndexes.includes(idx) ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                }`}
              >
                {openIndexes.includes(idx) && (
                  <div className="px-6 pt-2 pb-1 bg-gradient-to-b from-purple-900/10 to-transparent">
                    <div className="flex justify-end">
                      <button
                        className="bg-purple-700 text-xs px-4 py-1.5 rounded-full text-white hover:bg-purple-600 transition-all transform hover:scale-105 shadow-md flex items-center"
                        onClick={e => {
                          e.stopPropagation();
                          handleTranslateSuggestion(idx, suggestion);
                        }}
                        disabled={translatingIdx === idx}
                      >
                        {translatingIdx === idx ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('actions.translating')}
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                            </svg>
                            {t('actions.translate')}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
                <div className="px-6 py-5 space-y-6">
                  <div className="p-4 bg-gray-800/50 rounded-lg border border-purple-900/20">
                    <span className="font-medium text-purple-300 text-lg block mb-2">{t('businessDetails.businessType')}</span>
                    <span className="text-purple-100">{suggestion.business_type}</span>
                  </div>
                  
                  <div className="p-4 bg-gray-800/50 rounded-lg border border-purple-900/20">
                    <span className="font-medium text-purple-300 text-lg block mb-2">{t('businessDetails.requiredResources')}</span>
                    <ul className="space-y-2">
                      {suggestion.required_resources.map((resource, idx) => (
                        <li key={idx} className="flex items-start text-purple-100">
                          <svg className="w-5 h-5 text-purple-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {resource}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-gray-800/50 rounded-lg border border-purple-900/20">
                    <span className="font-medium text-purple-300 text-lg block mb-2">{t('businessDetails.initialSteps')}</span>
                    <ol className="space-y-2">
                      {suggestion.initial_steps.map((step, stepIdx) => (
                        <li key={stepIdx} className="flex items-start text-purple-100">
                          <span className="flex-shrink-0 flex items-center justify-center bg-purple-800/50 text-purple-300 w-6 h-6 rounded-full mr-3 text-sm font-medium">
                            {stepIdx + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                  
                  <div className="p-4 bg-gray-800/50 rounded-lg border border-purple-900/20">
                    <span className="font-medium text-purple-300 text-lg block mb-2">{t('businessDetails.whyItSuits')}</span>
                    <span className="text-purple-100">{suggestion.why_it_suits}</span>
                  </div>

                  {/* Detailed Guide Section */}
                  {suggestion.detailed_guide && suggestion.detailed_guide.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-2xl font-bold mb-6 text-purple-300 flex items-center">
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {t('detailedGuide.title')}
                      </h4>

                      {/* Total Cost and Time Overview */}
                      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {suggestion.total_estimated_cost && (
                          <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              <span className="font-semibold text-green-300 text-sm">{t('detailedGuide.totalCost')}</span>
                            </div>
                            <span className="text-green-200 text-lg font-bold">{suggestion.total_estimated_cost}</span>
                          </div>
                        )}
                        {suggestion.total_time_to_start && (
                          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-semibold text-blue-300 text-sm">{t('detailedGuide.totalTime')}</span>
                            </div>
                            <span className="text-blue-200 text-lg font-bold">{suggestion.total_time_to_start}</span>
                          </div>
                        )}
                        {suggestion.difficulty_level && (
                          <div className="bg-orange-900/20 border border-orange-700/30 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 text-orange-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span className="font-semibold text-orange-300 text-sm">{t('detailedGuide.difficulty')}</span>
                            </div>
                            <span className="text-orange-200 text-lg font-bold">{suggestion.difficulty_level}</span>
                          </div>
                        )}
                        {suggestion.profit_potential && (
                          <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4">
                            <div className="flex items-center mb-2">
                              <svg className="w-5 h-5 text-purple-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="font-semibold text-purple-300 text-sm">{t('detailedGuide.profitPotential')}</span>
                            </div>
                            <span className="text-purple-200 text-lg font-bold">{suggestion.profit_potential}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        {suggestion.detailed_guide.map((step, stepIdx) => {
                          const stepKey = `${idx}`;
                          const isStepOpen = (openStepIndexes[stepKey] || []).includes(stepIdx);
                          
                          return (
                            <div key={stepIdx} className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-700/30 overflow-hidden">
                              <button
                                className="w-full flex justify-between items-center px-6 py-4 text-left focus:outline-none group hover:bg-purple-800/10 transition-all"
                                onClick={() => toggleStepCollapse(idx, stepIdx)}
                              >
                                <div className="flex items-center space-x-4">
                                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                    {step.step_number}
                                  </div>
                                  <div>
                                    <h5 className="text-lg font-semibold text-purple-200 group-hover:text-purple-100 transition-colors">
                                      {step.title}
                                    </h5>
                                    <p className="text-purple-300/70 text-sm mt-1">{step.description}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-4">
                                  <div className="text-right">
                                    <div className="text-sm text-green-400 font-semibold">{step.estimated_cost}</div>
                                    <div className="text-xs text-blue-400">{step.estimated_time}</div>
                                  </div>
                                  <svg
                                    className={`w-5 h-5 transform transition-transform text-purple-400 ${
                                      isStepOpen ? 'rotate-180' : ''
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </button>
                              
                              {/* Expanded Step Details */}
                              <div className={`transition-all duration-300 ${isStepOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                {isStepOpen && (
                                  <div className="px-6 pb-6 space-y-6 bg-gradient-to-b from-purple-900/5 to-transparent">
                                    
                                    {/* YouTube Videos */}
                                    {step.youtube_links && step.youtube_links.length > 0 && (
                                      <div className="bg-red-900/20 rounded-lg p-4 border border-red-700/30">
                                        <h6 className="font-semibold text-red-300 mb-3 flex items-center">
                                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                                          </svg>
                                          {t('detailedGuide.youtubeVideos')}
                                        </h6>
                                        <div className="grid gap-3">
                                          {step.youtube_links.map((video, linkIdx) => {
                                            const searchQuery = encodeURIComponent(video);
                                            const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;
                                            return (
                                              <div key={linkIdx} className="bg-red-800/30 rounded-lg p-3 border border-red-700/40">
                                                <div className="flex items-start justify-between">
                                                  <div className="flex-1 mr-3">
                                                    <div className="text-red-200 font-medium text-sm block mb-1">{video}</div>
                                                    <p className="text-red-300/70 text-xs">Search on YouTube</p>
                                                  </div>
                                                  <a
                                                    href={youtubeSearchUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 shadow-md"
                                                  >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                      <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                                                    </svg>
                                                    <span>Watch</span>
                                                  </a>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Shopping Links */}
                                    {step.shopping_links && step.shopping_links.length > 0 && (
                                      <div className="bg-green-900/20 rounded-lg p-4 border border-green-700/30">
                                        <h6 className="font-semibold text-green-300 mb-3 flex items-center">
                                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v5a2 2 0 01-2 2H9a2 2 0 01-2-2v-5m6-5V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2" />
                                          </svg>
                                          {t('detailedGuide.shoppingLinks')}
                                        </h6>
                                        <div className="grid gap-3">
                                          {step.shopping_links.map((link, linkIdx) => {
                                            const isUrl = link.startsWith('http');
                                            return (
                                              <div key={linkIdx} className="bg-green-800/30 rounded-lg p-3 border border-green-700/40">
                                                <div className="flex items-center justify-between">
                                                  <span className="text-green-200 text-sm font-medium flex-1 mr-3">
                                                    {isUrl ? new URL(link).hostname.replace('www.', '') : link}
                                                  </span>
                                                  {isUrl ? (
                                                    <a
                                                      href={link}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 shadow-md"
                                                    >
                                                      <span>Visit Store</span>
                                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                      </svg>
                                                    </a>
                                                  ) : (
                                                    <span className="bg-green-700/50 text-green-300 px-3 py-2 rounded-lg text-sm">
                                                      Local Store
                                                    </span>
                                                  )}
                                                </div>
                                                {isUrl && (
                                                  <p className="text-green-300/70 text-xs mt-2">{link}</p>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Required Documents */}
                                    {step.required_documents && step.required_documents.length > 0 && (
                                      <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-700/30">
                                        <h6 className="font-semibold text-blue-300 mb-3 flex items-center">
                                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                          {t('detailedGuide.requiredDocuments')}
                                        </h6>
                                        <ul className="space-y-2">
                                          {step.required_documents.map((doc, docIdx) => (
                                            <li key={docIdx} className="flex items-start text-blue-200">
                                              <svg className="w-4 h-4 mr-2 mt-0.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                                              </svg>
                                              {doc}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Document Process */}
                                    {step.document_process && step.document_process.length > 0 && (
                                      <div className="bg-indigo-900/20 rounded-lg p-4 border border-indigo-700/30">
                                        <h6 className="font-semibold text-indigo-300 mb-3 flex items-center">
                                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                          </svg>
                                          {t('detailedGuide.documentProcess')}
                                        </h6>
                                        <ol className="space-y-2">
                                          {step.document_process.map((process, processIdx) => (
                                            <li key={processIdx} className="flex items-start text-indigo-200">
                                              <span className="flex-shrink-0 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">
                                                {processIdx + 1}
                                              </span>
                                              {process}
                                            </li>
                                          ))}
                                        </ol>
                                      </div>
                                    )}
                                    
                                    {/* Pro Tips */}
                                    {step.tips && step.tips.length > 0 && (
                                      <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-700/30">
                                        <h6 className="font-semibold text-yellow-300 mb-3 flex items-center">
                                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                          </svg>
                                          {t('detailedGuide.tips')}
                                        </h6>
                                        <ul className="space-y-2">
                                          {step.tips.map((tip, tipIdx) => (
                                            <li key={tipIdx} className="flex items-start text-yellow-200">
                                              <svg className="w-4 h-4 mr-2 mt-0.5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                              </svg>
                                              {tip}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && !error && suggestions.length === 0 && hasSubmitted && (
        <div className="bg-purple-900/20 border border-purple-800/40 p-6 rounded-lg mt-6 text-center">
          <svg className="w-12 h-12 mx-auto text-purple-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-purple-200 text-lg">{t('noSuggestions')}</p>
          <p className="text-purple-300/70 mt-2">Try adding more details about your skills and interests.</p>
        </div>
      )}
      <Toaster />
    </div>
  );
};

export default BusinessSuggestion;