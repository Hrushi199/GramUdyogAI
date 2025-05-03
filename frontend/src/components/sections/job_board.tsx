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
  const [userInfo, setUserInfo] = useState(""); // For job recommender input
  const [recommendedJob, setRecommendedJob] = useState<Job | null>(null); // For storing the recommended job
  const [activeTab, setActiveTab] = useState<"view" | "post" | "recommend">("view"); // Tab state
  const [loading, setLoading] = useState(false); // Loading state for async operations
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch job postings
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/jobs`);
        const data: Job[] = await response.json();
        setJobs(data);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Handle job posting submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
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
        
        // Success notification
        const notificationElement = document.getElementById("notification");
        if (notificationElement) {
          notificationElement.classList.remove("opacity-0");
          notificationElement.classList.add("opacity-100");
          setTimeout(() => {
            notificationElement.classList.remove("opacity-100");
            notificationElement.classList.add("opacity-0");
          }, 3000);
        }
        
        // Refresh job list
        const updatedJobs: Job[] = await fetch(`${API_BASE_URL}/api/jobs`).then((res) => res.json());
        setJobs(updatedJobs);
        setActiveTab("view"); // Switch to the "View Jobs" tab after posting
      }
    } catch (error) {
      console.error("Error posting job:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle job recommendation
  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/recommend-job`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_info: userInfo }),
      });

      const responseText = await response.text();
      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);
          console.error(`Error: ${errorData.detail}`);
        } catch (err) {
          console.error("Error processing error response:", responseText);
        }
        return;
      }

      try {
        const data = JSON.parse(responseText);
        setRecommendedJob(data.best_job);
      } catch (err) {
        console.error("Error parsing job recommendation JSON:", err, "Raw response:", responseText);
      }
    } catch (error) {
      console.error("Error fetching job recommendation:", error);
    } finally {
      setLoading(false);
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

      {/* Success notification */}
      <div id="notification" className="fixed top-8 right-8 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg shadow-xl opacity-0 transition-opacity duration-300 z-50">
        Job posted successfully!
      </div>

      {/* Main content */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 py-32">
        <div className="flex flex-col items-center gap-16">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight text-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Job Board
            </span>
          </h1>
          <p className="mt-6 text-xl text-gray-300 text-center max-w-2xl">
            Find your dream job or post opportunities for talented professionals in our community.
          </p>

          {/* Enhanced Tabs */}
          <div className="flex justify-center w-full max-w-2xl gap-2 bg-gray-900/50 p-1 rounded-xl">
            <button
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                activeTab === "view" 
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                  : "text-gray-300 hover:text-white hover:bg-gray-800"
              }`}
              onClick={() => setActiveTab("view")}
            >
              View Jobs
            </button>
            <button
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                activeTab === "post" 
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                  : "text-gray-300 hover:text-white hover:bg-gray-800"
              }`}
              onClick={() => setActiveTab("post")}
            >
              Post a Job
            </button>
            <button
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                activeTab === "recommend" 
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                  : "text-gray-300 hover:text-white hover:bg-gray-800"
              }`}
              onClick={() => setActiveTab("recommend")}
            >
              Get Recommended
            </button>
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-purple-500 animate-spin"></div>
              <p className="text-purple-400">Loading...</p>
            </div>
          )}

          {/* Tab Content */}
          <div className="w-full max-w-4xl">
            {/* View Jobs Tab */}
            {activeTab === "view" && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-white">Available Opportunities</h2>
                {jobs.length > 0 ? (
                  <div className="grid gap-6">
                    {jobs.map((job) => (
                      <div 
                        key={job.id} 
                        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-xl overflow-hidden transition-all border border-gray-700 p-6 hover:border-purple-500/30"
                      >
                        <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mb-3">
                          {job.title}
                        </h3>
                        <p className="text-gray-300 mb-4">{job.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-purple-400">Company</span>
                            <span className="text-gray-300">{job.company}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-purple-400">Location</span>
                            <span className="text-gray-300">{job.location}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-purple-400">Contact</span>
                            <span className="text-gray-300">{job.company_contact}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium text-purple-400">Compensation</span>
                            <span className="text-gray-300">{job.pay}</span>
                          </div>
                        </div>
                        
                        <div className="mt-6 flex justify-end">
                          <button 
                            className="px-4 py-2 text-sm font-medium text-purple-400 hover:text-purple-300 bg-gray-800 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-colors"
                          >
                            Apply Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-xl border border-gray-700 p-8 text-center">
                    <p className="text-gray-400 text-lg">No jobs available at the moment.</p>
                    <p className="text-purple-400 mt-2">Be the first to post a job opportunity!</p>
                  </div>
                )}
              </div>
            )}

            {/* Post a Job Tab */}
            {activeTab === "post" && (
              <form 
                onSubmit={handleSubmit} 
                className="w-full bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-lg shadow-xl border border-gray-700 relative overflow-hidden"
              >
                {/* Subtle glowing accent */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500 rounded-full filter blur-3xl opacity-10"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500 rounded-full filter blur-3xl opacity-10"></div>
                
                <h2 className="text-2xl font-bold mb-6 text-white">Post a New Opportunity</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="title" className="text-lg font-medium text-purple-300">Job Title</label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      placeholder="e.g. Senior Developer"
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label htmlFor="company" className="text-lg font-medium text-purple-300">Company</label>
                    <input
                      type="text"
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      placeholder="e.g. Tech Innovations Inc."
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label htmlFor="location" className="text-lg font-medium text-purple-300">Location</label>
                    <input
                      type="text"
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      placeholder="e.g. Remote, New York, NY"
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label htmlFor="pay" className="text-lg font-medium text-purple-300">Compensation</label>
                    <input
                      type="text"
                      id="pay"
                      value={pay}
                      onChange={(e) => setPay(e.target.value)}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      placeholder="e.g. $80,000 - $120,000"
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label htmlFor="company_contact" className="text-lg font-medium text-purple-300">Contact Information</label>
                    <input
                      type="text"
                      id="company_contact"
                      value={companyContact}
                      onChange={(e) => setCompanyContact(e.target.value)}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      placeholder="e.g. careers@techinnovations.com"
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label htmlFor="description" className="text-lg font-medium text-purple-300">Job Description</label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      rows={6}
                      placeholder="Describe the job responsibilities, requirements, and benefits..."
                      required
                    ></textarea>
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-purple-900/20 font-medium"
                  disabled={loading}
                >
                  {loading ? "Posting..." : "Post Job"}
                </button>
              </form>
            )}

            {/* Recommend a Job Tab */}
            {activeTab === "recommend" && (
              <div className="w-full max-w-4xl space-y-8">
                <form 
                  onSubmit={handleRecommend} 
                  className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-lg shadow-xl border border-gray-700 relative overflow-hidden"
                >
                  {/* Subtle glowing accent */}
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500 rounded-full filter blur-3xl opacity-10"></div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500 rounded-full filter blur-3xl opacity-10"></div>
                  
                  <h2 className="text-2xl font-bold mb-6 text-white">Find Your Perfect Match</h2>
                  <p className="text-gray-300 mb-6">Tell us about your skills, experience, and preferences, and we'll recommend the best job for you.</p>
                  
                  <div className="flex flex-col gap-2">
                    <label htmlFor="user_info" className="text-lg font-medium text-purple-300">Your Profile Information</label>
                    <textarea
                      id="user_info"
                      value={userInfo}
                      onChange={(e) => setUserInfo(e.target.value)}
                      className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      rows={6}
                      placeholder="Example: I have 5 years of experience in web development using React and Node.js. I'm looking for remote opportunities in a tech startup with a focus on sustainable products..."
                      required
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-purple-900/20 font-medium"
                    disabled={loading}
                  >
                    {loading ? "Analyzing..." : "Find My Match"}
                  </button>
                </form>

                {/* Recommendation Results */}
                {recommendedJob && (
                  <div className="mt-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-xl border border-purple-500/30 p-8 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500 rounded-full filter blur-3xl opacity-10"></div>
                    
                    <h3 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                      Your Perfect Match
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xl font-semibold text-white mb-2">{recommendedJob.title}</h4>
                        <p className="text-gray-300">{recommendedJob.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-purple-400">Company</span>
                          <span className="text-gray-300">{recommendedJob.company}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-purple-400">Location</span>
                          <span className="text-gray-300">{recommendedJob.location}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-purple-400">Contact</span>
                          <span className="text-gray-300">{recommendedJob.company_contact}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-purple-400">Compensation</span>
                          <span className="text-gray-300">{recommendedJob.pay}</span>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end">
                        <button 
                          className="px-6 py-3 text-white font-medium bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobBoard;