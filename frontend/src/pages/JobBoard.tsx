import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { jobAPI, Job } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Building, MapPin, DollarSign, Search, Briefcase, Clock, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const JobCard: React.FC<{ job: Job }> = ({ job }) => {
  const { t } = useTranslation();
  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    return String(value);
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-cyan-500 transition-all duration-300 flex flex-col h-full">
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-white text-md">{safeRender(job.job_title || job.title)}</h3>
          {job.job_type && (
            <span className="text-xs text-cyan-400 px-2 py-1 bg-cyan-900/30 rounded-full">{safeRender(job.job_type)}</span>
          )}
        </div>
        <div className="flex items-center text-gray-400 text-xs mb-2">
          <Building className="w-3 h-3 mr-2" />
          <span className="mr-4">{safeRender(job.company_name || job.company)}</span>
          <MapPin className="w-3 h-3 mr-2" />
          <span>{safeRender(job.location)}</span>
        </div>
        {job.salary_range && (
          <div className="flex items-center text-green-400 text-xs mb-3">
            <DollarSign className="w-3 h-3 mr-2" />
            <span>{safeRender(job.salary_range)}</span>
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
      </div>
      <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-700/50">
        <div className="flex items-center gap-2">
          {job.apply_url && (
            <a
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs px-4 py-2 rounded-full transition-colors flex items-center"
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              {t('apply_now', 'Apply Now')}
            </a>
          )}
          {job.source && <span className="text-xs text-gray-500">via {safeRender(job.source)}</span>}
        </div>
        {job.posted_date && (
            <div className="flex items-center text-gray-500 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                <span>{new Date(job.posted_date).toLocaleDateString()}</span>
            </div>
        )}
      </div>
    </div>
  );
};

const JobBoard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useState({
    search: '',
    location: '',
    industry: '',
    job_type: '',
    experience_level: '',
    offset: 0,
    limit: 12,
    diverse: true,
  });

  const [filters, setFilters] = useState({
    industries: [] as string[],
    locations: [] as string[],
    jobTypes: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    experienceLevels: ['0', '12', '24', '60'],
  });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobAPI.getJobs(searchParams);
      if (response.data) {
        // Backend returns { jobs: [...], total_count: number } directly
        const jobsData = response.data as any;
        setJobs(jobsData.jobs || []);
        setTotalCount(jobsData.total_count || 0);
      } else {
        setJobs([]);
        setTotalCount(0);
        setError(response.error || 'No jobs found.');
      }
    } catch (err) {
      setError('Failed to fetch jobs. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [industriesRes, locationsRes] = await Promise.all([
          jobAPI.getJobIndustries(),
          jobAPI.getJobLocations(),
        ]);
        setFilters(prev => ({
          ...prev,
          industries: industriesRes.data?.map(i => i.industry) || [],
          locations: locationsRes.data?.map(l => l.location) || [],
        }));
      } catch (error) {
        console.error("Failed to fetch filters", error);
      }
    };
    fetchFilters();
  }, []);
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchParams(prev => ({ ...prev, search: e.target.value, offset: 0 }));
  };

  const handleFilterChange = (filterName: string, value: string) => {
    setSearchParams(prev => ({ ...prev, [filterName]: value, offset: 0 }));
  };

  const handlePageChange = (newOffset: number) => {
    setSearchParams(prev => ({ ...prev, offset: newOffset }));
  };

  const totalPages = Math.ceil(totalCount / searchParams.limit);
  const currentPage = Math.floor(searchParams.offset / searchParams.limit) + 1;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-white">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-cyan-400 mb-2">{t('job_board', 'Job Board')}</h1>
        <p className="text-lg text-gray-300">{t('discover_opportunities', 'Discover your next opportunity')}</p>
      </header>

      <div className="bg-gray-900/50 p-4 rounded-lg mb-8 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Input
            type="text"
            placeholder={t('search_jobs', 'Search jobs...')}
            value={searchParams.search}
            onChange={handleSearchChange}
            className="lg:col-span-2 bg-gray-800 border-gray-600 placeholder-gray-500"
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && fetchJobs()}
          />
          <Select onValueChange={(value: string) => handleFilterChange('location', value)} value={searchParams.location}>
            <SelectTrigger className="bg-gray-800 border-gray-600"><MapPin className="w-4 h-4 mr-2" />{t('location', 'Location')}</SelectTrigger>
            <SelectContent className="bg-gray-800 text-white">
              <SelectItem value="">All Locations</SelectItem>
              {filters.locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={(value: string) => handleFilterChange('industry', value)} value={searchParams.industry}>
            <SelectTrigger className="bg-gray-800 border-gray-600"><Briefcase className="w-4 h-4 mr-2" />{t('industry', 'Industry')}</SelectTrigger>
            <SelectContent className="bg-gray-800 text-white">
              <SelectItem value="">All Industries</SelectItem>
              {filters.industries.map(ind => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={fetchJobs} className="w-full bg-cyan-600 hover:bg-cyan-700">
            <Search className="w-4 h-4 mr-2" /> {t('search', 'Search')}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">{t('loading_jobs', 'Loading jobs...')}</div>
      ) : error ? (
        <div className="text-center py-10 text-red-400">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          <div className="flex justify-center items-center mt-8">
            <Button
              onClick={() => handlePageChange(searchParams.offset - searchParams.limit)}
              disabled={currentPage <= 1}
              className="mr-2"
            >
              {t('previous', 'Previous')}
            </Button>
            <span className="mx-4">
              {t('page', 'Page')} {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => handlePageChange(searchParams.offset + searchParams.limit)}
              disabled={currentPage >= totalPages}
              className="ml-2"
            >
              {t('next', 'Next')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default JobBoard;
