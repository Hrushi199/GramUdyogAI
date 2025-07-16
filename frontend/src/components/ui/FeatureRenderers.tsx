import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, MapPin, DollarSign, Clock, Building, Star, Users, Award, Calendar, Play } from 'lucide-react';
import { Job } from '../../lib/api'; // Import Job type from api.ts

// Global helper function to safely render any data type as string
const safeRender = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (Array.isArray(value)) return value.join(', ');
    return Object.values(value).filter(v => v !== null && v !== undefined).join(', ');
  }
  return String(value);
};

// Keep only local interfaces that don't exist in api.ts
interface Scheme {
  id: number;
  name: string;
  description: string;
  eligibility?: string;
  benefits?: string;
  application_process?: string;
  website?: string;
}

interface BusinessSuggestion {
  idea_name: string;
  business_type: string;
  required_resources: string[];
  initial_steps: string[];
  why_it_suits: string;
  total_estimated_cost?: string;
  difficulty_level?: string;
  profit_potential?: string;
}

interface UpdatedCourse {
  id: number;
  name: string;
  link: string;
  category?: string;
  skill_level?: string;
  duration?: string;
  provider?: string;
  description?: string;
  tags?: string[];
  source?: string;
  is_active: boolean;
  created_at: string;
}


interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  type: string;
  organizer?: string;
  registration_link?: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  creator: string;
  status: string;
  investment_needed?: string;
  tags?: string[];
}

interface YoutubeSummary {
  title: string;
  summary: string;
  key_points?: string[];
  duration?: string;
  url?: string;
}

interface ProfileData {
  name: string;
  skills: string[];
  experience: string;
  goals: string;
  achievements?: string[];
}

// Job Renderer Component
export const JobRenderer: React.FC<{ jobs: Job[]; compact?: boolean }> = ({ jobs, compact = true }) => {
  const { t } = useTranslation('job-board');
  const [showAll, setShowAll] = React.useState(!compact);

  const displayedJobs = showAll ? jobs : jobs.slice(0, 3);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-cyan-400 mb-3">💼 {t('recommended_jobs', 'Recommended Jobs')}</h3>
      {displayedJobs.map((job, index) => (
        <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-cyan-700/50 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-white text-sm">{safeRender(job.job_title || job.title)}</h4>
            <div className="flex items-center gap-2">
              {job.relevance_score && job.relevance_score > 0 && (
                <span className="text-xs text-yellow-400 px-2 py-1 bg-yellow-900/30 rounded-full">
                  ⭐ {job.relevance_score}
                </span>
              )}
              {job.job_type && (
                <span className="text-xs text-cyan-400 px-2 py-1 bg-cyan-900/30 rounded-full">{safeRender(job.job_type)}</span>
              )}
              {job.job_status && (
                <span className="text-xs text-pink-400 px-2 py-1 bg-pink-900/30 rounded-full">{safeRender(job.job_status)}</span>
              )}
              {job.is_active !== undefined && (
                <span className={`text-xs px-2 py-1 rounded-full ${job.is_active ? 'bg-green-900/30 text-green-400' : 'bg-gray-700/30 text-gray-400'}`}>{job.is_active ? 'Active' : 'Inactive'}</span>
              )}
            </div>
          </div>

          <div className="flex items-center text-gray-400 text-xs mb-2 flex-wrap gap-2">
            {job.company_name && <><Building className="w-3 h-3 mr-1.5" /> <span className="mr-3">{safeRender(job.company_name)}</span></>}
            {job.company && !job.company_name && <><Building className="w-3 h-3 mr-1.5" /> <span className="mr-3">{safeRender(job.company)}</span></>}
            {job.location && <><MapPin className="w-3 h-3 mr-1.5" /> <span>{safeRender(job.location)}</span></>}
            {job.sector && <><span className="ml-2 text-purple-300">Sector:</span> <span>{safeRender(job.sector)}</span></>}
          </div>

          <div className="flex items-center text-gray-400 text-xs mb-2 flex-wrap gap-2">
            {job.posted_date && <><Calendar className="w-3 h-3 mr-1.5" /> <span>Posted: {safeRender(job.posted_date)}</span></>}
            {job.application_deadline && <><Calendar className="w-3 h-3 mr-1.5" /> <span>Deadline: {safeRender(job.application_deadline)}</span></>}
            {job.created_at && <><Clock className="w-3 h-3 mr-1.5" /> <span>Created: {safeRender(job.created_at)}</span></>}
          </div>

          {(job.salary_range || job.pay || job.in_hand_salary) && (
            <div className="flex items-center text-green-400 text-xs mb-3 gap-3">
              {(job.salary_range || job.pay) && (
                <><DollarSign className="w-3 h-3 mr-1.5" />
                <span>{safeRender(job.salary_range || job.pay)}</span></>
              )}
              {job.in_hand_salary && (
                <span className="ml-2">In-hand: {safeRender(job.in_hand_salary)}</span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            {job.industry && (
              <span className="text-xs text-purple-400 px-2 py-1 bg-purple-900/30 rounded-full">
                {safeRender(job.industry)}
              </span>
            )}
            {job.employment_type && (
              <span className="text-xs text-blue-400 px-2 py-1 bg-blue-900/30 rounded-full">
                {safeRender(job.employment_type)}
              </span>
            )}
            {job.experience_required && (
              <span className="text-xs text-orange-400 px-2 py-1 bg-orange-900/30 rounded-full">
                {safeRender(job.experience_required)} months exp
              </span>
            )}
          </div>

          {job.tags && Array.isArray(job.tags) && job.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {job.tags.slice(0, 6).map((tag, tagIdx) => (
                <span key={tagIdx} className="text-xs text-cyan-200 px-2 py-1 bg-cyan-800/30 rounded-full">
                  {tag}
                </span>
              ))}
              {job.tags.length > 6 && (
                <span className="text-xs text-gray-400 px-2 py-1 bg-gray-700/30 rounded-full">
                  +{job.tags.length - 6} more
                </span>
              )}
            </div>
          )}

          {job.skills_required && Array.isArray(job.skills_required) && job.skills_required.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1.5">
                {job.skills_required.slice(0, 5).map((skill: string, skillIndex: number) => (
                  <span key={skillIndex} className="text-xs text-indigo-400 px-2 py-1 bg-indigo-900/40 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-gray-300 text-xs mb-4 line-clamp-3">{safeRender(job.description)}</p>

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {job.apply_url ? (
                <a
                  href={job.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs px-4 py-1.5 rounded-full transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  Apply Now
                </a>
              ) : job.company_contact ? (
                <span className="bg-blue-900/30 text-blue-300 px-3 py-1.5 rounded-full text-xs">
                  Contact: {safeRender(job.company_contact)}
                </span>
              ) : null}
              {job.source && (
                <span className="text-xs text-gray-500 px-3 py-1.5 bg-gray-700/50 rounded-full">
                  via {safeRender(job.source)}
                </span>
              )}
            </div>
            {job.debug_info && (
              <span className="text-xs text-gray-600 max-w-xs truncate" title={safeRender(job.debug_info)}>
                🔍
              </span>
            )}
          </div>
        </div>
      ))}
      {compact && jobs.length > 3 && !showAll && (
        <button 
          onClick={() => setShowAll(true)} 
          className="w-full text-center text-cyan-400 text-xs py-2 hover:bg-gray-800/50 rounded-lg transition-colors"
        >
          + {jobs.length - 3} more jobs...
        </button>
      )}
    </div>
  );
};

// Scheme Renderer Component
export const SchemeRenderer: React.FC<{ schemes: Scheme[]; compact?: boolean }> = ({ schemes, compact = true }) => {
  const { t } = useTranslation('schemes');

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-purple-400 mb-3">🏛️ {t('government_schemes', 'Government Schemes')}</h3>
      {schemes.slice(0, compact ? 3 : schemes.length).map((scheme, index) => (
        <div key={index} className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg p-4 border border-purple-700/50">
          <h4 className="font-semibold text-white text-sm mb-2">{safeRender(scheme.name)}</h4>
          <p className="text-gray-300 text-xs mb-3 line-clamp-2">{safeRender(scheme.description)}</p>
          {scheme.benefits && (
            <div className="mb-2">
              <span className="text-green-400 text-xs font-medium">Benefits: </span>
              <span className="text-gray-300 text-xs">{safeRender(scheme.benefits)}</span>
            </div>
          )}
          {scheme.eligibility && (
            <div className="mb-3">
              <span className="text-yellow-400 text-xs font-medium">Eligibility: </span>
              <span className="text-gray-300 text-xs">{safeRender(scheme.eligibility)}</span>
            </div>
          )}
          <div className="flex gap-2">
            {scheme.website && (
              <a
                href={scheme.website}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1 rounded transition-colors flex items-center"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Apply
              </a>
            )}
          </div>
        </div>
      ))}
      {compact && schemes.length > 3 && (
        <p className="text-gray-400 text-xs text-center">+ {schemes.length - 3} more schemes available</p>
      )}
    </div>
  );
};

// Business Suggestion Renderer Component
export const BusinessSuggestionRenderer: React.FC<{ suggestions: BusinessSuggestion[]; compact?: boolean }> = ({ suggestions, compact = true }) => {
  const { t } = useTranslation('business-suggestions');

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-blue-400 mb-3">💡 {t('business_suggestions', 'Business Suggestions')}</h3>
      {suggestions.slice(0, compact ? 2 : suggestions.length).map((suggestion, index) => (
        <div key={index} className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-lg p-4 border border-blue-700/50">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-white text-sm">{safeRender(suggestion.idea_name)}</h4>
            <span className="text-xs text-blue-400 px-2 py-1 bg-blue-900/30 rounded">{safeRender(suggestion.business_type)}</span>
          </div>
          
          {suggestion.total_estimated_cost && (
            <div className="flex items-center text-green-400 text-xs mb-2">
              <DollarSign className="w-3 h-3 mr-1" />
              <span>{safeRender(suggestion.total_estimated_cost)}</span>
            </div>
          )}
          
          <p className="text-gray-300 text-xs mb-3">{safeRender(suggestion.why_it_suits)}</p>
          
          {suggestion.required_resources && suggestion.required_resources.length > 0 && (
            <div className="mb-2">
              <span className="text-yellow-400 text-xs font-medium">Resources: </span>
              <span className="text-gray-300 text-xs">{safeRender(suggestion.required_resources.slice(0, 3))}</span>
              {suggestion.required_resources.length > 3 && <span className="text-gray-400 text-xs">...</span>}
            </div>
          )}
          
          {suggestion.difficulty_level && (
            <div className="flex items-center text-orange-400 text-xs mb-2">
              <Star className="w-3 h-3 mr-1" />
              <span>Difficulty: {suggestion.difficulty_level}</span>
            </div>
          )}
          
          <div className="flex gap-2 mt-3">
            <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded transition-colors">
              View Details
            </button>
          </div>
        </div>
      ))}
      {compact && suggestions.length > 2 && (
        <p className="text-gray-400 text-xs text-center">+ {suggestions.length - 2} more suggestions available</p>
      )}
    </div>
  );
};

// Course Renderer Component
export const CourseRenderer: React.FC<{ courses: UpdatedCourse[]; compact?: boolean }> = ({ courses, compact = true }) => {
  const { t } = useTranslation('courses');
  const [showAll, setShowAll] = React.useState(!compact);

  const displayedCourses = showAll ? courses : courses.slice(0, 3);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-green-400 mb-3">📚 {t('recommended_courses', 'Recommended Courses')}</h3>
      {displayedCourses.map((course) => (
        <div key={course.id} className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 rounded-lg p-4 border border-green-700/50">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-white text-sm line-clamp-1">{course.name}</h4>
            {course.skill_level && (
              <span className="text-xs text-emerald-400 px-2 py-1 bg-emerald-900/30 rounded-full">{course.skill_level}</span>
            )}
          </div>

          <div className="text-gray-400 text-xs mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            {course.provider && (
              <span className="flex items-center">
                <Users className="w-3 h-3 mr-1" />
                {course.provider}
              </span>
            )}
            {course.duration && (
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {course.duration}
              </span>
            )}
            {course.category && (
              <span className="text-xs text-green-300 px-2 py-0.5 bg-green-900/30 rounded">{course.category}</span>
            )}
          </div>

          <p className="text-gray-300 text-xs mb-3 line-clamp-3">{course.description}</p>

          {course.tags && course.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {course.tags.slice(0, 4).map((tag, tagIdx) => (
                <span key={tagIdx} className="text-xs text-green-200 px-2 py-1 bg-green-800/30 rounded-full">
                  {tag}
                </span>
              ))}
              {course.tags.length > 4 && (
                <span className="text-xs text-gray-400 px-2 py-1 bg-gray-700/30 rounded-full">
                  +{course.tags.length - 4} more
                </span>
              )}
            </div>
          )}

          <div className="flex justify-between items-center">
            <a
              href={course.link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded transition-colors flex items-center w-fit"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View Course
            </a>
            {course.source && (
              <span className="text-gray-500 text-xs italic">via {course.source}</span>
            )}
          </div>
        </div>
      ))}
      {compact && courses.length > 3 && !showAll && (
        <button 
          onClick={() => setShowAll(true)} 
          className="w-full text-center text-green-400 text-xs py-2 hover:bg-gray-800/50 rounded-lg transition-colors"
        >
          + {courses.length - 3} more courses...
        </button>
      )}
    </div>
  );
};

// Tutorial Renderer Component
export const TutorialRenderer: React.FC<{ tutorials: any[]; compact?: boolean }> = ({ tutorials, compact = true }) => {
  const { t } = useTranslation('skill-builder');

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-orange-400 mb-3">🎯 {t('skill_tutorials', 'Skill Tutorials')}</h3>
      {tutorials.slice(0, compact ? 3 : tutorials.length).map((tutorial, index) => (
        <div key={index} className="bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-lg p-4 border border-orange-700/50">
          <h4 className="font-semibold text-white text-sm mb-2">{safeRender(tutorial.title || `Tutorial ${index + 1}`)}</h4>
          <p className="text-gray-300 text-xs mb-3 line-clamp-2">{safeRender(tutorial.description || tutorial.content)}</p>
          
          <div className="flex gap-2">
            {tutorial.url && (
              <a
                href={tutorial.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1 rounded transition-colors flex items-center"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Start Learning
              </a>
            )}
          </div>
        </div>
      ))}
      {compact && tutorials.length > 3 && (
        <p className="text-gray-400 text-xs text-center">+ {tutorials.length - 3} more tutorials available</p>
      )}
    </div>
  );
};

// General Response Renderer
export const GeneralRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <p className="text-gray-300 text-sm">{content}</p>
    </div>
  );
};

// Event Renderer Component
export const EventRenderer: React.FC<{ events: Event[]; compact?: boolean }> = ({ events, compact = true }) => {
  const { t } = useTranslation('events');

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-cyan-400 mb-3">🎉 {t('upcoming_events', 'Upcoming Events')}</h3>
      {events.slice(0, compact ? 3 : events.length).map((event, index) => (
        <div key={index} className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 rounded-lg p-4 border border-cyan-700/50">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-white text-sm">{safeRender(event.title)}</h4>
            <span className="text-xs text-cyan-400 px-2 py-1 bg-cyan-900/30 rounded">{safeRender(event.type)}</span>
          </div>
          
          <div className="flex items-center text-gray-400 text-xs mb-2">
            <Calendar className="w-3 h-3 mr-1" />
            <span className="mr-3">{safeRender(event.date)}</span>
            <MapPin className="w-3 h-3 mr-1" />
            <span>{safeRender(event.location)}</span>
          </div>
          
          {event.organizer && (
            <div className="flex items-center text-gray-400 text-xs mb-2">
              <Users className="w-3 h-3 mr-1" />
              <span>{safeRender(event.organizer)}</span>
            </div>
          )}
          
          <p className="text-gray-300 text-xs mb-3 line-clamp-2">{safeRender(event.description)}</p>
          
          {event.registration_link && (
            <a
              href={event.registration_link}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs px-3 py-1 rounded transition-colors flex items-center w-fit"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Register
            </a>
          )}
        </div>
      ))}
      {compact && events.length > 3 && (
        <p className="text-gray-400 text-xs text-center">+ {events.length - 3} more events available</p>
      )}
    </div>
  );
};

