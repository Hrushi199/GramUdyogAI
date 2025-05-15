import React, { useState } from "react";
import AIAssistant from "../sections/AIAssistant";

const languages = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "ta", label: "தமிழ்" },
  { code: "bn", label: "বাংলা" },
  { code: "gu", label: "ગુજરાતી" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ml", label: "മലയാളം" },
  { code: "mr", label: "मराठी" },
  { code: "or", label: "ଓଡ଼ିଆ" },
  { code: "pa", label: "ਪੰਜਾਬੀ" },
  { code: "te", label: "తెలుగు" },
  { code: "ur", label: "اردو" },
];

export default function VirtualAssistantModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"language" | "assistant">("language");
  const [selectedLang, setSelectedLang] = useState("en");

  const handleLanguageSelect = (lang: string) => {
    setSelectedLang(lang);
    setStep("assistant");
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-xl shadow-2xl p-8 max-w-lg w-full relative">
        <button className="absolute top-4 right-4 text-white" onClick={onClose}>✕</button>
        {step === "language" && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Select your preferred language</h2>
            <div className="grid grid-cols-2 gap-3">
              {languages.map(lang => (
                <button
                  key={lang.code}
                  className={`py-2 px-4 rounded-lg ${selectedLang === lang.code ? "bg-purple-700 text-white" : "bg-gray-800 text-gray-200"}`}
                  onClick={() => handleLanguageSelect(lang.code)}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {step === "assistant" && (
          <AIAssistant lang={selectedLang} />
        )}
      </div>
    </div>
  );
}