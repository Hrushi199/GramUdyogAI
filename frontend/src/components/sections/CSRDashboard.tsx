import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import ParticleBackground from "../ui/ParticleBackground";
import { 
  Building2, Users, DollarSign, Target, TrendingUp, 
  Award, MapPin, Calendar, Activity, Search, BarChart3,
  PieChart, LineChart, Globe, Heart, Star, Zap
} from 'lucide-react';
import { csrCourseAPI } from '../../lib/api';

interface Company {
  id: number;
  company_name: string;
  industry: string;
  csr_rating: number;
  total_employees: number;
  csr_budget_annual: number;
  csr_focus_areas: string[];
}

interface CSREventImpactMetrics {
  participants_target?: number;
  skills_developed?: number;
  projects_created?: number;
  employment_generated?: number;
  revenue_generated?: number;
  social_impact_score?: number;
  sustainability_score?: number;
  [key: string]: number | undefined;
}

interface CSREvent {
  id: number;
  company_name: string;
  event_title: string;
  event_type: string;
  location: string;
  state: string;
  beneficiaries_count: number;
  budget_allocated: number;
  budget_spent: number;
  start_date: string;
  end_date: string;
  impact_metrics: CSREventImpactMetrics;
}

interface DashboardMetrics {
  company_id: number;
  company_name: string;
  total_events: number;
  total_beneficiaries: number;
  total_budget_allocated: number;
  total_budget_spent: number;
  budget_efficiency: number;
  average_impact_score: number;
  events_by_type: { [key: string]: number };
  geographical_reach: { [key: string]: number };
  sustainability_score: number;
  community_feedback_score: number;
}

const CSRDashboard: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [companyEvents, setCompanyEvents] = useState<CSREvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const API_BASE = 'http://localhost:8000/api/csr';

  const initializeDashboard = useCallback(async () => {
    try {
      setLoading(true);
      if (!initialized) {
        await csrCourseAPI.initializeDashboard();
        setInitialized(true);
      }
      await fetchCompanies();
    } catch (error) {
      console.error('Error initializing dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [initialized]);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    initializeDashboard();
    return () => clearTimeout(timer);
  }, [initializeDashboard]);

  const fetchCompanies = async () => {
    try {
      const response = await csrCourseAPI.getCompanies();
      if (response.data) {
        setCompanies(response.data);
        if (response.data.length > 0) {
          setSelectedCompany(response.data[0]);
          await fetchCompanyMetrics(response.data[0].id);
          await fetchCompanyEvents(response.data[0].id);
        }
      } else if (response.error) {
        console.error('Error fetching companies:', response.error);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchCompanyMetrics = async (companyId: number) => {
    try {
      const response = await csrCourseAPI.getCompanyMetrics(companyId);
      if (response.data) {
        setDashboardMetrics(response.data);
      } else if (response.error) {
        console.error('Error fetching company metrics:', response.error);
      }
    } catch (error) {
      console.error('Error fetching company metrics:', error);
    }
  };

  const fetchCompanyEvents = async (companyId: number) => {
    try {
      const response = await csrCourseAPI.getCompanyEvents(companyId, 10);
      if (response.data) {
        setCompanyEvents(response.data);
      } else if (response.error) {
        console.error('Error fetching company events:', response.error);
      }
    } catch (error) {
      console.error('Error fetching company events:', error);
    }
  };

  const handleCompanySelect = async (company: Company) => {
    setSelectedCompany(company);
    setLoading(true);
    try {
      await fetchCompanyMetrics(company.id);
      await fetchCompanyEvents(company.id);
    } finally {
      setLoading(false);
    }
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

  const getEventTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      education: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      healthcare: 'bg-red-500/20 text-red-300 border-red-500/50',
      environment: 'bg-green-500/20 text-green-300 border-green-500/50',
      skill_development: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
      rural_development: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
      women_empowerment: 'bg-pink-500/20 text-pink-300 border-pink-500/50',
      digital_literacy: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50',
      poverty_alleviation: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
    };
    return colors[type] || 'bg-gray-500/20 text-gray-300 border-gray-500/50';
  };

  if (loading && !initialized) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <ParticleBackground />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20 z-10"></div>
        <div className="relative z-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
            <p className="mt-4 text-lg text-white">Initializing CSR Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticleBackground />
      
      {/* Background gradients */}
      <div className="absolute inset-0 z-0">
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(38,38,38,0.3)_1px,transparent_1px)] bg-[length:24px_24px]"></div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20 z-10"></div>

      <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600 rounded-full filter blur-[128px] opacity-20 z-0"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600 rounded-full filter blur-[128px] opacity-20 z-0"></div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 py-16">
        <div className={`transform transition-all duration-1000 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-6">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                CSR Impact Dashboard
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Corporate Social Responsibility Metrics & Analytics - Track your company's social impact and community development initiatives
            </p>
          </div>

          {/* Search and Company Selector */}
          <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 mb-8">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Building2 className="w-6 h-6 mr-3 text-purple-400" />
                  Select Company
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {companies.map((company) => (
                    <div
                      key={company.id}
                      onClick={() => handleCompanySelect(company)}
                      className={`p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                        selectedCompany?.id === company.id
                          ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 border-2 border-purple-500/50'
                          : 'bg-gray-800/50 border border-gray-600 hover:border-purple-500/50'
                      }`}
                    >
                      <h3 className="font-semibold text-white mb-2">{company.company_name}</h3>
                      <p className="text-sm text-gray-400 mb-2">{company.industry}</p>
                      <div className="flex items-center justify-between">
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                          {company.csr_rating}/5
                        </Badge>
                        <span className="text-xs text-gray-400">{formatNumber(company.total_employees)} employees</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search events..."
                  className="pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {dashboardMetrics && (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-300 text-sm font-medium">Total Events</p>
                      <p className="text-3xl font-bold text-white">{formatNumber(dashboardMetrics.total_events)}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-300 text-sm font-medium">Beneficiaries</p>
                      <p className="text-3xl font-bold text-white">{formatNumber(dashboardMetrics.total_beneficiaries)}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-300 text-sm font-medium">Budget Allocated</p>
                      <p className="text-3xl font-bold text-white">{formatCurrency(dashboardMetrics.total_budget_allocated)}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 backdrop-blur-sm border border-orange-500/30 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-300 text-sm font-medium">Impact Score</p>
                      <p className="text-3xl font-bold text-white">{dashboardMetrics.average_impact_score}/100</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-orange-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Analytics */}
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-gray-800/50 border border-gray-600 rounded-lg p-1">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="events" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                    <Calendar className="w-4 h-4 mr-2" />
                    Events
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                    <PieChart className="w-4 h-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Budget Efficiency */}
                    <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-purple-400" />
                        Budget Efficiency
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Allocated</span>
                          <span className="text-white font-semibold">{formatCurrency(dashboardMetrics.total_budget_allocated)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Spent</span>
                          <span className="text-white font-semibold">{formatCurrency(dashboardMetrics.total_budget_spent)}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${dashboardMetrics.budget_efficiency}%` }}
                          ></div>
                        </div>
                        <div className="text-center">
                          <span className="text-purple-400 font-semibold">{dashboardMetrics.budget_efficiency}% Efficiency</span>
                        </div>
                      </div>
                    </div>

                    {/* Impact Metrics */}
                    <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <Heart className="w-5 h-5 mr-2 text-purple-400" />
                        Impact Metrics
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Sustainability Score</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < Math.floor(dashboardMetrics.sustainability_score / 20) ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Community Feedback</span>
                          <span className="text-white font-semibold">{dashboardMetrics.community_feedback_score}/10</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Average Impact</span>
                          <span className="text-white font-semibold">{dashboardMetrics.average_impact_score}/100</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="events" className="space-y-6">
                  <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-purple-400" />
                      Recent Events
                    </h3>
                    <div className="space-y-4">
                      {companyEvents.map((event) => (
                        <div key={event.id} className="bg-gray-800/30 border border-gray-600 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-white">{event.event_title}</h4>
                            <Badge className={getEventTypeColor(event.event_type)}>
                              {event.event_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center text-gray-300">
                              <MapPin className="w-4 h-4 mr-2 text-purple-400" />
                              {event.location}, {event.state}
                            </div>
                            <div className="flex items-center text-gray-300">
                              <Users className="w-4 h-4 mr-2 text-blue-400" />
                              {formatNumber(event.beneficiaries_count)} beneficiaries
                            </div>
                            <div className="flex items-center text-gray-300">
                              <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                              {formatCurrency(event.budget_spent)} spent
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Event Types Distribution */}
                    <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <PieChart className="w-5 h-5 mr-2 text-purple-400" />
                        Event Types
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(dashboardMetrics.events_by_type).map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="text-gray-300 capitalize">{type.replace('_', ' ')}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                                  style={{ width: `${(count / dashboardMetrics.total_events) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-white font-semibold">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Geographical Reach */}
                    <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                        <Globe className="w-5 h-5 mr-2 text-purple-400" />
                        Geographical Reach
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(dashboardMetrics.geographical_reach).map(([state, count]) => (
                          <div key={state} className="flex items-center justify-between">
                            <span className="text-gray-300">{state}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                                  style={{ width: `${((count as number) / Math.max(...Object.values(dashboardMetrics.geographical_reach).map(v => v as number))) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-white font-semibold">{count as number}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSRDashboard;
