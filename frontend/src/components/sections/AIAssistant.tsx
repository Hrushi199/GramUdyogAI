import React, { useState } from "react";

export default function AIAssistant({ lang }: { lang: string }) {
  const [userInput, setUserInput] = useState("");
  const [assistantOutput, setAssistantOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [transcribed, setTranscribed] = useState(""); // For displaying transcribed audio
    const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  // Simple browser speech-to-text (for demo)
  const handleStartListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = lang;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
      setTranscribed(transcript); // Show transcribed text
      console.log("Transcribed audio:", transcript);
    };
    recognition.start();
  };

  const handleProcess = async () => {
    setLoading(true);
    setAssistantOutput("");
    // Print the request being sent to LLM
    console.log("Request to LLM:", { text: userInput, lang });
    const response = await fetch(`${VITE_API_BASE_URL}/api/ai-assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: userInput, lang }),
    });
    const data = await response.json();
    setAssistantOutput(data.output);
    setLoading(false);

    // Speak the output (browser TTS)
    if ("speechSynthesis" in window) {
      const utter = new window.SpeechSynthesisUtterance(data.output);
      utter.lang = lang;
      window.speechSynthesis.speak(utter);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Ask for help</h2>
      <button
        className="bg-blue-700 text-white px-4 py-2 rounded-lg mb-4"
        onClick={handleStartListening}
      >
        🎤 Speak
      </button>
      {transcribed && (
        <div className="mb-2 text-green-400">
          <strong>Transcribed:</strong> {transcribed}
        </div>
      )}
      <textarea
        className="w-full p-3 rounded-lg bg-gray-800 text-white mb-4"
        value={userInput}
        onChange={e => setUserInput(e.target.value)}
        placeholder="Type or speak your request..."
      />
      <div className="mb-2 text-xs text-gray-400">
        <strong>Request to LLM:</strong> {JSON.stringify({ text: userInput, lang })}
      </div>
      <button
        className="bg-purple-700 text-white px-4 py-2 rounded-lg"
        onClick={handleProcess}
        disabled={loading || !userInput}
      >
        {loading ? "Processing..." : "Ask Assistant"}
      </button>
      {assistantOutput && (
        <div className="mt-4 bg-gray-700 p-4 rounded-lg text-white">
          <strong>Assistant:</strong>
          <div>{assistantOutput}</div>
        </div>
      )}
    </div>
  );
}