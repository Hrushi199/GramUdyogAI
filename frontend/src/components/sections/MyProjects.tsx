import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Award, Users, TrendingUp, MapPin, Calendar, 
  Building2, Eye, Share2, ExternalLink,
  Activity, Heart, Search,
  User, Crown
} from 'lucide-react';
import type { Testimonial, Award as AwardType } from '../../lib/api';

interface TeamMember {
  id: number;
  user_id: number | null;
  name: string;
  role: string;
  skills: string[];
  joined_at: string;
  user_type?: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  category: string;
  event_name: string;
  event_type: string;
  team_members: TeamMember[];
  technologies: string[];
  impact_metrics: {
    people_impacted: number;
    revenue_generated: number;
    jobs_created: number;
    social_impact_score: number;
    sustainability_score: number;
  };
  funding_status: 'seeking' | 'funded' | 'self_sustaining';
  funding_amount?: number;
  funding_goal?: number;
  location: string;
  state: string;
  created_at: string;
  completed_at: string;
  status: 'active' | 'completed' | 'scaled';
  media: {
    images: string[];
    videos: string[];
    demo_url?: string;
    github_url?: string;
  };
  testimonials: Testimonial[];
  awards: AwardType[];
  tags: string[];
  user_role?: string; // User's role in this project
}