// Project Renderer Component
export const ProjectRenderer: React.FC<{ projects: Project[]; compact?: boolean }> = ({ projects, compact = true }) => {
  const { t } = useTranslation('projects');

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-orange-400 mb-3">🚀 {t('featured_projects', 'Featured Projects')}</h3>
      {projects.slice(0, compact ? 3 : projects.length).map((project, index) => (
        <div key={index} className="bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-lg p-4 border border-orange-700/50">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-white text-sm">{safeRender(project.title)}</h4>
            <span className="text-xs text-orange-400 px-2 py-1 bg-orange-900/30 rounded">{safeRender(project.status)}</span>
          </div>
          
          <div className="flex items-center text-gray-400 text-xs mb-2">
            <Users className="w-3 h-3 mr-1" />
            <span>{safeRender(project.creator)}</span>
          </div>
          
          {project.investment_needed && (
            <div className="flex items-center text-green-400 text-xs mb-2">
              <DollarSign className="w-3 h-3 mr-1" />
              <span>Investment: {safeRender(project.investment_needed)}</span>
            </div>
          )}
          
          <p className="text-gray-300 text-xs mb-3 line-clamp-2">{safeRender(project.description)}</p>
          
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {project.tags.slice(0, 3).map((tag, tagIdx) => (
                <span key={tagIdx} className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded">
                  {safeRender(tag)}
                </span>
              ))}
            </div>
          )}
          
          <button className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1 rounded transition-colors">
            View Details
          </button>
        </div>
      ))}
      {compact && projects.length > 3 && (
        <p className="text-gray-400 text-xs text-center">+ {projects.length - 3} more projects available</p>
      )}
    </div>
  );
};

