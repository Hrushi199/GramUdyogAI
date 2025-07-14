import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Award, Users, TrendingUp, MapPin, Calendar, 
  Building2, Star, Eye, Share2, ExternalLink,
  Target, DollarSign, Activity, Globe, Heart, Search
} from 'lucide-react';
import { projectAPI } from '../../lib/api';

interface TeamMember {
  id: number;
  user_id: number;
  role: string;
  skills: string[];
  name: string;
}

interface Project {
  id: number;
  title: string;
  description: string;
  category: string;
  event_id: number;
  event_name: string;
  event_type: string;
  team_members: TeamMember[];  // Now properly typed
  technologies: string[];
  impact_metrics: {
    users_reached: number;
    revenue_generated: number;
  };
  funding_status: string;
  funding_amount: number;
  funding_goal: number;
  location: string;
  state: string;
  created_by: number;
  created_at: string;
  completed_at: string | null;
  status: string;
  media: {
    images: string[];
    videos: string[];
  };
  testimonials: string[];
  awards: string[];
  tags: string[];
}

interface Testimonial {
  id: number;
  name: string;
  role: string;
  organization: string;
  content: string;
  rating: number;
}

interface Award {
  id: number;
  name: string;
  organization: string;
  year: number;
  category: string;
}

const PublicProjects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterFunding, setFilterFunding] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getProjects();
      if (response.data) {
        setProjects(response.data);
      } else if (response.error) {
        console.error('Error fetching projects:', response.error);
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
        case 'funding':
          return (b.funding_amount || 0) - (a.funding_amount || 0);
        case 'people':
          return b.impact_metrics.users_reached - a.impact_metrics.users_reached;
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
          <p className="mt-4 text-lg text-white">Loading Projects...</p>
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
          <h1 className="text-4xl font-bold text-white mb-4">Public Projects</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover innovative projects created by talented individuals and teams. 
            Browse through successful implementations and find investment opportunities.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Award className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Total Projects</p>
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
                  <p className="text-sm font-medium text-gray-400">People Impacted</p>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(projects.reduce((sum, p) => sum + p.impact_metrics.users_reached, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Jobs Created</p>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(projects.reduce((sum, p) => sum + p.impact_metrics.jobs_created, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card> */}

          {/* <Card className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Heart className="h-8 w-8 text-pink-400" />
                <div>
                  <p className="text-sm font-medium text-gray-400">Social Impact</p>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(projects.reduce((sum, p) => sum + p.impact_metrics.social_impact_score, 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card> */}
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
                    placeholder="Search projects, technologies..."
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
                <option value="all">All Categories</option>
                <option value="AI/ML">AI/ML</option>
                <option value="Web Development">Web Development</option>
                <option value="Mobile App">Mobile App</option>
                <option value="IoT">IoT</option>
                <option value="Blockchain">Blockchain</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Finance">Finance</option>
                <option value="Social Impact">Social Impact</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="scaled">Scaled</option>
              </select>
              <select
                value={filterFunding}
                onChange={(e) => setFilterFunding(e.target.value)}
                className="px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white"
              >
                <option value="all">All Funding</option>
                <option value="seeking">Seeking Funding</option>
                <option value="funded">Funded</option>
                <option value="self_sustaining">Self Sustaining</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white"
              >
                <option value="recent">Most Recent</option>
                <option value="impact">Highest Impact</option>
                <option value="funding">Most Funded</option>
                <option value="people">Most People Impacted</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Projects Grid */}
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
                    <span>{project.team_members.length} team members</span>
                  </div>
                </div>
                
                {/* Impact Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center p-2 bg-blue-900/40 rounded-lg">
                    <div className="text-lg font-bold text-blue-300">
                      {formatNumber(project.impact_metrics.users_reached)}
                    </div>
                    <div className="text-xs text-blue-200">People Impacted</div>
                  </div>
                  {/* <div className="text-center p-2 bg-purple-900/40 rounded-lg">
                    <div className="text-lg font-bold text-purple-300">
                      {project.impact_metrics.social_impact_score}/100
                    </div>
                    <div className="text-xs text-purple-200">Impact Score</div>
                  </div> */}
                </div>
                
                {/* Technologies */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {project.technologies.map((tech, idx) => (
                    <Badge key={idx} variant="project">
                      {tech}
                    </Badge>
                  ))}
                </div>
                
                {/* Funding Progress */}
                {project.funding_status === 'seeking' && project.funding_goal && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Funding Progress</span>
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
                    <span>{project.awards.length} award{project.awards.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Project Detail Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gray-700/70 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
                    <h3 className="text-xl font-semibold mb-3 text-white">Description</h3>
                    <p className="text-gray-300">{selectedProject.description}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-white">Team</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedProject.team_members.map((member) => (
                        <div key={member.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold">{member.name}</div>
                            <div className="text-sm text-gray-600">{member.role}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {member.skills.slice(0, 2).map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold mb-3 text-white">Technologies Used</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProject.technologies.map((tech, index) => (
                        <Badge key={index} className="bg-blue-100 text-blue-800">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {selectedProject.testimonials.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-3 text-white">Testimonials</h3>
                      <div className="space-y-4">
                        {selectedProject.testimonials.map((testimonial) => (
                          <div key={testimonial.id} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-700 mb-2">"{testimonial.content}"</p>
                            <div className="text-sm text-gray-600">
                              <span className="font-semibold">{testimonial.name}</span>
                              <span> - {testimonial.role} at {testimonial.organization}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Impact Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Impact Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">People Impacted</span>
                        <span className="font-semibold">{formatNumber(selectedProject.impact_metrics.users_reached)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Revenue Generated</span>
                        <span className="font-semibold">{formatCurrency(selectedProject.impact_metrics.revenue_generated)}</span>
                      </div>
                      {/* <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Jobs Created</span>
                        <span className="font-semibold">{selectedProject.impact_metrics.jobs_created}</span>
                      </div> */}
                      {/* <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Social Impact Score</span>
                        <span className="font-semibold">{selectedProject.impact_metrics.social_impact_score}/100</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Sustainability Score</span>
                        <span className="font-semibold">{selectedProject.impact_metrics.sustainability_score}/100</span>
                      </div> */}
                    </CardContent>
                  </Card>
                  
                  {/* Project Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Created: {new Date(selectedProject.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{selectedProject.location}, {selectedProject.state}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span>{selectedProject.event_name}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Actions</CardTitle>
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
                          <span>View Demo</span>
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
                          <span>View Code</span>
                        </a>
                      )}
                      
                      {selectedProject.funding_status === 'seeking' && (
                        <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition">
                          Invest in Project
                        </button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProjects; 