import React, { useState, useEffect } from "react";

interface Job {
  id: number;
  title: string;
  description: string;
  company: string;
  location: string;
  created_at: string; // Assuming the backend returns a timestamp
}

const JobBoard = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");

  // Fetch job postings
  useEffect(() => {
    const fetchJobs = async () => {
      const response = await fetch("http://localhost:8000/api/jobs");
      const data: Job[] = await response.json();
      setJobs(data);
    };
    fetchJobs();
  }, []);

  // Handle job posting submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = await fetch("http://localhost:8000/api/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, description, company, location }),
    });

    if (response.ok) {
      setTitle("");
      setDescription("");
      setCompany("");
      setLocation("");
      alert("Job posted successfully!");
      // Refresh job list
      const updatedJobs: Job[] = await fetch("http://localhost:8000/api/jobs").then((res) => res.json());
      setJobs(updatedJobs);
    }
  };

  return (
    <div className="relative overflow-hidden min-h-screen bg-black text-white py-16 px-6">
      <h1 className="text-4xl font-bold mb-8 text-center">Job Board</h1>

      {/* Job Posting Form */}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md text-black mb-12">
        <h2 className="text-2xl font-bold mb-4">Post a Job</h2>
        <div className="mb-4">
          <label htmlFor="title" className="block text-lg font-medium mb-2">Job Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="description" className="block text-lg font-medium mb-2">Job Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
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
            className="w-full p-3 border border-gray-300 rounded-lg"
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
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-800">
          Post Job
        </button>
      </form>

      {/* Job Listings */}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Available Jobs</h2>
        {jobs.length > 0 ? (
          <ul className="space-y-4">
            {jobs.map((job) => (
              <li key={job.id} className="bg-white p-6 rounded-lg shadow-md text-black">
                <h3 className="text-xl font-bold">{job.title}</h3>
                <p className="text-gray-700">{job.description}</p>
                <p className="text-gray-500 mt-2">
                  <strong>Company:</strong> {job.company} | <strong>Location:</strong> {job.location}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No jobs available.</p>
        )}
      </div>
    </div>
  );
};

export default JobBoard;
