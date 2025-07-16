import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, Award, Users } from 'lucide-react';
import { Badge } from '../ui/badge';
import { userAPI } from '../../lib/api';

export default function JobMentorDashboard() {
  const { t, ready } = useTranslation('jobmentordashboard');
  const [loading, setLoading] = useState(true);
  const [visualSummary, setVisualSummary] = useState(null);
  const [csrCourses, setCsrCourses] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [businessSuggestions, setBusinessSuggestions] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [dashboardError, setDashboardError] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [openSchemeIndexes, setOpenSchemeIndexes] = useState([]);
  const [openBizIndexes, setOpenBizIndexes] = useState([]);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  const fetchDashboard = async (forceRefresh = false) => {
    setLoading(true);
    setDashboardError(null);
    try {
      const profileRes = await userAPI.getProfile();
      if (profileRes.data) {
        const profile = profileRes.data;
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
      } else if (profileRes.error) {
        console.error('Error fetching profile:', profileRes.error);
        setDashboardError(t('job_mentor_dashboard.loading_error'));
      }
    } catch (err) {
      setDashboardError(t('job_mentor_dashboard.loading_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ready) {
      fetchDashboard(false);
    }
    // eslint-disable-next-line
  }, [ready]);

  // Show a loading state if translations are not ready
  if (!ready || loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-16 text-white">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-gray-700/50 rounded w-1/4"></div>
          <div className="h-48 bg-gray-800/50 rounded-lg"></div>
          <div className="h-10 bg-gray-700/50 rounded w-1/4"></div>
          <div className="h-48 bg-gray-800/50 rounded-lg"></div>
          <div className="h-10 bg-gray-700/50 rounded w-1/4"></div>
          <div className="h-48 bg-gray-800/50 rounded-lg"></div>
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
            {t('job_mentor_dashboard.go_to_profile')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-16 text-white">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-bold tracking-tight">
          {t('job_mentor_dashboard.title', { name: userProfile?.name || 'Your' })}
        </h1>
        <button
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-transform transform hover:scale-105"
          onClick={() => fetchDashboard(true)}
        >
          {t('job_mentor_dashboard.recreate_dashboard')}
        </button>
      </header>

      {visualSummary && visualSummary.summary_data && visualSummary.summary_data.sections && (
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight">{t('visual_summary.title')}</h2>
          <div
            className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl shadow-2xl border border-gray-700/50 p-8 cursor-pointer hover:shadow-3xl transition-all duration-300"
            onClick={() => setShowSummaryModal(true)}
          >
            <h3 className="text-2xl font-bold mb-6 text-purple-100">{visualSummary.summary_data.title || visualSummary.topic}</h3>
            <div className="space-y-8">
              {visualSummary.summary_data.sections.slice(0, 2).map((section, idx) => (
                <div key={idx} className="space-y-4">
                  <h4 className="text-xl font-semibold text-white">{section.title}</h4>
                  <p className="text-gray-300 leading-relaxed">{section.text}</p>
                  {section.imageUrl && (
                    <img
                      src={`${API_BASE_URL}/api${section.imageUrl}`}
                      alt={section.title}
                      className="my-4 rounded-lg max-w-full object-cover h-48 shadow-md"
                    />
                  )}
                  {section.audioUrl && (
                    <audio controls src={`${API_BASE_URL}/audio/${section.audioUrl}`} className="w-full rounded-lg" />
                  )}
                </div>
              ))}
            </div>
            <div className="text-right text-blue-400 mt-6 text-sm font-medium">{t('visual_summary.click_to_view_all')}</div>
          </div>
          {showSummaryModal && (
            <VisualSummaryModal summary={visualSummary} onClose={() => setShowSummaryModal(false)} />
          )}
        </section>
      )}

      {csrCourses && csrCourses.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight">{t('csr_courses.title')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {csrCourses.map((course) => (
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
                  {t('csr_courses.view_course')}
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Hackathon Platform Integration */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-semibold tracking-tight">Hackathon Platform</h2>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/events')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Manage Events
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              View Projects
            </button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Active Events</h3>
                <p className="text-2xl font-bold text-blue-400">12</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">Upcoming hackathons and workshops</p>
          </div>

          <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Projects Created</h3>
                <p className="text-2xl font-bold text-green-400">47</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">Innovative solutions developed</p>
          </div>

          <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Participants</h3>
                <p className="text-2xl font-bold text-purple-400">1,234</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">Active community members</p>
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-gray-800/80 rounded-2xl p-6 border border-gray-700/50">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Events</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="font-semibold text-white">AI for Social Impact Hackathon</h4>
                <p className="text-gray-400 text-sm">Mumbai, Maharashtra • 2 days ago</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
              <div>
                <h4 className="font-semibold text-white">Digital Literacy Workshop</h4>
                <p className="text-gray-400 text-sm">Hyderabad, Telangana • 1 week ago</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
            </div>
          </div>
        </div>
      </section>

      {jobs && jobs.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight">{t('job_mentor_dashboard.jobs.title')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {jobs.map((job, idx) => (
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
                    {t('job_mentor_dashboard.jobs.contact')}
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {businessSuggestions && businessSuggestions.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-3xl font-semibold tracking-tight">{t('job_mentor_dashboard.business_suggestions.title')}</h2>
          <div className="space-y-4">
            {businessSuggestions.map((suggestion, idx) => (
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
                    {suggestion.idea_name || suggestion.recommendation || t('job_mentor_dashboard.business_suggestions.default_idea_name', { index: idx + 1 })}
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
                          <span className="font-medium text-purple-300 text-lg block mb-2">{t('job_mentor_dashboard.business_suggestions.business_type')}</span>
                          <span className="text-purple-100">{suggestion.business_type}</span>
                        </div>
                      )}
                      {suggestion.required_resources && (
                        <div className="p-4 bg-gray-800/30 rounded-xl border border-purple-900/20">
                          <span className="font-medium text-purple-300 text-lg block mb-2">{t('job_mentor_dashboard.business_suggestions.required_resources')}</span>
                          <ul className="space-y-3">
                            {suggestion.required_resources.map((resource, i) => (
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
                          <span className="font-medium text-purple-300 text-lg block mb-2">{t('job_mentor_dashboard.business_suggestions.initial_steps')}</span>
                          <ol className="space-y-3">
                            {suggestion.initial_steps.map((step, stepIdx) => (
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
                          <span className="font-medium text-purple-300 text-lg block mb-2">{t('job_mentor_dashboard.business_suggestions.why_it_suits')}</span>
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
          <h2 className="text-3xl font-semibold tracking-tight">{t('job_mentor_dashboard.schemes.title')}</h2>
          <div className="space-y-4">
            {schemes.map((scheme, idx) => (
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
                        <span className="font-medium text-purple-400 text-lg">{t('job_mentor_dashboard.schemes.goal')}</span>
                        <span className="text-gray-300">{scheme.goal}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="font-medium text-purple-400 text-lg">{t('job_mentor_dashboard.schemes.benefits')}</span>
                        <span className="text-gray-300">{scheme.benefit}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="font-medium text-purple-400 text-lg">{t('job_mentor_dashboard.schemes.eligibility')}</span>
                        <span className="text-gray-300">{scheme.eligibility}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="font-medium text-purple-400 text-lg">{t('job_mentor_dashboard.schemes.how_to_apply')}</span>
                        <span className="text-gray-300">{scheme.application_process}</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="font-medium text-purple-400 text-lg">{t('job_mentor_dashboard.schemes.special_features')}</span>
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