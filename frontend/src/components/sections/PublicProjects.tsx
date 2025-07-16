import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Award as AwardIcon,
  Users,
  TrendingUp,
  MapPin,
  Calendar,
  Building2,
  Star,
  Eye,
  Share2,
  ExternalLink,
  Search,
  DollarSign
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import PublicProfileAvatar from '../ui/PublicProfileAvatar';
import InvestmentModal from '../ui/InvestmentModal';
import InvestmentDetails from '../ui/InvestmentDetails';

interface TeamMember {
  id: number;
  user_id: number;
  role: string;
  skills: string[];
  name: string;
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  organization: string;
  content: string;
  rating: number;
}

interface AwardEntry {
  id: number;
  name: string;
  organization: string;
  year: number;
  category: string;
}

interface MediaLinks {
  images: string[];
  videos: string[];
  demo_url?: string;
  github_url?: string;
}

interface ImpactMetrics {
  users_reached: number;
  revenue_generated: number;
}

interface Project {
  id: number;
  title: string;
  description: string;
  category: string;
  event_id: number;
  event_name: string;
  event_type: string;
  team_members: TeamMember[];
  technologies: string[];
  impact_metrics: ImpactMetrics;
  funding_status: string;
  funding_amount: number;
  funding_goal: number;
  location: string;
  state: string;
  created_by: number;
  created_at: string;
  completed_at: string | null;
  status: string;
  media: MediaLinks;
  testimonials: Testimonial[];
  awards: AwardEntry[];
  tags: string[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Utility function to get current user ID
const getCurrentUserId = (): number | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.id) {
        return parseInt(user.id);
      }
    }
  } catch (error) {
    console.error('Error getting current user ID:', error);
  }
  return null;
};

const PublicProjects: React.FC = () => {
  const { t } = useTranslation('public-projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [investmentProject, setInvestmentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterFunding, setFilterFunding] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  useEffect(() => {
    fetchProjects();
  }, [filterCategory, filterStatus, filterFunding]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterFunding !== 'all') params.append('funding_status', filterFunding);
      // You can add event_id support here if needed
      const url = `${API_BASE_URL}/api/projects?${params.toString()}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        setProjects([]);
        console.error('Error fetching projects:', response.statusText);
      }
    } catch (err) {
      setProjects([]);
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };  

  const filteredAndSortedProjects = projects
    .filter(p => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.technologies.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
      const matchesFunding = filterFunding === 'all' || p.funding_status === filterFunding;
      return matchesSearch && matchesCategory && matchesStatus && matchesFunding;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'funding':
          return (b.funding_amount || 0) - (a.funding_amount || 0);
        case 'people':
          return b.impact_metrics.users_reached - a.impact_metrics.users_reached;
        case 'impact':
          return b.impact_metrics.revenue_generated - a.impact_metrics.revenue_generated;
        default:
          return 0;
      }
    });

  const getBadgeClasses = (type: 'category' | 'status' | 'funding', value: string) => {
    const map: Record<string, string> = {
      // categories
      'AI/ML': 'bg-purple-100 text-purple-800',
      'Web Development': 'bg-blue-100 text-blue-800',
      'Mobile App': 'bg-green-100 text-green-800',
      IoT: 'bg-orange-100 text-orange-800',
      Blockchain: 'bg-yellow-100 text-yellow-800',
      Healthcare: 'bg-red-100 text-red-800',
      Education: 'bg-indigo-100 text-indigo-800',
      Agriculture: 'bg-emerald-100 text-emerald-800',
      Finance: 'bg-cyan-100 text-cyan-800',
      'Social Impact': 'bg-pink-100 text-pink-800',
      // statuses
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      scaled: 'bg-purple-100 text-purple-800',
      // funding
      seeking: 'bg-yellow-100 text-yellow-800',
      funded: 'bg-green-100 text-green-800',
      self_sustaining: 'bg-blue-100 text-blue-800',
    };
    return map[value] ?? 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amt: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amt);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat('en-IN').format(num);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600" />
          <p className="mt-4 text-lg text-white">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20">
      {/* Background decor */}
      <div className="absolute inset-0 z-0">
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(38,38,38,0.3)_1px,transparent_1px)] bg-[length:24px_24px]" />
      </div>
      <div className="relative z-20 container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">{t('title')}</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-800/30 border border-gray-700/50">
            <CardContent className="p-6 flex items-center space-x-2">
              <AwardIcon className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-sm font-medium text-gray-400">{t('stats.totalProjects')}</p>
                <p className="text-2xl font-bold text-white">{projects.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/30 border border-gray-700/50">
            <CardContent className="p-6 flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-gray-400">{t('stats.peopleImpacted')}</p>
                <p className="text-2xl font-bold text-white">
                  {formatNumber(
                    projects.reduce((sum, p) => sum + p.impact_metrics.users_reached, 0)
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/30 border border-gray-700/50">
            <CardContent className="p-6 flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-sm font-medium text-gray-400">{t('stats.totalRevenue')}</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(
                    projects.reduce((sum, p) => sum + p.impact_metrics.revenue_generated, 0)
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/30 border border-gray-700/50">
            <CardContent className="p-6 flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-orange-400" />
              <div>
                <p className="text-sm font-medium text-gray-400">{t('stats.activeProjects')}</p>
                <p className="text-2xl font-bold text-white">
                  {projects.filter(p => p.status === 'active').length}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gray-800/30 border border-gray-700/50">
          <CardContent className="p-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder={t('search.placeholder')}
                className="w-full pl-10 py-2 border border-gray-700 rounded-lg bg-gray-800/50 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-gray-700 rounded-lg bg-gray-800/50 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">{t('search.allCategories')}</option>
              <option value="AI/ML">{t('categories.ai_ml')}</option>
              <option value="Web Development">{t('categories.web_development')}</option>
              <option value="Mobile App">{t('categories.mobile_app')}</option>
              <option value="IoT">{t('categories.iot')}</option>
              <option value="Blockchain">{t('categories.blockchain')}</option>
              <option value="Healthcare">{t('categories.healthcare')}</option>
              <option value="Education">{t('categories.education')}</option>
              <option value="Agriculture">{t('categories.agriculture')}</option>
              <option value="Finance">{t('categories.finance')}</option>
              <option value="Social Impact">{t('categories.social_impact')}</option>
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-700 rounded-lg bg-gray-800/50 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">{t('search.allStatus')}</option>
              <option value="active">{t('status.active')}</option>
              <option value="completed">{t('status.completed')}</option>
              <option value="scaled">{t('status.scaled')}</option>
            </select>
            <select
              value={filterFunding}
              onChange={e => setFilterFunding(e.target.value)}
              className="px-4 py-2 border border-gray-700 rounded-lg bg-gray-800/50 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">{t('search.allFunding')}</option>
              <option value="seeking">{t('funding.seeking')}</option>
              <option value="funded">{t('funding.funded')}</option>
              <option value="self_sustaining">{t('funding.self_sustaining')}</option>
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-700 rounded-lg bg-gray-800/50 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="recent">{t('search.sortBy.recent')}</option>
              <option value="impact">{t('search.sortBy.impact')}</option>
              <option value="funding">{t('search.sortBy.funding')}</option>
              <option value="people">{t('search.sortBy.people')}</option>
            </select>
          </CardContent>
        </Card>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedProjects.map(project => (
            <Card
              key={project.id}
              className="bg-gray-800/30 border border-gray-700/50 hover:shadow-lg cursor-pointer transition-all duration-200 hover:border-purple-500/50"
              onClick={() => setSelectedProject(project)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-white mb-2">
                      {project.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mb-2 flex-wrap gap-1">
                      <Badge className={getBadgeClasses('category', project.category)}>
                        {project.category}
                      </Badge>
                      <Badge className={getBadgeClasses('status', project.status)}>
                        {project.status}
                      </Badge>
                      <Badge className={getBadgeClasses('funding', project.funding_status)}>
                        {project.funding_status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-2 text-gray-500">
                    <Eye 
                      onClick={e => { 
                        e.stopPropagation(); 
                        setSelectedProject(project); 
                      }} 
                      className="h-4 w-4 hover:text-blue-400 cursor-pointer" 
                    />
                    <Share2 
                      onClick={e => {
                        e.stopPropagation();
                        // Add share functionality here
                      }} 
                      className="h-4 w-4 hover:text-blue-400 cursor-pointer" 
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                  {project.description}
                </p>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-400 space-x-2">
                    <Building2 className="h-4 w-4" />
                    <span>{project.event_name}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400 space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {project.location}, {project.state}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-400 space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{t('projectCard.teamMembers', { count: project.team_members.length })}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center p-2 bg-blue-900/40 rounded-lg">
                    <div className="text-lg font-bold text-blue-300">
                      {formatNumber(project.impact_metrics.users_reached)}
                    </div>
                    <div className="text-xs text-blue-200">{t('projectCard.peopleImpacted')}</div>
                  </div>
                  <div className="text-center p-2 bg-green-900/40 rounded-lg">
                    <div className="text-lg font-bold text-green-300">
                      {formatCurrency(project.impact_metrics.revenue_generated)}
                    </div>
                    <div className="text-xs text-green-200">{t('projectCard.revenue')}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.slice(0, 3).map((tech, idx) => (
                    <Badge key={idx} className="bg-gray-700 text-gray-300 text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {project.technologies.length > 3 && (
                    <Badge className="bg-gray-700 text-gray-300 text-xs">
                      {t('projectCard.moretech', { count: project.technologies.length - 3 })}
                    </Badge>
                  )}
                </div>

                {project.funding_status === 'seeking' && project.funding_goal > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>{t('projectCard.fundingProgress')}</span>
                      <span>
                        {formatCurrency(project.funding_amount)} /{' '}
                        {formatCurrency(project.funding_goal)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            (project.funding_amount / project.funding_goal) * 100,
                            100
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {project.awards.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <AwardIcon className="h-4 w-4" />
                    <span>
                      {t('projectCard.awards', { count: project.awards.length })}
                    </span>
                  </div>
                )}

                {/* Investment Button */}
                {project.funding_status === 'seeking' && (
                  <div className="pt-4 border-t border-gray-700">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setInvestmentProject(project);
                      }}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
                    >
                      <DollarSign className="h-4 w-4" />
                      <span>Invest in this Project</span>
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No projects message */}
        {filteredAndSortedProjects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">{t('noProjects.message')}</div>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('all');
                setFilterStatus('all');
                setFilterFunding('all');
                setSortBy('recent');
              }}
              className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              {t('noProjects.clearFilters')}
            </button>
          </div>
        )}

        {/* Detail Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900/95 border border-gray-700 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex justify-between items-start p-6 border-b border-gray-700">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {selectedProject.title}
                  </h2>
                  <div className="flex items-center space-x-3">
                    <Badge className={getBadgeClasses('category', selectedProject.category)}>
                      {selectedProject.category}
                    </Badge>
                    <Badge className={getBadgeClasses('status', selectedProject.status)}>
                      {selectedProject.status}
                    </Badge>
                    <Badge className={getBadgeClasses('funding', selectedProject.funding_status)}>
                      {selectedProject.funding_status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800"
                >
                  ×
                </button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                  {/* Left/Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Project Description */}
                    <Card className="bg-gray-800/30 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">{t('modal.description')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 leading-relaxed">{selectedProject.description}</p>
                      </CardContent>
                    </Card>

                    {/* Team Members */}
                    <Card className="bg-gray-800/30 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">{t('modal.team')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedProject.team_members.map(member => (
                            <div
                              key={member.id}
                              className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30"
                            >
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {member.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-white">{member.name}</div>
                                <div className="text-sm text-gray-400">{member.role}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Technologies */}
                    <Card className="bg-gray-800/30 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">{t('modal.technologiesUsed')}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {selectedProject.technologies.map((tech, i) => (
                            <Badge key={i} className="bg-blue-900/50 text-blue-200 border border-blue-500/30">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Testimonials */}
                    {selectedProject.testimonials.length > 0 && (
                      <Card className="bg-gray-800/30 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-white">{t('modal.testimonials')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {selectedProject.testimonials.map(testimonial => (
                              <div
                                key={testimonial.id}
                                className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30"
                              >
                                <div className="flex items-center mb-3">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < testimonial.rating
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-600'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <p className="text-gray-300 mb-3 italic">"{testimonial.content}"</p>
                                <div className="text-sm">
                                  <span className="font-semibold text-white">{testimonial.name}</span>
                                  <span className="text-gray-400"> - {testimonial.role} at {testimonial.organization}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Awards */}
                    {selectedProject.awards.length > 0 && (
                      <Card className="bg-gray-800/30 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-white">{t('modal.awards')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {selectedProject.awards.map(award => (
                              <div key={award.id} className="flex items-center space-x-3 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                                <AwardIcon className="h-6 w-6 text-yellow-400 flex-shrink-0" />
                                <div>
                                  <div className="font-semibold text-white">{award.name}</div>
                                  <div className="text-sm text-gray-400">
                                    {award.organization} • {award.year} • {award.category}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    </div>

                  {/* Right Sidebar */}
                  <div className="space-y-6">
                    {/* Impact Metrics */}
                    <Card className="bg-gray-800/30 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5" />
                          <span>{t('modal.impactMetrics')}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center p-4 bg-blue-900/30 rounded-lg border border-blue-500/30">
                          <div className="text-2xl font-bold text-blue-300">
                            {formatNumber(selectedProject.impact_metrics.users_reached)}
                          </div>
                          <div className="text-sm text-blue-200">{t('projectCard.peopleImpacted')}</div>
                        </div>
                        <div className="text-center p-4 bg-green-900/30 rounded-lg border border-green-500/30">
                          <div className="text-2xl font-bold text-green-300">
                            {formatCurrency(selectedProject.impact_metrics.revenue_generated)}
                          </div>
                          <div className="text-sm text-green-200">{t('projectCard.revenue')}</div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Project Info */}
                    <Card className="bg-gray-800/30 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center space-x-2">
                          <Building2 className="h-5 w-5" />
                          <span>{t('modal.projectDetails')}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center space-x-3 p-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-400">Created</div>
                            <div className="text-white font-medium">
                              {new Date(selectedProject.created_at).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-400">Location</div>
                            <div className="text-white font-medium">
                              {selectedProject.location}, {selectedProject.state}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-400">Event</div>
                            <div className="text-white font-medium">{selectedProject.event_name}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-400">Team Size</div>
                            <div className="text-white font-medium">{selectedProject.team_members.length} members</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Funding Status */}
                    {selectedProject.funding_status === 'seeking' && selectedProject.funding_goal > 0 && (
                      <Card className="bg-gray-800/30 border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center space-x-2">
                            <DollarSign className="h-5 w-5" />
                            <span>{t('modal.fundingStatus')}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Goal</span>
                            <span className="font-bold text-white">
                              {formatCurrency(selectedProject.funding_goal)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Raised</span>
                            <span className="font-bold text-green-400">
                              {formatCurrency(selectedProject.funding_amount)}
                            </span>
                          </div>
                          <div>
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-400">Progress</span>
                              <span className="text-white font-medium">
                                {Math.round((selectedProject.funding_amount / selectedProject.funding_goal) * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(
                                    (selectedProject.funding_amount / selectedProject.funding_goal) * 100,
                                    100
                                  )}%`
                                }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Actions */}
                    <Card className="bg-gray-800/30 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedProject.media.demo_url && (
                          <a
                            href={selectedProject.media.demo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center space-x-2 w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>View Demo</span>
                          </a>
                        )}
                        {selectedProject.media.github_url && (
                          <a
                            href={selectedProject.media.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center space-x-2 w-full py-3 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>{t('modal.viewCode')}</span>
                          </a>
                        )}
                        <button
                          onClick={() => {
                            // Add share functionality here
                            if (navigator.share) {
                              navigator.share({
                                title: selectedProject.title,
                                text: selectedProject.description,
                                url: window.location.href
                              });
                            } else {
                              // Fallback for browsers that don't support Web Share API
                              navigator.clipboard.writeText(window.location.href);
                              toast.success(t('toasts.linkCopied'));
                            }
                          }}
                          className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center justify-center space-x-2"
                        >
                          <Share2 className="h-4 w-4" />
                          <span>{t('modal.shareProject')}</span>
                        </button>
                      </CardContent>
                    </Card>

                    {/* Investment Details */}
                    <InvestmentDetails 
                      projectId={selectedProject.id} 
                      isProjectOwner={selectedProject.created_by === getCurrentUserId()}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Investment Modal */}
        {investmentProject && (
          <InvestmentModal
            project={investmentProject}
            isOpen={!!investmentProject}
            onClose={() => setInvestmentProject(null)}
            onInvestmentSuccess={() => {
              fetchProjects(); // Refresh projects to update funding amounts
              toast.success('Investment proposal submitted successfully!');
            }}
          />
        )}
      </div>
      <Toaster
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          },
        }}
      />
    </div>
  );
};

export default PublicProjects;