// YouTube Summary Renderer Component
export const YoutubeSummaryRenderer: React.FC<{ summaries: YoutubeSummary[]; compact?: boolean }> = ({ summaries, compact = true }) => {
  const { t } = useTranslation('youtube-summary');

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-red-400 mb-3">📺 {t('video_summaries', 'Video Summaries')}</h3>
      {summaries.slice(0, compact ? 2 : summaries.length).map((summary, index) => (
        <div key={index} className="bg-gradient-to-r from-red-900/20 to-pink-900/20 rounded-lg p-4 border border-red-700/50">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-white text-sm line-clamp-1">{safeRender(summary.title)}</h4>
            {summary.duration && (
              <div className="flex items-center text-red-400 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                <span>{safeRender(summary.duration)}</span>
              </div>
            )}
          </div>
          
          <p className="text-gray-300 text-xs mb-3 line-clamp-3">{safeRender(summary.summary)}</p>
          
          {summary.key_points && summary.key_points.length > 0 && (
            <div className="mb-3">
              <span className="text-yellow-400 text-xs font-medium">Key Points:</span>
              <ul className="mt-1 space-y-1">
                {summary.key_points.slice(0, 3).map((point, pointIdx) => (
                  <li key={pointIdx} className="text-gray-300 text-xs">• {safeRender(point)}</li>
                ))}
              </ul>
            </div>
          )}
          
          {summary.url && (
            <a
              href={summary.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded transition-colors flex items-center w-fit"
            >
              <Play className="w-3 h-3 mr-1" />
              Watch Video
            </a>
          )}
        </div>
      ))}
      {compact && summaries.length > 2 && (
        <p className="text-gray-400 text-xs text-center">+ {summaries.length - 2} more summaries available</p>
      )}
    </div>
  );
};

// Profile/Dashboard Renderer Component
export const ProfileRenderer: React.FC<{ profile: ProfileData; compact?: boolean }> = ({ profile, compact = true }) => {
  const { t } = useTranslation('profile');

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-purple-400 mb-3">👤 {t('profile_overview', 'Profile Overview')}</h3>
      <div className="bg-gradient-to-r from-purple-900/20 to-indigo-900/20 rounded-lg p-4 border border-purple-700/50">
        <h4 className="font-semibold text-white text-sm mb-2">{safeRender(profile.name)}</h4>
        
        <div className="mb-3">
          <span className="text-purple-400 text-xs font-medium">Experience: </span>
          <span className="text-gray-300 text-xs">{safeRender(profile.experience)}</span>
        </div>
        
        <div className="mb-3">
          <span className="text-purple-400 text-xs font-medium">Goals: </span>
          <span className="text-gray-300 text-xs">{safeRender(profile.goals)}</span>
        </div>
        
        {profile.skills && profile.skills.length > 0 && (
          <div className="mb-3">
            <span className="text-purple-400 text-xs font-medium">Skills: </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {profile.skills.slice(0, compact ? 4 : profile.skills.length).map((skill, skillIdx) => (
                <span key={skillIdx} className="text-xs px-2 py-1 bg-purple-800/30 text-purple-300 rounded">
                  {safeRender(skill)}
                </span>
              ))}
              {compact && profile.skills.length > 4 && (
                <span className="text-xs px-2 py-1 bg-gray-700 text-gray-400 rounded">
                  +{profile.skills.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
        
        {profile.achievements && profile.achievements.length > 0 && (
          <div className="mb-3">
            <span className="text-purple-400 text-xs font-medium">Recent Achievements: </span>
            <ul className="mt-1 space-y-1">
              {profile.achievements.slice(0, compact ? 2 : profile.achievements.length).map((achievement, achIdx) => (
                <li key={achIdx} className="text-gray-300 text-xs flex items-start">
                  <Award className="w-3 h-3 mr-1 mt-0.5 text-yellow-400 flex-shrink-0" />
                  {safeRender(achievement)}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <button className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1 rounded transition-colors">
          View Full Profile
        </button>
      </div>
    </div>
  );
};