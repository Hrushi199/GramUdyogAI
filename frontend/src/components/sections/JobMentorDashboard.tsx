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
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-16 text-white">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-gray-700/50 rounded w-1/4"></div>
          <div className="h-48 bg-gray-800/50 rounded-lg"></div>
          <div className="h-10 bg-gray-700/50 rounded w-1/4"></div>
          <div className="h-48 bg-gray-800/50 rounded-lg"></div>
          <div className="h-10 bg-gray-700/50 rounded w-1/4"></div>
          <div className="h指的是48 bg-gray-800/50 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 text-white">
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-8 text-red-200 text-center shadow-lg">
          {dashboardError}
        </div>
        <div className="mt-8 flex justify-center">
          <button
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-transform transform hover:scale-105"
            onClick={() => navigate('/profile')}
          >
            Go to Profile
          </button>
        </div>
      </div>
    );
  }

  function VisualSummaryModal({ summary, onClose }: { summary: any; onClose: () => void }) {
    const [sectionIdx, setSectionIdx] = useState(0);
    const sections = summary?.summary_data?.sections || [];
    const section = sections[sectionIdx] || { title: '', text: '', imageUrl: '', audioUrl: '' };
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-xl max-h-[90vh] rounded-2xl overflow-auto shadow-2xl bg-gradient-to-br from-[#1a1333] via-[#181a2a] to-[#1a2333] border border-white/10">
          <button
            className="absolute top-4 right-4 z-10 text-white/70 hover:text-white p-2 bg-black/40 rounded-full transition"
            onClick={onClose}
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative h-[60vh] bg-black/50">
            <img
              src={`${API_BASE_URL}/api/images/${section.imageUrl}`}
              alt={section.title}
              className="w-full h-full object-cover object-center transition-all duration-500 ease-in-out"
              style={{ minHeight: 320, background: '#222' }}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition"
              onClick={() => setSectionIdx((idx) => Math.max(0, idx - 1))}
              disabled={sectionIdx === 0}
              aria-label="Previous"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition"
              onClick={() => setSectionIdx((idx) => Math.min(sections.length - 1, idx + 1))}
              disabled={sectionIdx === sections.length - 1}
              aria-label="Next"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="p-8">
            <h2 className="text-2xl font-bold text-purple-100 mb-4">{summary.summary_data?.title}</h2>
            <div className="mb-6 flex gap-2">
              <span className="inline-block px-4 py-1 text-xs rounded-full bg-purple-900/30 text-purple-200">
                Section {sectionIdx + 1} of {sections.length}
              </span>
              <span className="inline-block px-4 py-1 text-xs rounded-full bg-blue-900/30 text-blue-200">
                {section.title}
              </span>
            </div>
            <p className="text-white/90 text-lg leading-relaxed mb-6">{section.text}</p>
            {section.audioUrl && section.audioUrl.length > 0 && (
              <audio controls src={`${API_BASE_URL}/api/audio/${section.audioUrl}`} className="w-full rounded-lg" />
            )}
            <div className="flex justify-center gap-3 mt-8">
              {sections.map((_: any, idx: number) => (
                <button
                  key={idx}
                  className={`w-3 h-3 rounded-full border-2 transition ${
                    idx === sectionIdx ? 'bg-purple-400 border-purple-400' : 'bg-white/20 border-white/20'
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
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-16 text-white">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight">{userProfile?.name || 'Your'} Dashboard</h1>
        <button
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-transform transform hover:scale-105"
          onClick={() => fetchDashboard(true)}
        >
          Recreate Dashboard
        </button>
      </header>

      {visualSummary && visualSummary.summary_data && visualSummary.summary_data.sections && (
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight">Visual Summary</h2>
          <div
            className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl shadow-2xl border border-gray-700/50 p-8 cursor-pointer hover:shadow-3xl transition-all duration-300"
            onClick={() => setShowSummaryModal(true)}
          >
            <h3 className="text-2xl font-bold mb-6 text-purple-100">{visualSummary.summary_data.title || visualSummary.topic}</h3>
            <div className="space-y-8">
              {visualSummary.summary_data.sections.slice(0, 2).map((section: any, idx: number) => (
                <div key={idx} className="space-y-4">
                  <h4 className="text-xl font-semibold text-white">{section.title}</h4>
                  <p className="text-gray-300 leading-relaxed">{section.text}</p>
                  {section.imageUrl && (
                    <img
                      src={`${API_BASE_URL}/api/images/${section.imageUrl}`}
                      alt={section.title}
                      className="my-4 rounded-lg max-w-full object-cover h-48 shadow-md"
                    />
                  )}
                  {section.audioUrl && (
                    <audio controls src={`${API_BASE_URL}/api/audio/${section.audioUrl}`} className="w-full rounded-lg" />
                  )}
                </div>
              ))}
            </div>
            <div className="text-right text-blue-400 mt-6 text-sm font-medium">Click to view all sections</div>
          </div>
          {showSummaryModal && (
            <VisualSummaryModal summary={visualSummary} onClose={() => setShowSummaryModal(false)} />
          )}
        </section>
      )}

      {csrCourses && csrCourses.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight">Recommended CSR Courses</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {csrCourses.map((course: any) => (
              <div
                key={course.id}
                className="bg-gray-800/80 rounded-2xl p-6 shadow-lg border border-gray-700/50 hover:bg-gray-750/90 transition-all duration-300"
              >
                <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
                <p className="text-gray-300 mb-4">{course.description}</p>
                <p className="text-sm text-blue-300 mb-4">{course.language}</p>
                <a
                  href={course.url}
                  className="text-purple-400 font-medium underline hover:text-purple-300 transition"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Course
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {jobs && jobs.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight">Recommended Jobs</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {jobs.map((job: any, idx: number) => (
              <div
                key={job.id || idx}
                className="bg-gray-800/80 rounded-2xl p-6 shadow-lg border border-gray-700/50 hover:bg-gray-750/90 transition-all duration-300"
              >
                <h3 className="text-xl font-bold text-white mb-2">{job.title}</h3>
                <p className="text-gray-300 mb-4">{job.description}</p>
                <p className="text-sm text-purple-300 mb-2">{job.company}</p>
                <p className="text-sm text-blue-300 mb-4">{job.location}</p>
                {job.company_contact && (
                  <a
                    href={`mailto:${job.company_contact}`}
                    className="text-purple-400 font-medium underline hover:text-purple-300 transition"
                  >
                    Contact
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {businessSuggestions && businessSuggestions.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight">Business Suggestions</h2>
          <div className="space-y-4">
            {businessSuggestions.map((suggestion: any, idx: number) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl shadow-xl overflow-hidden border border-purple-800/30 hover:border-purple-700/50 transition-all duration-300"
              >
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
                  <div className="bg-purple-900/20 p-2 rounded-full transition-all group-hover:bg-purple-800/40">
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
                  className={`transition-all duration-500 ease-in-out ${
                    openBizIndexes.includes(idx) ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                  }`}
                >
                  {openBizIndexes.includes(idx) && (
                    <div className="px-6 py-5 space-y-6">
                      {suggestion.business_type && (
                        <div className="p-4 bg-gray-800/30 rounded-xl border border-purple-900/20">
                          <span className="font-medium text-purple-300 text-lg block mb-2">Business Type</span>
                          <span className="text-purple-100">{suggestion.business_type}</span>
                        </div>
                      )}
                      {suggestion.required_resources && (
                        <div className="p-4 bg-gray-800/30 rounded-xl border border-purple-900/20">
                          <span className="font-medium text-purple-300 text-lg block mb-2">Required Resources</span>
                          <ul className="space-y-3">
                            {suggestion.required_resources.map((resource: string, i: number) => (
                              <li key={i} className="flex items-start text-purple-100">
                                <svg
                                  className="w-5 h-5 text-purple-400 mr-2 mt-1 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                {resource}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {suggestion.initial_steps && (
                        <div className="p-4 bg-gray-800/30 rounded-xl border border-purple-900/20">
                          <span className="font-medium text-purple-300 text-lg block mb-2">Initial Steps</span>
                          <ol className="space-y-3">
                            {suggestion.initial_steps.map((step: string, stepIdx: number) => (
                              <li key={stepIdx} className="flex items-start text-purple-100">
                                <span className="flex-shrink-0 flex items-center justify-center bg-purple-800/40 text-purple-300 w-6 h-6 rounded-full mr-3 text-sm font-medium">
                                  {stepIdx + 1}
                                </span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {suggestion.why_it_suits && (
                        <div className="p-4 bg-gray-800/30 rounded-xl border border-purple-900/20">
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

      {schemes && schemes.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight">Recommended Schemes</h2>
          <div className="space-y-4">
            {schemes.map((scheme: any, idx: number) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl shadow-xl overflow-hidden border border-gray-700/50 transition-all duration-300"
              >
                <button
                  className="w-full flex justify-between items-center px-6 py-5 text-left focus:outline-none group hover:bg-gray-850/90"
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
                      openSchemeIndexes.includes(idx) ? 'rotate-180' : ''
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
                  className={`px-6 pb-5 transition-all duration-500 ease-in-out ${
                    openSchemeIndexes.includes(idx) ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
                  }`}
                >
                  {openSchemeIndexes.includes(idx) && (
                    <div className="space-y-6">
                      <div className="flex flex-col gap-2">
                        <span className="font-medium text-purple-400 text-lg">Goal</span>
                        <span className="text-gray-300">{scheme.goal}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="font-medium text-purple-400 text-lg">Benefits</span>
                        <span className="text-gray-300">{scheme.benefit}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="font-medium text-purple-400 text-lg">Eligibility</span>
                        <span className="text-gray-300">{scheme.eligibility}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="font-medium text-purple-400 text-lg">How to Apply</span>
                        <span className="text-gray-300">{scheme.application_process}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="font-medium text-purple-400 text-lg">Special Features</span>
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