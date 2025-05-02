import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Suggestion {
  idea_name: string;
  business_type: string;
  required_resources: string[];
  initial_steps: string[];
  why_it_suits: string;
}

const BusinessSuggestion: React.FC = () => {
  const [skills, setSkills] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
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
      const tr = await fetch(`${API_BASE_URL}/api/translate`, {
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
      alert("Translation failed.");
    }
    setTranslatingIdx(null);
  };

  const toggleCollapse = (idx: number) => {
    setOpenIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
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
                  openIndexes.includes(idx) ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
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
    </div>
  );
};

export default BusinessSuggestion;