const MyProjects: React.FC = () => {
  const { t } = useTranslation('myprojects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterFunding, setFilterFunding] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  // Get user ID from localStorage (assuming it's stored there after login)
  const getUserId = () => {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.id || 1; // Default to user ID 1 for demo
    }
    // Fallback to user_id from localStorage (from auth)
    const userId = localStorage.getItem('user_id');
    return userId ? parseInt(userId) : 1; // Default to user ID 1 for demo
  };

  useEffect(() => {
    fetchMyProjects();
  }, []);

  const fetchMyProjects = async () => {
    try {
      setLoading(true);
      const userId = getUserId();
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/projects`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        console.error('Error fetching projects:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedProjects = projects
    .filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.technologies.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || project.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
      const matchesFunding = filterFunding === 'all' || project.funding_status === filterFunding;
      return matchesSearch && matchesCategory && matchesStatus && matchesFunding;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'impact':
          return b.impact_metrics.social_impact_score - a.impact_metrics.social_impact_score;
        case 'funding':
          return (b.funding_amount || 0) - (a.funding_amount || 0);
        case 'people':
          return b.impact_metrics.people_impacted - a.impact_metrics.people_impacted;
        default:
          return 0;
      }
    });

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'AI/ML': 'bg-purple-100 text-purple-800',
      'Web Development': 'bg-blue-100 text-blue-800',
      'Mobile App': 'bg-green-100 text-green-800',
      'IoT': 'bg-orange-100 text-orange-800',
      'Blockchain': 'bg-yellow-100 text-yellow-800',
      'Healthcare': 'bg-red-100 text-red-800',
      'Education': 'bg-indigo-100 text-indigo-800',
      'Agriculture': 'bg-emerald-100 text-emerald-800',
      'Finance': 'bg-cyan-100 text-cyan-800',
      'Social Impact': 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-blue-100 text-blue-800',
      'scaled': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getFundingColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'seeking': 'bg-yellow-100 text-yellow-800',
      'funded': 'bg-green-100 text-green-800',
      'self_sustaining': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-lg text-white">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0">
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(38,38,38,0.3)_1px,transparent_1px)] bg-[length:24px_24px]"></div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20 z-10"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600 rounded-full filter blur-[128px] opacity-20 z-0"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600 rounded-full filter blur-[128px] opacity-20 z-0"></div>
      <div className="relative z-20 container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">{t('title')}</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Award className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-sm font-medium text-gray-400">{t('stats.totalProjects')}</p>
                  <p className="text-2xl font-bold text-white">{projects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-gray-400">{t('stats.peopleImpacted')}</p>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(projects.reduce((sum, p) => sum + p.impact_metrics.people_impacted, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-gray-400">{t('stats.jobsCreated')}</p>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(projects.reduce((sum, p) => sum + p.impact_metrics.jobs_created, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Heart className="h-8 w-8 text-pink-400" />
                <div>
                  <p className="text-sm font-medium text-gray-400">{t('stats.avgImpactScore')}</p>
                  <p className="text-2xl font-bold text-white">
                    {projects.length > 0 
                      ? Math.round(projects.reduce((sum, p) => sum + p.impact_metrics.social_impact_score, 0) / projects.length)
                      : 0}/100
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder={t('search.placeholder')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white"
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
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white"
              >
                <option value="all">{t('search.allStatus')}</option>
                <option value="active">{t('status.active')}</option>
                <option value="completed">{t('status.completed')}</option>
                <option value="scaled">{t('status.scaled')}</option>
              </select>
              <select
                value={filterFunding}
                onChange={(e) => setFilterFunding(e.target.value)}
                className="px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white"
              >
                <option value="all">{t('search.allFunding')}</option>
                <option value="seeking">{t('funding.seeking')}</option>
                <option value="funded">{t('funding.funded')}</option>
                <option value="self_sustaining">{t('funding.self_sustaining')}</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white"
              >
                <option value="recent">{t('search.sortBy.recent')}</option>
                <option value="impact">{t('search.sortBy.impact')}</option>
                <option value="funding">{t('search.sortBy.funding')}</option>
                <option value="people">{t('search.sortBy.people')}</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
        {filteredAndSortedProjects.length === 0 ? (
          <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50">
            <CardContent className="p-12 text-center">
              <div className="mb-4">
                <Activity className="h-16 w-16 text-gray-400 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t('noProjects.title')}</h3>
              <p className="text-gray-400 mb-6">
                {t('noProjects.message')}
              </p>
              <div className="flex justify-center space-x-4">
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition">
                  {t('noProjects.browseEvents')}
                </button>
                <button className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-teal-700 transition">
                  {t('noProjects.viewAllProjects')}
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedProjects.map((project) => (
              <Card key={project.id} className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50 hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-white mb-2">
                        {project.title}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getCategoryColor(project.category)}>
                          {project.category}
                        </Badge>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                        <Badge className={getFundingColor(project.funding_status)}>
                          {project.funding_status.replace('_', ' ')}
                        </Badge>
                      </div>
                      {/* User's Role Badge */}
                      {project.user_role && (
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                            <User className="h-3 w-3 mr-1" />
                            {project.user_role}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProject(project);
                        }}
                        className="p-2 text-gray-500 hover:text-blue-600 transition"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Share functionality
                        }}
                        className="p-2 text-gray-500 hover:text-blue-600 transition"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                    {project.description}
                  </p>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Building2 className="h-4 w-4" />
                      <span>{project.event_name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span>{project.location}, {project.state}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Users className="h-4 w-4" />
                      <span>{t('projectCard.teamMembers', { count: project.team_members.length })}</span>
                    </div>
                  </div>
                  
                  {/* Impact Metrics */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-2 bg-blue-900/40 rounded-lg">
                      <div className="text-lg font-bold text-blue-300">
                        {formatNumber(project.impact_metrics.people_impacted)}
                      </div>
                      <div className="text-xs text-blue-200">{t('projectCard.peopleImpacted')}</div>
                    </div>
                    <div className="text-center p-2 bg-purple-900/40 rounded-lg">
                      <div className="text-lg font-bold text-purple-300">
                        {project.impact_metrics.social_impact_score}/100
                      </div>
                      <div className="text-xs text-purple-200">{t('projectCard.impactScore')}</div>
                    </div>
                  </div>
                  
                  {/* Technologies */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {project.technologies.slice(0, 3).map((tech, idx) => (
                      <Badge key={idx} className="bg-gradient-to-r from-purple-700 to-blue-700 text-white text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {project.technologies.length > 3 && (
                      <Badge className="bg-gray-700 text-white text-xs">
                        {t('projectCard.moretech', { count: project.technologies.length - 3 })}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Funding Progress */}
                  {project.funding_status === 'seeking' && project.funding_goal && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>{t('projectCard.fundingProgress')}</span>
                        <span>{formatCurrency(project.funding_amount || 0)} / {formatCurrency(project.funding_goal)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(((project.funding_amount || 0) / project.funding_goal) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Awards */}
                  {project.awards.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Award className="h-4 w-4" />
                      <span>{t('projectCard.awards', { count: project.awards.length })}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Project Detail Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <h2 className="text-3xl font-bold text-white">{selectedProject.title}</h2>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-white">{t('modal.description')}</h3>
                      <p className="text-gray-300">{selectedProject.description}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-white">{t('modal.team')}</h3>
                      <div className="space-y-3">
                        {selectedProject.team_members.map((member) => (
                          <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {member.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-white">{member.name}</span>
                                {member.user_id && (
                                  <Badge className="bg-green-900/50 text-green-300 border-green-700">
                                    <User className="h-3 w-3 mr-1" />
                                    {t('modal.realUser')}
                                  </Badge>
                                )}
                                {member.user_id === getUserId() && (
                                  <Badge className="bg-purple-900/50 text-purple-300 border-purple-700">
                                    <Crown className="h-3 w-3 mr-1" />
                                    {t('modal.you')}
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-400">{member.role}</div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {member.skills.slice(0, 3).map((skill, index) => (
                                  <Badge key={index} variant="outline" className="text-xs border-blue-700 text-blue-300">
                                    {skill}
                                  </Badge>
                                ))}
                                {member.skills.length > 3 && (
                                  <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                                    +{member.skills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-white">{t('modal.technologiesUsed')}</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.technologies.map((tech, index) => (
                          <Badge key={index} className="bg-blue-100 text-blue-800">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Impact Metrics */}
                    <Card className="bg-gray-800/50 border border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">{t('modal.impactMetrics')}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">{t('modal.peopleImpacted')}</span>
                          <span className="font-semibold text-white">{formatNumber(selectedProject.impact_metrics.people_impacted)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">{t('modal.revenueGenerated')}</span>
                          <span className="font-semibold text-white">{formatCurrency(selectedProject.impact_metrics.revenue_generated)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">{t('modal.jobsCreated')}</span>
                          <span className="font-semibold text-white">{selectedProject.impact_metrics.jobs_created}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">{t('modal.socialImpactScore')}</span>
                          <span className="font-semibold text-white">{selectedProject.impact_metrics.social_impact_score}/100</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">{t('modal.sustainabilityScore')}</span>
                          <span className="font-semibold text-white">{selectedProject.impact_metrics.sustainability_score}/100</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Project Details */}
                    <Card className="bg-gray-800/50 border border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">{t('modal.projectDetails')}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">{t('modal.created')} {new Date(selectedProject.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">{selectedProject.location}, {selectedProject.state}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-300">{selectedProject.event_name}</span>
                        </div>
                        {selectedProject.user_role && (
                          <div className="flex items-center space-x-2 text-sm">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-300">{t('modal.yourRole')} {selectedProject.user_role}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Actions */}
                    <Card className="bg-gray-800/50 border border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white">{t('modal.actions')}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedProject.media.demo_url && (
                          <a
                            href={selectedProject.media.demo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>{t('modal.viewDemo')}</span>
                          </a>
                        )}
                        
                        {selectedProject.media.github_url && (
                          <a
                            href={selectedProject.media.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-900 transition flex items-center justify-center space-x-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span>{t('modal.viewCode')}</span>
                          </a>
                        )}
                        
                        {selectedProject.funding_status === 'seeking' && (
                          <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition">
                            {t('modal.investInProject')}
                          </button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProjects;