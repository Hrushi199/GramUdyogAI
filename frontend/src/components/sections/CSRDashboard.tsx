import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
<<<<<<< HEAD
import ParticleBackground from "../ui/ParticleBackground";
import { 
  Building2, Users, DollarSign, Target, TrendingUp, 
  Award, MapPin, Calendar, Activity, Search, BarChart3,
  PieChart, LineChart, Globe, Heart, Star, Zap
} from 'lucide-react';
import { csrCourseAPI } from '../../lib/api';
=======
import { 
  Building2, Users, DollarSign, Target, TrendingUp, 
  Award, MapPin, Calendar, Activity, Search
} from 'lucide-react';
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48

interface Company {
  id: number;
  company_name: string;
  industry: string;
  csr_rating: number;
  total_employees: number;
  csr_budget_annual: number;
  csr_focus_areas: string[];
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
  impact_metrics: any;
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
<<<<<<< HEAD
  const [loaded, setLoaded] = useState(false);
=======
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48

  const API_BASE = 'http://localhost:8000/api/csr';

  useEffect(() => {
<<<<<<< HEAD
    const timer = setTimeout(() => setLoaded(true), 100);
    initializeDashboard();
    return () => clearTimeout(timer);
=======
    initializeDashboard();
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      if (!initialized) {
<<<<<<< HEAD
        await csrCourseAPI.initializeDashboard();
=======
        await fetch(`${API_BASE}/dashboard/initialize`, {
          method: 'POST',
        });
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
        setInitialized(true);
      }
      await fetchCompanies();
    } catch (error) {
      console.error('Error initializing dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
<<<<<<< HEAD
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
=======
      const response = await fetch(`${API_BASE}/dashboard/companies`);
      const data = await response.json();
      setCompanies(data);
      if (data.length > 0) {
        setSelectedCompany(data[0]);
        await fetchCompanyMetrics(data[0].id);
        await fetchCompanyEvents(data[0].id);
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchCompanyMetrics = async (companyId: number) => {
    try {
<<<<<<< HEAD
      const response = await csrCourseAPI.getCompanyMetrics(companyId);
      if (response.data) {
        setDashboardMetrics(response.data);
      } else if (response.error) {
        console.error('Error fetching company metrics:', response.error);
      }
=======
      const response = await fetch(`${API_BASE}/dashboard/company/${companyId}/metrics`);
      const data = await response.json();
      setDashboardMetrics(data);
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
    } catch (error) {
      console.error('Error fetching company metrics:', error);
    }
  };

  const fetchCompanyEvents = async (companyId: number) => {
    try {
<<<<<<< HEAD
      const response = await csrCourseAPI.getCompanyEvents(companyId, 10);
      if (response.data) {
        setCompanyEvents(response.data);
      } else if (response.error) {
        console.error('Error fetching company events:', response.error);
      }
=======
      const response = await fetch(`${API_BASE}/dashboard/company/${companyId}/events?limit=10`);
      const data = await response.json();
      setCompanyEvents(data);
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
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
<<<<<<< HEAD
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
=======
      education: 'bg-blue-100 text-blue-800',
      healthcare: 'bg-red-100 text-red-800',
      environment: 'bg-green-100 text-green-800',
      skill_development: 'bg-purple-100 text-purple-800',
      rural_development: 'bg-orange-100 text-orange-800',
      women_empowerment: 'bg-pink-100 text-pink-800',
      digital_literacy: 'bg-indigo-100 text-indigo-800',
      poverty_alleviation: 'bg-yellow-100 text-yellow-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
  };

  if (loading && !initialized) {
    return (
<<<<<<< HEAD
      <div className="relative min-h-screen overflow-hidden">
        <ParticleBackground />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20 z-10"></div>
        <div className="relative z-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
            <p className="mt-4 text-lg text-white">Initializing CSR Dashboard...</p>
          </div>
=======
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-lg text-gray-900">Initializing CSR Dashboard...</p>
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
        </div>
      </div>
    );
  }

  return (
<<<<<<< HEAD
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
=======
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CSR Impact Dashboard</h1>
            <p className="text-gray-600">Corporate Social Responsibility Metrics & Analytics</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search events..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Company Selector */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Select Company</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {companies.map((company) => (
                <Card
                  key={company.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedCompany?.id === company.id
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleCompanySelect(company)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-sm">{company.company_name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        ★ {company.csr_rating}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{company.industry}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatNumber(company.total_employees)} employees</span>
                      <span>{formatCurrency(company.csr_budget_annual / 1000000)}M budget</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedCompany && dashboardMetrics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Target className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Events</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.total_events}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">People Impacted</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(dashboardMetrics.total_beneficiaries)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Budget Spent</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(dashboardMetrics.total_budget_spent / 1000000)}M
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Impact Score</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {dashboardMetrics.average_impact_score.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="impact">Impact</TabsTrigger>
                <TabsTrigger value="geography">Geography</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Events by Type */}
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Events by Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(dashboardMetrics.events_by_type).map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                              <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
                            </div>
                            <Badge variant="secondary">{count} events</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Performance Metrics */}
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Budget Efficiency</span>
                          <span className="text-sm font-bold">{dashboardMetrics.budget_efficiency.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(dashboardMetrics.budget_efficiency, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Sustainability Score</span>
                          <span className="text-sm font-bold">{dashboardMetrics.sustainability_score.toFixed(1)}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${dashboardMetrics.sustainability_score}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Community Feedback</span>
                          <span className="text-sm font-bold">{dashboardMetrics.community_feedback_score.toFixed(1)}/100</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${dashboardMetrics.community_feedback_score}%` }}
                          ></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="events" className="space-y-6">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Recent CSR Events</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {companyEvents.map((event) => (
                        <div key={event.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold text-lg">{event.event_title}</h3>
                                <Badge className={getEventTypeColor(event.event_type)}>
                                  {event.event_type.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{event.location}, {event.state}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Users className="h-4 w-4" />
                                  <span>{formatNumber(event.beneficiaries_count)} beneficiaries</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <DollarSign className="h-4 w-4" />
                                  <span>{formatCurrency(event.budget_spent / 100000)}L spent</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{new Date(event.start_date).toLocaleDateString()}</span>
                                </div>
                              </div>
                              {Object.keys(event.impact_metrics).length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(event.impact_metrics).slice(0, 3).map(([key, value]) => (
                                    <Badge key={key} variant="outline" className="text-xs">
                                      {key.replace('_', ' ')}: {typeof value === 'number' ? formatNumber(value) : value}
                                    </Badge>
                                  ))}
                                </div>
                              )}
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
<<<<<<< HEAD
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
=======
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="impact" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Impact Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-600 mb-2">
                          {formatNumber(dashboardMetrics.total_beneficiaries)}
                        </div>
                        <p className="text-gray-600">Total Lives Impacted</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(dashboardMetrics.total_budget_spent / 1000000)}M
                          </div>
                          <p className="text-sm text-gray-600">Investment</p>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">
                            {Object.keys(dashboardMetrics.geographical_reach).length}
                          </div>
                          <p className="text-sm text-gray-600">States Covered</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white">
                    <CardHeader>
                      <CardTitle>Social Good Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Award className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">CSR Rating</span>
                          </div>
                          <span className="font-bold text-blue-600">
                            {selectedCompany.csr_rating}/5.0
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Activity className="h-5 w-5 text-green-600" />
                            <span className="font-medium">Impact Score</span>
                          </div>
                          <span className="font-bold text-green-600">
                            {dashboardMetrics.average_impact_score.toFixed(1)}/100
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5 text-orange-600" />
                            <span className="font-medium">Efficiency</span>
                          </div>
                          <span className="font-bold text-orange-600">
                            {dashboardMetrics.budget_efficiency.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="geography" className="space-y-6">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Geographical Reach</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(dashboardMetrics.geographical_reach)
                        .sort(([,a], [,b]) => (b as number) - (a as number))
                        .map(([state, count]) => (
                        <div key={state} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <MapPin className="h-5 w-5 text-gray-500" />
                            <span className="font-medium">{state}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full">
                              <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${Math.min((count as number) / Math.max(...Object.values(dashboardMetrics.geographical_reach)) * 100, 100)}%` 
                                }}
                              ></div>
                            </div>
                            <Badge variant="secondary">{count} events</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
      </div>
    </div>
  );
};

export default CSRDashboard;
