import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import ParticleBackground from "../ui/ParticleBackground";
import { jobAPI, Job } from "../../lib/api"; // Import Job interface from api.ts

// Remove duplicate Job interface since it's imported from api.ts

const JobBoard = () => {
  const { t } = useTranslation('job-board');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [jobsPerPage, setJobsPerPage] = useState(10); // Make this changeable
  const [searchKeyword, setSearchKeyword] = useState(""); // Add search functionality
  const [appliedFilters, setAppliedFilters] = useState({ search: "", location: "", industry: "" }); // Track applied filters
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

  // Highlight search terms in text
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-500/20 text-yellow-300 px-1 rounded">
          {part}
        </span>
      ) : part
    );
  };

  // Fetch job postings with pagination and search
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const offset = (currentPage - 1) * jobsPerPage;
        console.log(`Fetching jobs: limit=${jobsPerPage}, offset=${offset}, page=${currentPage}, search=${appliedFilters.search}`);
        
        const response = await jobAPI.getJobs({
          limit: jobsPerPage,
          offset: offset,
          is_active: true,
          diverse: true,
          search: appliedFilters.search || undefined,
          location: appliedFilters.location || undefined,
          industry: appliedFilters.industry || undefined
        });
        
        console.log("API Response:", response);
        
        if (response.data) {
          // The API returns { jobs: Job[], total_count: number }
          const jobsData = response.data.jobs || response.data;
          const totalCount = response.data.total_count || 0;
          
          console.log(`Fetched ${jobsData.length} jobs, total: ${totalCount}`);
          
          setJobs(Array.isArray(jobsData) ? jobsData : []);
          setTotalJobs(totalCount);
        } else if (response.error) {
          console.error("Error fetching jobs:", response.error);
          setJobs([]);
          setTotalJobs(0);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [currentPage, jobsPerPage, appliedFilters]);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters(prev => ({ ...prev, search: searchKeyword }));
    setCurrentPage(1); // Reset to first page when searching
  };

  // Debounced search effect for real-time search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchKeyword !== appliedFilters.search) {
        setAppliedFilters(prev => ({ ...prev, search: searchKeyword }));
        setCurrentPage(1);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchKeyword, appliedFilters.search]);

  // Clear all filters
  const clearFilters = () => {
    setSearchKeyword("");
    setAppliedFilters({ search: "", location: "", industry: "" });
    setCurrentPage(1);
  };

  // Handle job posting submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await jobAPI.createJob({
        title,
        description,
        company,
        location,
        company_contact: companyContact,
        pay
      });

      if (response.data) {
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
        const updatedJobsResponse = await jobAPI.getJobs({
          limit: jobsPerPage,
          offset: 0,
          is_active: true,
          diverse: true
        });
        if (updatedJobsResponse.data) {
          const jobsData = updatedJobsResponse.data.jobs || updatedJobsResponse.data;
          const totalCount = updatedJobsResponse.data.total_count || 0;
          setJobs(Array.isArray(jobsData) ? jobsData : []);
          setTotalJobs(totalCount);
          setCurrentPage(1); // Reset to first page
        }
        setActiveTab("view"); // Switch to the View Jobs tab after posting
      } else if (response.error) {
        console.error("Error posting job:", response.error);
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
      const response = await fetch(`${API_BASE_URL}/api/recommend-job-smart`, {
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
        console.log("Full API Response:", data);
        console.log("Recommended Job Object:", data.best_job);
        console.log("Job Properties:", Object.keys(data.best_job || {}));
        console.log("Company Contact Field:", data.best_job?.company_contact);
        console.log("All Contact Related Fields:", Object.keys(data.best_job || {}).filter(key => key.toLowerCase().includes('contact')));
        
        // Check if this job has contact info
        if (data.best_job?.company_contact) {
          console.log("✅ Job HAS contact info:", data.best_job.company_contact);
        } else {
          console.log("❌ Job does NOT have contact info");
          console.log("Job Source:", data.best_job?.source);
          console.log("Job ID:", data.best_job?.id);
        }
        
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
              {t('pageTitle')}
            </span>
          </h1>
          <p className="mt-6 text-xl text-gray-300 text-center max-w-2xl">
            {t('pageSubtitle')}
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
              {t('tabs.viewJobs')}
            </button>
            <button
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                activeTab === "post" 
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                  : "text-gray-300 hover:text-white hover:bg-gray-800"
              }`}
              onClick={() => setActiveTab("post")}
            >
              {t('tabs.postJob')}
            </button>
            <button
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                activeTab === "recommend" 
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg" 
                  : "text-gray-300 hover:text-white hover:bg-gray-800"
              }`}
              onClick={() => setActiveTab("recommend")}
            >
              {t('tabs.getRecommended')}
            </button>
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-purple-500 animate-spin"></div>
              <p className="text-purple-400">{t('loading')}</p>
            </div>
          )}

          {/* Tab Content */}
          <div className="w-full max-w-4xl">
            {/* View Jobs Tab */}
            {activeTab === "view" && (
              <div className="space-y-8">
                {/* Search and Filter Section */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-xl border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Search & Filter Jobs</h3>
                  
                  <form onSubmit={handleSearch} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-purple-300">Search Keywords</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            placeholder="Job title, company, skills... (real-time search)"
                            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all pr-10"
                          />
                          {searchKeyword && (
                            <button
                              type="button"
                              onClick={() => setSearchKeyword("")}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-purple-300">Location</label>
                        <input
                          type="text"
                          value={appliedFilters.location}
                          onChange={(e) => setAppliedFilters(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="City, state..."
                          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                        />
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-purple-300">Industry</label>
                        <input
                          type="text"
                          value={appliedFilters.industry}
                          onChange={(e) => setAppliedFilters(prev => ({ ...prev, industry: e.target.value }))}
                          placeholder="Technology, Healthcare..."
                          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {loading ? "Searching..." : "Search Jobs"}
                      </button>
                      
                      <button
                        type="button"
                        onClick={clearFilters}
                        disabled={loading}
                        className="px-6 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Clear Filters
                      </button>
                    </div>
                    
                    {/* Quick Search Suggestions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="text-sm text-gray-400">Quick search:</span>
                      {['Software Engineer', 'Data Analyst', 'Sales', 'Teacher', 'Healthcare', 'Remote Work', 'Fresher Jobs'].map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => {
                            setSearchKeyword(suggestion);
                            setAppliedFilters(prev => ({ ...prev, search: suggestion }));
                            setCurrentPage(1);
                          }}
                          className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs hover:bg-gray-700 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                    
                    {/* Active Filters Display */}
                    {(appliedFilters.search || appliedFilters.location || appliedFilters.industry) && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="text-sm text-gray-400">Active filters:</span>
                        {appliedFilters.search && (
                          <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-sm flex items-center gap-1">
                            Search: "{appliedFilters.search}"
                            <button 
                              onClick={() => {
                                setSearchKeyword("");
                                setAppliedFilters(prev => ({ ...prev, search: "" }));
                                setCurrentPage(1);
                              }}
                              className="ml-1 hover:text-blue-200"
                            >
                              ×
                            </button>
                          </span>
                        )}
                        {appliedFilters.location && (
                          <span className="px-2 py-1 bg-green-900/30 text-green-300 rounded text-sm flex items-center gap-1">
                            Location: "{appliedFilters.location}"
                            <button 
                              onClick={() => {
                                setAppliedFilters(prev => ({ ...prev, location: "" }));
                                setCurrentPage(1);
                              }}
                              className="ml-1 hover:text-green-200"
                            >
                              ×
                            </button>
                          </span>
                        )}
                        {appliedFilters.industry && (
                          <span className="px-2 py-1 bg-purple-900/30 text-purple-300 rounded text-sm flex items-center gap-1">
                            Industry: "{appliedFilters.industry}"
                            <button 
                              onClick={() => {
                                setAppliedFilters(prev => ({ ...prev, industry: "" }));
                                setCurrentPage(1);
                              }}
                              className="ml-1 hover:text-purple-200"
                            >
                              ×
                            </button>
                          </span>
                        )}
                      </div>
                    )}
                  </form>
                </div>

                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white">Available Opportunities</h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-gray-400 text-sm">Jobs per page:</label>
                      <select
                        value={jobsPerPage}
                        onChange={(e) => {
                          setJobsPerPage(Number(e.target.value));
                          setCurrentPage(1); // Reset to first page when changing page size
                        }}
                        className="bg-gray-800 text-gray-300 border border-gray-600 rounded px-2 py-1 text-sm focus:border-purple-500 focus:outline-none"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-400">
                        Page {currentPage} • Showing {jobs.length} of {totalJobs} jobs
                        {(appliedFilters.search || appliedFilters.location || appliedFilters.industry) && (
                          <span className="text-purple-400 ml-2">(filtered)</span>
                        )}
                      </p>
                      {totalJobs === 0 && (appliedFilters.search || appliedFilters.location || appliedFilters.industry) && (
                        <p className="text-yellow-400 text-sm">No jobs match your search criteria. Try different keywords.</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 border-t-purple-500 animate-spin"></div>
                      <p className="text-purple-400">Loading jobs...</p>
                    </div>
                  </div>
                ) : jobs.length > 0 ? (
                  <>
                    <div className="grid gap-6">
                      {jobs.map((job) => (
                        <div 
                          key={job.id} 
                          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-xl overflow-hidden transition-all border border-gray-700 p-6 hover:border-purple-500/30"
                        >
                          <h3 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 mb-3">
                            {highlightText(job.job_title || job.title || 'Job Title Not Available', appliedFilters.search)}
                          </h3>
                          <p className="text-gray-300 mb-4 line-clamp-3">
                            {highlightText(job.description || 'Description not available', appliedFilters.search)}
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-purple-400">Company</span>
                              <span className="text-gray-300">
                                {highlightText(job.company_name || job.company || 'Not specified', appliedFilters.search)}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-purple-400">Location</span>
                              <span className="text-gray-300">
                                {highlightText(job.location || 'Location not specified', appliedFilters.location || appliedFilters.search)}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-purple-400">Industry</span>
                              <span className="text-gray-300">
                                {highlightText(job.industry || 'General', appliedFilters.industry || appliedFilters.search)}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-purple-400">Salary</span>
                              <span className="text-gray-300">
                                {job.salary_range || job.pay || 'Salary not disclosed'}
                                {job.salary_range && job.salary_range !== 'Negotiable' && (
                                  <span className="text-green-400 ml-1">₹</span>
                                )}
                              </span>
                            </div>
                          </div>
                          
                          {job.skills_required && job.skills_required.length > 0 && (
                            <div className="mt-4">
                              <span className="font-medium text-purple-400 block mb-2">Skills Required</span>
                              <div className="flex flex-wrap gap-2">
                                {job.skills_required.slice(0, 5).map((skill, index) => (
                                  <span key={index} className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-sm">
                                    {highlightText(skill, appliedFilters.search)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-6 flex justify-between items-center">
                            <div className="text-sm text-gray-400 flex flex-wrap gap-2">
                              {job.job_type && (
                                <span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded">
                                  {job.job_type}
                                </span>
                              )}
                              {job.experience_required && (
                                <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded">
                                  {job.experience_required === '0' ? 'Fresher' : `${job.experience_required} months exp.`}
                                </span>
                              )}
                              {job.source && (
                                <span className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded">
                                  {job.source}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {job.apply_url && (
                                <button 
                                  onClick={() => window.open(job.apply_url, '_blank')}
                                  className="px-3 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 bg-gray-800 rounded-lg border border-blue-500/30 hover:border-blue-500/50 transition-colors"
                                >
                                  Apply Now
                                </button>
                              )}
                              <button 
                                className="px-4 py-2 text-sm font-medium text-purple-400 hover:text-purple-300 bg-gray-800 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-colors"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Enhanced Pagination Controls */}
                    <div className="flex flex-col items-center space-y-4 mt-8">
                      <div className="flex items-center justify-between w-full text-sm text-gray-400">
                        <div>
                          Showing {((currentPage - 1) * jobsPerPage) + 1} to {Math.min(currentPage * jobsPerPage, totalJobs)} of {totalJobs} jobs
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-gray-400">Jump to page:</label>
                          <input
                            type="number"
                            min="1"
                            max={Math.ceil(totalJobs / jobsPerPage)}
                            value={currentPage}
                            onChange={(e) => {
                              const page = Math.max(1, Math.min(Number(e.target.value), Math.ceil(totalJobs / jobsPerPage)));
                              setCurrentPage(page);
                            }}
                            className="bg-gray-800 text-gray-300 border border-gray-600 rounded px-2 py-1 w-16 text-center focus:border-purple-500 focus:outline-none"
                          />
                          <span className="text-gray-500">of {Math.ceil(totalJobs / jobsPerPage)}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-center items-center space-x-4">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1 || loading}
                          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg border border-gray-600 hover:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Previous
                        </button>
                        
                        <div className="flex items-center space-x-2">
                          {(() => {
                            const totalPages = Math.ceil(totalJobs / jobsPerPage);
                            const maxVisiblePages = 5;
                            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                            
                            // Adjust startPage if we're near the end
                            if (endPage - startPage + 1 < maxVisiblePages) {
                              startPage = Math.max(1, endPage - maxVisiblePages + 1);
                            }
                            
                            const pages = [];
                            
                            // Add first page if not visible
                            if (startPage > 1) {
                              pages.push(
                                <button
                                  key={1}
                                  onClick={() => setCurrentPage(1)}
                                  disabled={loading}
                                  className="px-3 py-1 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                                >
                                  1
                                </button>
                              );
                              if (startPage > 2) {
                                pages.push(<span key="start-ellipsis" className="text-gray-500">...</span>);
                              }
                            }
                            
                            // Add visible pages
                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(
                                <button
                                  key={i}
                                  onClick={() => setCurrentPage(i)}
                                  disabled={loading}
                                  className={`px-3 py-1 rounded transition-colors ${
                                    i === currentPage
                                      ? 'bg-purple-600 text-white'
                                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                  }`}
                                >
                                  {i}
                                </button>
                              );
                            }
                            
                            // Add last page if not visible
                            if (endPage < totalPages) {
                              if (endPage < totalPages - 1) {
                                pages.push(<span key="end-ellipsis" className="text-gray-500">...</span>);
                              }
                              pages.push(
                                <button
                                  key={totalPages}
                                  onClick={() => setCurrentPage(totalPages)}
                                  disabled={loading}
                                  className="px-3 py-1 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
                                >
                                  {totalPages}
                                </button>
                              );
                            }
                            
                            return pages;
                          })()}
                        </div>
                        
                        <button
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          disabled={currentPage >= Math.ceil(totalJobs / jobsPerPage) || loading}
                          className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg border border-gray-600 hover:border-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-xl border border-gray-700 p-8 text-center">
                    <p className="text-gray-400 text-lg">{t('viewJobs.noJobs.message')}</p>
                    <p className="text-purple-400 mt-2">{t('viewJobs.noJobs.cta')}</p>
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
                
                <h2 className="text-2xl font-bold mb-6 text-white">{t('postJob.title')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="title" className="text-lg font-medium text-purple-300">{t('postJob.fields.jobTitle')}</label>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      placeholder={t('postJob.placeholders.jobTitle')}
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label htmlFor="company" className="text-lg font-medium text-purple-300">{t('postJob.fields.company')}</label>
                    <input
                      type="text"
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      placeholder={t('postJob.placeholders.company')}
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label htmlFor="location" className="text-lg font-medium text-purple-300">{t('postJob.fields.location')}</label>
                    <input
                      type="text"
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      placeholder={t('postJob.placeholders.location')}
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label htmlFor="pay" className="text-lg font-medium text-purple-300">{t('postJob.fields.compensation')}</label>
                    <input
                      type="text"
                      id="pay"
                      value={pay}
                      onChange={(e) => setPay(e.target.value)}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      placeholder={t('postJob.placeholders.compensation')}
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label htmlFor="company_contact" className="text-lg font-medium text-purple-300">{t('postJob.fields.contactInfo')}</label>
                    <input
                      type="text"
                      id="company_contact"
                      value={companyContact}
                      onChange={(e) => setCompanyContact(e.target.value)}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      placeholder={t('postJob.placeholders.contactInfo')}
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label htmlFor="description" className="text-lg font-medium text-purple-300">{t('postJob.fields.jobDescription')}</label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      rows={6}
                      placeholder={t('postJob.placeholders.jobDescription')}
                      required
                    ></textarea>
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-purple-900/20 font-medium"
                  disabled={loading}
                >
                  {loading ? t('postJob.posting') : t('postJob.submit')}
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
                  
                  <h2 className="text-2xl font-bold mb-6 text-white">{t('recommendation.title')}</h2>
                  <p className="text-gray-300 mb-6">{t('recommendation.subtitle')}</p>
                  
                  <div className="flex flex-col gap-2">
                    <label htmlFor="user_info" className="text-lg font-medium text-purple-300">{t('recommendation.fields.profileInfo')}</label>
                    <textarea
                      id="user_info"
                      value={userInfo}
                      onChange={(e) => setUserInfo(e.target.value)}
                      className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                      rows={6}
                      placeholder={t('recommendation.placeholders.profileInfo')}
                      required
                    ></textarea>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full mt-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-purple-900/20 font-medium"
                    disabled={loading}
                  >
                    {loading ? t('recommendation.analyzing') : t('recommendation.submit')}
                  </button>
                </form>

                {/* Recommendation Results */}
                {recommendedJob && (
                  <div className="mt-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-xl border border-purple-500/30 p-8 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500 rounded-full filter blur-3xl opacity-10"></div>
                    
                    <h3 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                      {t('recommendation.results.title')}
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-xl font-semibold text-white mb-2">
                          {recommendedJob.job_title || recommendedJob.title || 'Job Title Not Available'}
                        </h4>
                        <p className="text-gray-300">{recommendedJob.description || 'Description not available'}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-purple-400">Company</span>
                          <span className="text-gray-300">
                            {recommendedJob.company_name || recommendedJob.company || 'Not specified'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-purple-400">Location</span>
                          <span className="text-gray-300">{recommendedJob.location || 'Location not specified'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-purple-400">Industry</span>
                          <span className="text-gray-300">{recommendedJob.industry || 'General'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-purple-400">Salary</span>
                          <span className="text-gray-300">
                            {recommendedJob.salary_range || recommendedJob.pay || 'Salary not disclosed'}
                            {recommendedJob.salary_range && recommendedJob.salary_range !== 'Negotiable' && (
                              <span className="text-green-400 ml-1">₹</span>
                            )}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-purple-400">Job Type</span>
                          <span className="text-gray-300">{recommendedJob.job_type || 'Full-time'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-purple-400">Experience Required</span>
                          <span className="text-gray-300">
                            {recommendedJob.experience_required === '0' ? 'Fresher' : 
                             recommendedJob.experience_required ? `${recommendedJob.experience_required} months` : 'Not specified'}
                          </span>
                        </div>
                      </div>
                      
                      {recommendedJob.skills_required && recommendedJob.skills_required.length > 0 && (
                        <div className="mt-6">
                          <span className="font-medium text-purple-400 block mb-2">Skills Required</span>
                          <div className="flex flex-wrap gap-2">
                            {recommendedJob.skills_required.slice(0, 6).map((skill, index) => (
                              <span key={index} className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Job ID:</span>
                            <span className="text-gray-300">{recommendedJob.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Source:</span>
                            <span className="text-gray-300">{recommendedJob.source || 'Internal'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Sector:</span>
                            <span className="text-gray-300">{recommendedJob.sector || 'General'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Relevance Score:</span>
                            <span className="text-green-400">{recommendedJob.relevance_score || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-end gap-3">
                        {recommendedJob.apply_url ? (
                          <button 
                            onClick={() => window.open(recommendedJob.apply_url, '_blank')}
                            className="px-6 py-3 text-white font-medium bg-gradient-to-r from-green-600 to-green-700 rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
                          >
                            Apply Now
                          </button>
                        ) : (
                          <div className="text-center">
                            {recommendedJob.company_contact ? (
                              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
                                <p className="text-blue-300 font-medium mb-1">Contact to Apply</p>
                                <p className="text-gray-300">{recommendedJob.company_contact}</p>
                              </div>
                            ) : (
                              <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                                <p className="text-gray-400">No direct application link available</p>
                                <p className="text-gray-500 text-sm mt-1">Contact information not provided</p>
                              </div>
                            )}
                          </div>
                        )}
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