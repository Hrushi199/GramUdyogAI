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
    <div className="max-w-2xl mx-auto py-10 px-4 text-white">
      <h1 className="text-3xl font-bold mb-6">YouTube Audio Summary</h1>
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <input
          type="text"
          className="w-full p-3 rounded bg-gray-800 border border-gray-600 text-white"
          placeholder="Paste YouTube video link"
          value={youtubeUrl}
          onChange={e => setYoutubeUrl(e.target.value)}
          required
        />
        <select
          className="w-full p-3 rounded bg-gray-800 border border-gray-600 text-white"
          value={language}
          onChange={e => setLanguage(e.target.value)}
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="ta">Tamil</option>
        </select>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 py-3 rounded font-semibold"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Audio Summary"}
        </button>
      </form>
      {error && <div className="text-red-400 mb-4">{error}</div>}
      {summary && (
        <div>
          <div className="mb-6">
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
          <h2 className="text-xl font-bold mb-2">Audio Insights</h2>
          <ul className="space-y-4">
            {summary.insights.map((insight: any, idx: number) => (
              <li key={idx} className="bg-gray-800 rounded p-4">
                <div className="mb-2 font-semibold">
                  <span className="text-blue-300">[{insight.timestamp}]</span> {insight.text}
                </div>
                {insight.audio && (
                  <audio controls src={`${API_BASE_URL}/api/audio/${language}/${insight.audio}`} className="w-full" />
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
