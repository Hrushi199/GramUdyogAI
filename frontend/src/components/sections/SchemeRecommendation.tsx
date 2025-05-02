import React, { useState } from "react";
import ParticleBackground from "../ui/ParticleBackground";
import { useTranslation } from "react-i18next"; // Import useTranslation hook

type SchemeExplanation = {
  name: string;
  goal: string;
  benefit: string;
  eligibility: string;
  application_process: string;
  special_features: string;
  full_json: Record<string, any>;
};

const SchemeRecommendation = () => {
  const { t, i18n } = useTranslation('scheme-recommender'); // Use 'scheme-recommender' namespace
  
  const [occupation, setOccupation] = useState("");
  const [schemes, setSchemes] = useState<string[]>([]);
  const [explanation, setExplanation] = useState<SchemeExplanation[]>([]);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [selectedJson, setSelectedJson] = useState<Record<string, any> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false); // Added loading state
  const [translatingIdx, setTranslatingIdx] = useState<number | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/schemes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ occupation }),
      });

      if (response.ok) {
        const data = await response.json();
        setSchemes(data.relevant_schemes || []);
        // Always use English explanation, do not translate here
        setExplanation(data.explanation || []);
      } else {
        console.error("Failed to fetch schemes:", response.statusText);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCollapse = (idx: number) => {
    setOpenIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleViewDetails = (e: React.MouseEvent, scheme: SchemeExplanation) => {
    e.stopPropagation(); // Prevent card collapse when clicking the button
    setSelectedJson(scheme.full_json);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedJson(null);
    setIsModalOpen(false);
    document.body.style.overflow = 'unset';
  };

  const handleTranslateExplanation = async (idx: number, scheme: SchemeExplanation) => {
    setTranslatingIdx(idx);
    try {
      const tr = await fetch(`${API_BASE_URL}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: scheme, target_language: i18n.language }),
      });
      if (tr.ok) {
        const translated = await tr.json();
        setExplanation((prev) =>
          prev.map((s, i) => (i === idx ? { ...s, ...translated } : s))
        );
      }
    } catch {
      alert("Translation failed.");
    }
    setTranslatingIdx(null);
  };

  return (
    <div className="relative overflow-hidden min-h-screen bg-black text-white">
      {/* Background elements */}
      <ParticleBackground />
      <div className="absolute inset-0 z-0">
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(38,38,38,0.3)_1px,transparent_1px)] bg-[length:24px_24px]"></div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20 z-10"></div>

      {/* Accent lights */}
      <div className="parallax absolute -top-24 -left-24 w-96 h-96 bg-purple-600 rounded-full filter blur-[128px] opacity-20 z-0"></div>
      <div className="parallax absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600 rounded-full filter blur-[128px] opacity-20 z-0"></div>

      {/* Main content */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 py-32">
        <div className="flex flex-col items-center gap-16">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight text-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              {t('pageTitle')}
            </span>
          </h1>
          <p className="mt-6 text-xl text-gray-300 text-center max-w-2xl">
            {t('pageDescription')}
          </p>

          {/* Updated Form with Matching Theme */}
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-lg shadow-xl border border-gray-700 relative overflow-hidden"
          >
            {/* Subtle glowing accent */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500 rounded-full filter blur-3xl opacity-10"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500 rounded-full filter blur-3xl opacity-10"></div>
            
            <label htmlFor="occupation" className="block text-lg font-medium mb-3 text-purple-300">
              {t('form.occupationLabel')}
            </label>
            <div className="relative">
              <input
                type="text"
                id="occupation"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg mb-5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                placeholder={t('form.occupationPlaceholder')}
                style={{backgroundColor: '#1f2937', WebkitAppearance: 'none'}}
                required
              />
              {/* Subtle highlight effect on focus */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg filter blur-md opacity-0 peer-focus:opacity-100 transition-opacity"></div>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-purple-900/20 font-medium"
            >
              {t('form.submitButton')}
            </button>
          </form>

          {/* Loading indicator - added from first code with style adjustments */}
          {loading && 
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-purple-500 animate-spin"></div>
              <p className="text-purple-400">{t('loading')}</p>
            </div>
          }

          {schemes.length > 0 || (explanation && explanation.length > 0) ? (
            <div className="mt-8 w-full max-w-2xl">
              <h2 className="text-2xl font-bold mb-4 text-white">{t('recommendedSchemes')}</h2>
              <div className="grid gap-6">
                {explanation.length > 0 ? (
                  explanation.map((scheme, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-xl overflow-hidden transition-all border border-gray-700"
                    >
                      <button
                        className="w-full flex justify-between items-center px-6 py-4 text-left focus:outline-none group hover:bg-gray-800/50"
                        onClick={() => toggleCollapse(idx)}
                      >
                        <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                          {scheme.name}
                        </span>
                        <svg
                          className={`w-6 h-6 transform transition-transform text-blue-400 group-hover:text-purple-400 ${
                            openIndexes.includes(idx) ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <div
                        className={`px-6 pb-4 transition-all duration-300 ${
                          openIndexes.includes(idx) ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                        }`}
                      >
                        {openIndexes.includes(idx) && (
                          <div className="flex justify-end mb-2">
                            <button
                              className="bg-blue-700/80 text-xs px-3 py-1 rounded text-white hover:bg-blue-800 transition"
                              onClick={e => {
                                e.stopPropagation();
                                handleTranslateExplanation(idx, scheme);
                              }}
                              disabled={translatingIdx === idx}
                            >
                              {translatingIdx === idx ? "Translating..." : "Translate"}
                            </button>
                          </div>
                        )}
                        <div className="py-2 space-y-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-purple-400">{t('scheme.goal')}</span>
                            <span className="text-gray-300">{scheme.goal}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-purple-400">{t('scheme.benefits')}</span>
                            <span className="text-gray-300">{scheme.benefit}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-purple-400">{t('scheme.eligibility')}</span>
                            <span className="text-gray-300">{scheme.eligibility}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-purple-400">{t('scheme.howToApply')}</span>
                            <span className="text-gray-300">{scheme.application_process}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-purple-400">{t('scheme.specialFeatures')}</span>
                            <span className="text-gray-300">{scheme.special_features}</span>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={(e) => handleViewDetails(e, scheme)}
                              className="px-4 py-2 text-sm font-medium text-purple-400 hover:text-purple-300 bg-gray-800 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-colors"
                            >
                              {t('scheme.viewFullDetails')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-300">{t('noExplanation')}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-8 text-gray-300">{t('noData')}</p>
          )}
        </div>
      </div>

      {/* Enhanced JSON Modal */}
      {selectedJson && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div 
            className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg w-full max-w-4xl max-h-[80vh] overflow-auto border border-gray-700 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex justify-between items-center px-6 py-4 bg-gray-900 border-b border-gray-700">
              <h3 className="text-xl font-semibold text-white">
                {selectedJson.scheme_name || t('modal.schemeDetails')}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {Object.entries(selectedJson).map(([key, value]) => (
                <div key={key} className="group">
                  <h4 className="text-lg font-medium text-purple-400 mb-2 flex items-center gap-2">
                    <span className="capitalize">{t(`modal.fields.${key}`, { defaultValue: key.replace(/_/g, ' ') })}</span>
                    <div className="h-px flex-grow bg-gradient-to-r from-purple-500/50 to-transparent"></div>
                  </h4>
                  <div className="pl-4 text-gray-300">
                    {Array.isArray(value) ? (
                      <ul className="list-disc list-inside space-y-1">
                        {value.map((item, i) => (
                          <li key={i} className="text-gray-300">
                            {typeof item === 'object' ? (
                              <div className="ml-4 mt-2">
                                {Object.entries(item).map(([subKey, subValue]) => (
                                  <div key={subKey} className="flex gap-2 text-sm">
                                    <span className="text-purple-400">{t(`modal.fields.${subKey}`, { defaultValue: subKey })}:</span>
                                    <span>{String(subValue)}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              String(item)
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : typeof value === 'object' ? (
                      <div className="space-y-2 bg-black/20 p-4 rounded-lg">
                        {Object.entries(value).map(([subKey, subValue]) => (
                          <div key={subKey} className="flex flex-col gap-1">
                            <span className="text-purple-400 text-sm">{t(`modal.fields.${subKey}`, { defaultValue: subKey.replace(/_/g, ' ') })}:</span>
                            <span className="pl-4">{String(subValue)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span>{String(value)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchemeRecommendation;