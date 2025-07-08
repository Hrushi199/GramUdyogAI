import React, { useState } from "react";
import { useTranslation } from 'react-i18next';

export default function AIAssistant({ lang }: { lang: string }) {
  const { t } = useTranslation('ai-assistant');
  const [userInput, setUserInput] = useState("");
  const [assistantOutput, setAssistantOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [transcribed, setTranscribed] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Basic browser STT
  const handleStartListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert(t('alerts.speechNotSupported'));
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = lang;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
      setTranscribed(transcript);
      console.log("Transcribed audio:", transcript);
    };
    recognition.start();
  };

  const handleProcess = async () => {
    setLoading(true);
    setAssistantOutput("");
    const response = await fetch(`${VITE_API_BASE_URL}/api/ai-assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: userInput, lang }),
    });
    const data = await response.json();
    setAssistantOutput(data.output);
    setLoading(false);

    // Browser TTS with animation
    if ("speechSynthesis" in window) {
      const utter = new SpeechSynthesisUtterance(data.output);
      utter.lang = lang;
      utter.onstart = () => setIsSpeaking(true);
      utter.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utter);
    }
  };

  return (
    <div
      className="text-white bg-gray-900 rounded-xl shadow-2xl p-6"
      style={{
        width: 380,
        height: 700,
        maxWidth: "100vw",
        maxHeight: "100vh",
        overflowY: "auto",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}
    >
      <div className="flex flex-col items-center">
        {/* Voice & Text Chat Interface */}
        <div className="w-full text-center mb-4">
          <div className={`inline-block w-16 h-16 rounded-full ${isSpeaking ? 'bg-green-500 animate-pulse' : 'bg-gray-600'} flex items-center justify-center`}>
            <span className="text-2xl">🤖</span>
          </div>
        </div>
      </div>
      <h2 className="text-xl font-bold mb-2 mt-2">{t('title')}</h2>
      <button
        className="bg-blue-700 text-white px-4 py-2 rounded-lg mb-2"
        onClick={handleStartListening}
      >
        {t('buttons.speak')}
      </button>
      {transcribed && (
        <div className="mb-2 text-green-400">
          <strong>{t('labels.transcribed')}</strong> {transcribed}
        </div>
      )}
      <textarea
        className="w-full p-3 rounded-lg bg-gray-800 text-white mb-2"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder={t('placeholders.typeOrSpeak')}
        style={{ minHeight: 60 }}
      />
      <div className="mb-2 text-xs text-gray-400 w-full break-words">
        <strong>{t('labels.requestToLLM')}</strong> {JSON.stringify({ text: userInput, lang })}
      </div>
      <button
        className="bg-purple-700 text-white px-4 py-2 rounded-lg w-full"
        onClick={handleProcess}
        disabled={loading || !userInput}
      >
        {loading ? t('status.processing') : t('buttons.askAssistant')}
      </button>
      {assistantOutput && (
        <div className="mt-4 bg-gray-700 p-4 rounded-lg text-white h-36 overflow-y-auto w-full">
          <strong>{t('labels.assistant')}</strong>
          <div>{assistantOutput}</div>
        </div>
      )}
    </div>
  );
}
