import React, { useState } from "react";
import ParticleBackground from "../ui/ParticleBackground";

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
  const [occupation, setOccupation] = useState("");
  const [schemes, setSchemes] = useState<string[]>([]);
  const [explanation, setExplanation] = useState<SchemeExplanation[]>([]);
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const [selectedJson, setSelectedJson] = useState<Record<string, any> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        console.log('Received data:', data); // Debug log
        setSchemes(data.relevant_schemes || []);
        // Ensure explanation is an array of valid scheme objects
        const explanations = Array.isArray(data.explanation) ? data.explanation : [];
        console.log('Parsed explanations:', explanations); // Debug log
        setExplanation(explanations);
      } else {
        console.error("Failed to fetch schemes:", response.statusText);
      }
    } catch (error) {
      console.error("Error:", error);
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
              Discover Government Schemes
            </span>
          </h1>
          <p className="mt-6 text-xl text-gray-300 text-center max-w-2xl">
            Enter your occupation to find tailored government schemes that can help you grow and succeed.
          </p>

          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-white p-6 rounded-lg shadow-md text-black"
          >
            <label htmlFor="occupation" className="block text-lg font-medium mb-2">
              Enter Your Occupation:
            </label>
            <input
              type="text"
              id="occupation"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4"
              placeholder="e.g., Farmer, Teacher"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-800"
            >
              Get Recommendations
            </button>
          </form>

          {schemes.length > 0 || (explanation && explanation.length > 0) ? (
            <div className="mt-8 w-full max-w-2xl">
              <h2 className="text-2xl font-bold mb-4 text-white">Recommended Schemes</h2>
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
                        <div className="py-2 space-y-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-purple-400">Goal</span>
                            <span className="text-gray-300">{scheme.goal}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-purple-400">Benefits</span>
                            <span className="text-gray-300">{scheme.benefit}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-purple-400">Eligibility</span>
                            <span className="text-gray-300">{scheme.eligibility}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-purple-400">How to Apply</span>
                            <span className="text-gray-300">{scheme.application_process}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-purple-400">Special Features</span>
                            <span className="text-gray-300">{scheme.special_features}</span>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={(e) => handleViewDetails(e, scheme)}
                              className="px-4 py-2 text-sm font-medium text-purple-400 hover:text-purple-300 bg-gray-800 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-colors"
                            >
                              View Full Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-300">No explanation provided.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-8 text-gray-300">No data received yet. Submit the form to get recommendations.</p>
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
                {selectedJson.scheme_name || "Scheme Details"}
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
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
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
                                    <span className="text-purple-400">{subKey}:</span>
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
                            <span className="text-purple-400 text-sm">{subKey.replace(/_/g, ' ')}:</span>
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