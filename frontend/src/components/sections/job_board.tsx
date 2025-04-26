import React, { useState, useEffect } from "react";
import ParticleBackground from "../ui/ParticleBackground";

interface Job {
  id: number;
  title: string;
  description: string;
  company: string;
  location: string;
  company_contact: string;
  pay: string;
  created_at: string; // Assuming the backend returns a timestamp
}

const JobBoard = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [companyContact, setCompanyContact] = useState("");
  const [pay, setPay] = useState("");
  const [activeTab, setActiveTab] = useState<"view" | "post">("view"); // Tab state
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch job postings
  useEffect(() => {
    const fetchJobs = async () => {
      const response = await fetch(`${API_BASE_URL}/api/jobs`);
      const data: Job[] = await response.json();
      setJobs(data);
    };
    fetchJobs();
  }, []);

  // Handle job posting submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch(`${API_BASE_URL}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, description, company, location, company_contact: companyContact, pay }),
    });

    if (response.ok) {
      setTitle("");
      setDescription("");
      setCompany("");
      setLocation("");
      setCompanyContact("");
      setPay("");
      alert("Job posted successfully!");
      // Refresh job list
      const updatedJobs: Job[] = await fetch(`${API_BASE_URL}/api/jobs`).then((res) => res.json());
      setJobs(updatedJobs);
      setActiveTab("view"); // Switch to the "View Jobs" tab after posting
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
        <h1 className="text-5xl font-bold text-center mb-12">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Job Board
          </span>
        </h1>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <button
            className={`px-6 py-2 text-lg font-medium rounded-t-lg ${
              activeTab === "view" ? "bg-blue-700 text-white" : "bg-gray-300 text-black"
            }`}
            onClick={() => setActiveTab("view")}
          >
            View Jobs
          </button>
          <button
            className={`px-6 py-2 text-lg font-medium rounded-t-lg ${
              activeTab === "post" ? "bg-blue-700 text-white" : "bg-gray-300 text-black"
            }`}
            onClick={() => setActiveTab("post")}
          >
            Post a Job
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white p-6 rounded-lg shadow-md text-black">
          {activeTab === "view" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Available Jobs</h2>
              {jobs.length > 0 ? (
                <ul className="space-y-4">
                  {jobs.map((job) => (
                    <li key={job.id} className="bg-gray-100 p-6 rounded-lg shadow-md">
                      <h3 className="text-xl font-bold">{job.title}</h3>
                      <p className="text-gray-700">{job.description}</p>
                      <p className="text-gray-500 mt-2">
                        <strong>Company:</strong> {job.company} | <strong>Location:</strong> {job.location}
                      </p>
                      <p className="text-gray-500 mt-2">
                        <strong>Contact:</strong> {job.company_contact} | <strong>Pay:</strong> {job.pay}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">No jobs available.</p>
              )}
            </div>
          )}

          {activeTab === "post" && (
            <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-md text-white">
              <h2 className="text-2xl font-bold mb-4">Post a Job</h2>
              <div className="mb-4">
                <label htmlFor="title" className="block text-lg font-medium mb-2">Job Title</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-600 rounded-lg bg-gray-900 text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-lg font-medium mb-2">Job Description</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 border border-gray-600 rounded-lg bg-gray-900 text-white"
                  rows={4}
                  required
                ></textarea>
              </div>
              <div className="mb-4">
                <label htmlFor="company" className="block text-lg font-medium mb-2">Company</label>
                <input
                  type="text"
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full p-3 border border-gray-600 rounded-lg bg-gray-900 text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="location" className="block text-lg font-medium mb-2">Location</label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-3 border border-gray-600 rounded-lg bg-gray-900 text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="company_contact" className="block text-lg font-medium mb-2">Company Contact</label>
                <input
                  type="text"
                  id="company_contact"
                  value={companyContact}
                  onChange={(e) => setCompanyContact(e.target.value)}
                  className="w-full p-3 border border-gray-600 rounded-lg bg-gray-900 text-white"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="pay" className="block text-lg font-medium mb-2">Pay</label>
                <input
                  type="text"
                  id="pay"
                  value={pay}
                  onChange={(e) => setPay(e.target.value)}
                  className="w-full p-3 border border-gray-600 rounded-lg bg-gray-900 text-white"
                  required
                />
              </div>
              <button type="submit" className="w-full bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-800">
                Post Job
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobBoard;
