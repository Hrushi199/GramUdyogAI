import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Building2, Users, DollarSign, Target, TrendingUp, 
  Award, MapPin, Calendar, Activity, Search
} from 'lucide-react';

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

  const API_BASE = 'http://localhost:8000/api/csr';

  useEffect(() => {
    initializeDashboard();
  }, []);

  const initializeDashboard = async () => {
    try {
      setLoading(true);
      if (!initialized) {
        await fetch(`${API_BASE}/dashboard/initialize`, {
          method: 'POST',
        });
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
      const response = await fetch(`${API_BASE}/dashboard/companies`);
      const data = await response.json();
      setCompanies(data);
      if (data.length > 0) {
        setSelectedCompany(data[0]);
        await fetchCompanyMetrics(data[0].id);
        await fetchCompanyEvents(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchCompanyMetrics = async (companyId: number) => {
    try {
      const response = await fetch(`${API_BASE}/dashboard/company/${companyId}/metrics`);
      const data = await response.json();
      setDashboardMetrics(data);
    } catch (error) {
      console.error('Error fetching company metrics:', error);
    }
  };

  const fetchCompanyEvents = async (companyId: number) => {
    try {
      const response = await fetch(`${API_BASE}/dashboard/company/${companyId}/events?limit=10`);
      const data = await response.json();
      setCompanyEvents(data);
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
  };

  if (loading && !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-lg text-gray-900">Initializing CSR Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
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
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
      </div>
    </div>
  );
};

export default CSRDashboard;
