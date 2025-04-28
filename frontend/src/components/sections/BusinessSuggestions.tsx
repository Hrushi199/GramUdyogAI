// import React, { useState } from 'react';

// const BusinessSuggestion: React.FC = () => {
//   const [skills, setSkills] = useState('');
//   const [suggestions, setSuggestions] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     setSuggestions('');

//     try {
//       const response = await fetch(`${API_BASE_URL}/suggest-business`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ skills }),
//       });

//       const data = await response.json();
//       console.log(data);
//       if (response.ok) {
//         setSuggestions(data.suggestions);
//       } else {
//         setError(data.error || 'Something went wrong');
//       }
//     } catch (err) {
//       setError('Error connecting to server.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="p-6 max-w-3xl mx-auto">
//       <h2 className="text-2xl font-bold mb-4">AI Business Suggestion</h2>
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <textarea
//           value={skills}
//           onChange={(e) => setSkills(e.target.value)}
//           placeholder="Enter your skills here..."
//           className="w-full p-4 rounded-md bg-gray-800 border border-gray-600 text-white"
//           rows={4}
//           required
//         />

//         <button
//           type="submit"
//           className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-md transition"
//         >
//           Get Suggestions
//         </button>
//       </form>

//       {loading && <p className="text-purple-400 mt-4">Loading suggestions...</p>}
//       {error && <p className="text-red-500 mt-4">{error}</p>}
//       {suggestions && (
//         <div className="mt-6 p-4 rounded-md bg-gray-900 border border-gray-700">
//           <h3 className="text-xl font-semibold mb-2">Business Ideas:</h3>
//           <p className="text-gray-300 whitespace-pre-line">{suggestions}</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default BusinessSuggestion;

import React, { useState } from 'react';

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
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuggestions([]);

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
        setSuggestions(data.suggestions || []);
        console.log(data);
        console.log(data.suggestions.length);

      } else {
        setError(data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCollapse = (idx: number) => {
    setOpenIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
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
      {suggestions.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-xl font-semibold mb-2 text-gray-100">Business Ideas:</h3>
          {suggestions.map((suggestion, idx) => (
            <div key={idx} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-xl overflow-hidden transition-all border border-gray-700">
              <button
                className="w-full flex justify-between items-center px-6 py-4 text-left focus:outline-none group hover:bg-gray-800/50"
                onClick={() => toggleCollapse(idx)}
              >
                <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                  {suggestion.idea_name}
                </span>
                <svg
                  className={`w-6 h-6 transform transition-transform text-blue-400 group-hover:text-purple-400 ${
                    openIndexes.includes(idx) ? 'rotate-180' : ''
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
                  openIndexes.includes(idx) ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                }`}
              >
                <div className="py-2 space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-purple-400">Business Type</span>
                    <span className="text-gray-300">{suggestion.business_type}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-purple-400">Required Resources</span>
                    <ul className="list-disc list-inside">
                      {suggestion.required_resources.map((resource, idx) => (
                        <li key={idx}>{resource}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-purple-400">Initial Steps</span>
                    <ol className="list-decimal list-inside">
                      {suggestion.initial_steps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-purple-400">Why it suits</span>
                    <span className="text-gray-300">{suggestion.why_it_suits}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BusinessSuggestion;
