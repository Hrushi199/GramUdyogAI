import React, { useState } from 'react';

const BusinessSuggestion: React.FC = () => {
  const [skills, setSkills] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuggestions('');

    try {
      const response = await fetch('http://127.0.0.1:8000/suggest-business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skills }),
      });

      const data = await response.json();
      console.log(data);
      if (response.ok) {
        setSuggestions(data.suggestions);
      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">AI Business Suggestion</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          placeholder="Enter your skills here..."
          className="w-full p-4 rounded-md bg-gray-800 border border-gray-600 text-white"
          rows={4}
          required
        />

        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-md transition"
        >
          Get Suggestions
        </button>
      </form>

      {loading && <p className="text-purple-400 mt-4">Loading suggestions...</p>}
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {suggestions && (
        <div className="mt-6 p-4 rounded-md bg-gray-900 border border-gray-700">
          <h3 className="text-xl font-semibold mb-2">Business Ideas:</h3>
          <p className="text-gray-300 whitespace-pre-line">{suggestions}</p>
        </div>
      )}
    </div>
  );
};

export default BusinessSuggestion;
