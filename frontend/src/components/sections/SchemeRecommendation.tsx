import React, { useState } from "react";
import ParticleBackground from "../ui/ParticleBackground";

const SchemeRecommendation = () => {
  const [occupation, setOccupation] = useState("");
  const [schemes, setSchemes] = useState<string[]>([]);
  const [explanation, setExplanation] = useState("");

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
        console.log("API Response:", data); // Debugging line
        setSchemes(data.relevant_schemes);
        setExplanation(data.explanation);
      } else {
        console.error("Failed to fetch schemes:", response.statusText);
      }
    } catch (error) {
      console.error("Error:", error);
    }
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

          {schemes.length > 0 || explanation ? (
            <div className="mt-8 w-full max-w-2xl bg-white p-6 rounded-lg shadow-md text-black">
              <h2 className="text-2xl font-bold mb-4">Response from Backend</h2>
              <div className="text-gray-800">
                <h3 className="font-bold">Schemes:</h3>
                {schemes.length > 0 ? (
                  <ul className="list-disc pl-6 mb-4">
                    {schemes.map((scheme, index) => (
                      <li key={index}>{scheme}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No schemes available.</p>
                )}
              </div>
              <div className="mt-4 text-gray-800">
                <h3 className="font-bold">Explanation:</h3>
                {explanation ? (
                  <p className="whitespace-pre-line">{explanation}</p>
                ) : (
                  <p>No explanation provided.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-8 text-gray-300">No data received yet. Submit the form to get recommendations.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchemeRecommendation;