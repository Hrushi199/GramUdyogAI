import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function JobMentorDashboard() {
  const [loading, setLoading] = useState(true);
  const [visualSummary, setVisualSummary] = useState<any>(null);
  const [csrCourses, setCsrCourses] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [businessSuggestions, setBusinessSuggestions] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [openSchemeIndexes, setOpenSchemeIndexes] = useState<number[]>([]);
  const [openBizIndexes, setOpenBizIndexes] = useState<number[]>([]);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  const fetchDashboard = async (forceRefresh = false) => {
    setLoading(true);
    setDashboardError(null);
    try {
      const profileRes = await fetch(`${API_BASE_URL}/api/users/profile`);
      const profile = await profileRes.json();
      if (!profile || !profile.name) {
        navigate('/profile');
        return;
      }
      setUserProfile(profile);

      const dashRes = await fetch(`${API_BASE_URL}/api/dashboard-recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, force_refresh: forceRefresh }),
      });
      const data = await dashRes.json();
      if (data.error) {
        setDashboardError(data.error);
      }
      console.log('Dashboard Data:', data);
      setVisualSummary(data.visual_summary || null);
      setCsrCourses(data.csr_courses || []);
      setJobs(data.jobs || []);
      setBusinessSuggestions(data.business_suggestions || []);
      setSchemes(data.schemes || []);
    } catch (err: any) {
      setDashboardError('Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(false);
    // eslint-disable-next-line
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-12 text-white">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="h-40 bg-gray-800 rounded"></div>
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="h-40 bg-gray-800 rounded"></div>
          <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          <div className="h-40 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-white">
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 text-red-300 text-center">
          {dashboardError}
        </div>
        <div className="mt-6 flex justify-center">
          <button
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold"
            onClick={() => navigate('/profile')}
          >
            Go to Profile
          </button>
        </div>
      </div>
    );
  }

  // --- Visual Summary Modal ---
  function VisualSummaryModal({ summary, onClose }: { summary: any; onClose: () => void }) {
    const [sectionIdx, setSectionIdx] = useState(0);
    const sections = summary?.summary_data?.sections || [];
    const section = sections[sectionIdx] || { title: '', text: '', imageUrl: '', audioUrl: '' };
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur">
        <div className="relative w-full max-w-lg max-h-[90vh] rounded-3xl overflow-auto shadow-2xl bg-gradient-to-br from-[#1a1333] via-[#181a2a] to-[#1a2333] border border-white/10">
          <button
            className="absolute top-4 right-4 z-10 text-white/80 hover:text-white p-2 bg-black/30 rounded-full"
            onClick={onClose}
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative h-[60vh] bg-black">
            <img
              src={`${API_BASE_URL}/api/images/${section.imageUrl}`}
              alt={section.title}
              className="w-full h-full object-cover object-center transition-all duration-300"
              style={{ minHeight: 320, background: '#222' }}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full"
              onClick={() => setSectionIdx((idx) => Math.max(0, idx - 1))}
              disabled={sectionIdx === 0}
              aria-label="Previous"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full"
              onClick={() => setSectionIdx((idx) => Math.min(sections.length - 1, idx + 1))}
              disabled={sectionIdx === sections.length - 1}
              aria-label="Next"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="p-6 pb-4">
            <h2 className="text-2xl font-bold text-purple-200 mb-2">{summary.summary_data?.title}</h2>
            <div className="mb-4">
              <span className="inline-block px-3 py-1 text-xs rounded-full bg-purple-900/40 text-purple-200 mr-2">
                Section {sectionIdx + 1} of {sections.length}
              </span>
              <span className="inline-block px-3 py-1 text-xs rounded-full bg-blue-900/40 text-blue-200">
                {section.title}
              </span>
            </div>
            <p className="text-white/90 text-lg leading-relaxed mb-2">{section.text}</p>
            {section.audioUrl && section.audioUrl.length > 0 && (
              <audio controls src={`${API_BASE_URL}/api/audio/${section.audioUrl}`} className="mt-2 w-full" />
            )}
            <div className="flex justify-center gap-2 mt-6">
              {sections.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-3 h-3 rounded-full border-2 ${
                    idx === sectionIdx ? 'bg-purple-400 border-purple-400' : 'bg-white/30 border-white/30'
                  }`}
                  onClick={() => setSectionIdx(idx)}
                  aria-label={`Go to section ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12 text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-center">📊 {userProfile?.name || 'Your'} Dashboard</h1>
        <button
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold"
          onClick={() => fetchDashboard(true)}
        >
          Recreate Dashboard
        </button>
      </div>

      {/* Visual Summary */}
      {visualSummary && visualSummary.summary_data && visualSummary.summary_data.sections && (
        <section>
          <h2 className="text-2xl font-semibold mb-2">🖼️ Visual Summary</h2>
          <div
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 cursor-pointer hover:shadow-2xl transition"
            onClick={() => setShowSummaryModal(true)}
          >
            <h3 className="text-xl font-bold mb-4">{visualSummary.summary_data.title || visualSummary.topic}</h3>
            <div className="space-y-6">
              {visualSummary.summary_data.sections.slice(0, 2).map((section: any, idx: number) => (
                <div key={idx} className="mb-6">
                  <h4 className="text-lg font-semibold">{section.title}</h4>
                  <p className="text-gray-300">{section.text}</p>
                  {section.imageUrl && (
                    <img src={`${API_BASE_URL}/api/images/${section.imageUrl}`} alt={section.title} className="my-3 rounded-lg max-w-full" />
                  )}
                  {section.audioUrl && (
                    <audio controls src={`${API_BASE_URL}/api/audio/${section.audioUrl}`} className="my-2" />
                  )}
                </div>
              ))}
            </div>
            <div className="text-right text-blue-400 mt-2 text-sm">Click to view all sections</div>
          </div>
          {showSummaryModal && (
            <VisualSummaryModal summary={visualSummary} onClose={() => setShowSummaryModal(false)} />
          )}
        </section>
      )}

      {/* CSR Courses */}
      {csrCourses && csrCourses.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-2">🎓 Recommended CSR Courses</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {csrCourses.map((course: any) => (
              <div key={course.id} className="bg-gray-800 rounded-lg p-5 shadow border border-gray-700">
                <h3 className="font-bold text-lg">{course.title}</h3>
                <p className="text-gray-300">{course.description}</p>
                <p className="text-sm text-blue-300">{course.language}</p>
                <a href={course.url} className="text-purple-400 underline mt-2 inline-block" target="_blank" rel="noopener noreferrer">
                  View Course
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Jobs */}
      {jobs && jobs.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-2">🔍 Recommended Jobs</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {jobs.map((job: any, idx: number) => (
              <div key={job.id || idx} className="bg-gray-800 rounded-lg p-5 shadow border border-gray-700">
                <h3 className="font-bold text-lg">{job.title}</h3>
                <p className="text-gray-300">{job.description}</p>
                <p className="text-sm text-purple-300">{job.company}</p>
                <p className="text-sm text-blue-300">{job.location}</p>
                {job.company_contact && (
                  <a href={`mailto:${job.company_contact}`} className="text-purple-400 underline mt-2 inline-block">
                    Contact
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Business Suggestions */}
      {businessSuggestions && businessSuggestions.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-2">💡 Business Suggestions</h2>
          <div className="space-y-4">
            {businessSuggestions.map((suggestion: any, idx: number) => (
              <div key={idx} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-xl overflow-hidden transition-all border border-purple-800/40 hover:border-purple-700/60">
                <button
                  className="w-full flex justify-between items-center px-6 py-5 text-left focus:outline-none group"
                  onClick={() =>
                    setOpenBizIndexes((prev) =>
                      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                    )
                  }
                >
                  <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-purple-500">
                    {suggestion.idea_name || suggestion.recommendation || `Business Idea #${idx + 1}`}
                  </span>
                  <div className="bg-purple-900/30 p-2 rounded-full transition-all group-hover:bg-purple-800/50">
                    <svg
                      className={`w-5 h-5 transform transition-transform text-purple-400 ${
                        openBizIndexes.includes(idx) ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                <div
                  className={`transition-all duration-300 ${
                    openBizIndexes.includes(idx) ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                  }`}
                >
                  {openBizIndexes.includes(idx) && (
                    <div className="px-6 py-5 space-y-6">
                      {suggestion.business_type && (
                        <div className="p-4 bg-gray-800/50 rounded-lg border border-purple-900/20">
                          <span className="font-medium text-purple-300 text-lg block mb-2">Business Type</span>
                          <span className="text-purple-100">{suggestion.business_type}</span>
                        </div>
                      )}
                      {suggestion.required_resources && (
                        <div className="p-4 bg-gray-800/50 rounded-lg border border-purple-900/20">
                          <span className="font-medium text-purple-300 text-lg block mb-2">Required Resources</span>
                          <ul className="space-y-2">
                            {suggestion.required_resources.map((resource: string, i: number) => (
                              <li key={i} className="flex items-start text-purple-100">
                                <svg className="w-5 h-5 text-purple-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {resource}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {suggestion.initial_steps && (
                        <div className="p-4 bg-gray-800/50 rounded-lg border border-purple-900/20">
                          <span className="font-medium text-purple-300 text-lg block mb-2">Initial Steps</span>
                          <ol className="space-y-2">
                            {suggestion.initial_steps.map((step: string, stepIdx: number) => (
                              <li key={stepIdx} className="flex items-start text-purple-100">
                                <span className="flex-shrink-0 flex items-center justify-center bg-purple-800/50 text-purple-300 w-6 h-6 rounded-full mr-3 text-sm font-medium">
                                  {stepIdx + 1}
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {suggestion.why_it_suits && (
                        <div className="p-4 bg-gray-800/50 rounded-lg border border-purple-900/20">
                          <span className="font-medium text-purple-300 text-lg block mb-2">Why it suits you</span>
                          <span className="text-purple-100">{suggestion.why_it_suits}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Schemes */}
      {schemes && schemes.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-2">🏛️ Recommended Schemes</h2>
          <div className="space-y-4">
            {schemes.map((scheme: any, idx: number) => (
              <div key={idx} className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow-xl overflow-hidden transition-all border border-gray-700">
                <button
                  className="w-full flex justify-between items-center px-6 py-4 text-left focus:outline-none group hover:bg-gray-800/50"
                  onClick={() =>
                    setOpenSchemeIndexes((prev) =>
                      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
                    )
                  }
                >
                  <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                    {scheme.name}
                  </span>
                  <svg
                    className={`w-6 h-6 transform transition-transform text-blue-400 group-hover:text-purple-400 ${
                      openSchemeIndexes.includes(idx) ? "rotate-180" : ""
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
                    openSchemeIndexes.includes(idx) ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0 overflow-hidden"
                  }`}
                >
                  {openSchemeIndexes.includes(idx) && (
                    <div className="py-2 space-y-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-purple-400">Goal</span>
                        <span className="text-gray-300">{scheme.goal}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-purple-400">Benefits</span>
                        <span className="text-gray-300">{scheme.benefit}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-purple-400">Eligibility</span>
                        <span className="text-gray-300">{scheme.eligibility}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-purple-400">How to Apply</span>
                        <span className="text-gray-300">{scheme.application_process}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-purple-400">Special Features</span>
                        <span className="text-gray-300">{scheme.special_features}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
