import React, { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function YoutubeAudioSummary() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/youtube-summary/youtube-audio-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_url: youtubeUrl, language }),
      });
      if (!res.ok) {
        setError("Failed to generate summary.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      setError("Error generating summary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6 text-white">
      <h1 className="text-4xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
        YouTube Audio Summary
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6 mb-10">
        <input
          type="text"
          className="w-full p-4 rounded-lg bg-gray-800/80 border border-gray-600/50 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
          placeholder="Paste YouTube video link"
          value={youtubeUrl}
          onChange={e => setYoutubeUrl(e.target.value)}
          required
        />
        <select
          className="w-full p-4 rounded-lg bg-gray-800/80 border border-gray-600/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
          value={language}
          onChange={e => setLanguage(e.target.value)}
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="ta">Tamil</option>
        </select>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Audio Summary"}
        </button>
      </form>
      {error && (
        <div className="text-red-400 bg-red-900/20 border border-red-700/50 rounded-lg p-4 mb-6 text-center">
          {error}
        </div>
      )}
      {summary && (
        <div className="space-y-8">
          <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-700/50">
            <iframe
              width="100%"
              height="315"
              src={`https://www.youtube.com/embed/${extractVideoId(summary.youtube_url)}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight mb-4 text-purple-100">
            Audio Insights
          </h2>
          <ul className="space-y-6">
            {summary.insights.map((insight: any, idx: number) => (
              <li
                key={idx}
                className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl p-6 shadow-md border border-gray-700/50 transition-all duration-300 hover:shadow-xl"
              >
                <div className="mb-3 font-semibold text-lg">
                  <span className="text-blue-300">[{insight.timestamp}]</span> {insight.text}
                </div>
                {insight.audio && (
                  <audio
                    controls
                    src={`${API_BASE_URL}/api/audio/${language}/${insight.audio}`}
                    className="w-full rounded-lg"
                  />
                )}
                {insight.audio === null && (
                  <div className="text-red-400 text-sm">Audio unavailable</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Helper to extract video ID from URL
function extractVideoId(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : "";
}