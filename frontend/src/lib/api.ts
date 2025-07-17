// Centralized API service for all CRUD operations
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
// Add these utility functions at the top level
export const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token);
};

export const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

export const setUserId = (id: number | string) => {
  localStorage.setItem('user_id', id.toString());
};

export const getUserId = () => {
  return localStorage.getItem('user_id');
};

export const clearAuth = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_id');
};
// Generic API response type
interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> {
  courses?: T[];
  total_count: number;
  limit: number;
  offset: number;
  has_next: boolean;
  has_prev: boolean;
}

interface Course {
  id: number;
  name: string;
  link: string;
  category: string;
  skill_level: string;
  duration: string;
  provider: string;
  description: string;
  tags: string[];
  source: string;
  is_active: boolean;
  created_at: string;
}

// Generic CRUD operations
class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isFormData: boolean = false
  ): Promise<ApiResponse<T>> {
    try {
      const authToken = getAuthToken();
      const headers: Record<string, string> = {};

      if (!isFormData) {
        headers['Content-Type'] = 'application/json';
      }

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Generic CRUD methods
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint);
  }

  async post<Req, Res>(endpoint: string, data: Req): Promise<ApiResponse<Res>> {
    const isFormData = data instanceof FormData;
    return this.request<Res>(
      endpoint,
      {
        method: 'POST',
        body: isFormData ? data : JSON.stringify(data),
      },
      isFormData
    );
  }

  async put<Req, Res>(endpoint: string, data: Req): Promise<ApiResponse<Res>> {
    return this.request<Res>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  async patch<Req, Res>(endpoint: string, data: Req): Promise<ApiResponse<Res>> {
    return this.request<Res>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

// Event Types
export interface Event {
  id: number;
  title: string;
  description: string;
  event_type: 'hackathon' | 'workshop' | 'competition' | 'training' | 'meetup';
  category: string;
  location: string;
  state: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  current_participants: number;
  budget: number;
  prize_pool: number;
  organizer: {
    id: number;
    name: string;
    type: 'company' | 'ngo' | 'individual';
    logo?: string;
  };
  created_by: number; // Added created_by property
  skills_required: string[];
  tags: string[];
  status: 'draft' | 'active' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';
  impact_metrics: {
    participants_target: number;
    skills_developed: number;
    projects_created: number;
    employment_generated: number;
  };
  marketing_highlights?: string[];
  success_metrics?: string[];
  sections?: { title: string; description: string; key_points?: string[]; target_audience?: string; expected_outcome?: string }[];
  social_media_posts: SocialMediaPost[];
  created_at: string;
  updated_at: string;
}

export interface EventCreate {
  title: string;
  description: string;
  event_type: 'hackathon' | 'workshop' | 'competition' | 'training' | 'meetup';
  category: string;
  location: string;
  state: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  budget: number;
  prize_pool: number;
  skills_required: string[];
  tags: string[];
  organizer: {
    id: number;
    name: string;
    type: 'company' | 'ngo' | 'individual';
    logo?: string;
  }
  impact_metrics: {
    participants_target: number;
    skills_developed: number;
    projects_created: number;
    employment_generated: number;
  }
  status?: 'draft' | 'active' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';
  marketing_highlights?: string[];
  success_metrics?: string[];
  sections?: { title: string; description: string; key_points?: string[]; target_audience?: string; expected_outcome?: string }[];
}

export interface EventUpdate {
  title?: string;
  description?: string;
  event_type?: 'hackathon' | 'workshop' | 'competition' | 'training' | 'meetup';
  category?: string;
  location?: string;
  state?: string;
  start_date?: string;
  end_date?: string;
  max_participants?: number;
  budget?: number;
  prize_pool?: number;
  skills_required?: string[];
  tags?: string[];
  status?: 'draft' | 'active' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';
  marketing_highlights?: string[];
  success_metrics?: string[];
  sections?: { title: string; description: string; key_points?: string[]; target_audience?: string; expected_outcome?: string }[];
}

export interface SocialMediaPost {
  id: number;
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
  content: string;
  image_url?: string;
  scheduled_at?: string;
  status: 'draft' | 'scheduled' | 'published';
  hashtags?: string[];
}

// Project Types
export interface Project {
  id: number;
  title: string;
  description: string;
  category: string;
  event_id: number;
  event_name: string;
  event_type: string;
  team_members: TeamMember[];
  technologies: string[];
  impact_metrics: {
    users_reached: number;
    revenue_generated: number;
    jobs_created: number;
    social_impact: number;
  };
  funding_status: 'seeking' | 'funded' | 'self_funded';
  funding_amount: number;
  funding_goal: number;
  location: string;
  state: string;
  created_by: number;
  created_at: string;
  completed_at?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  media: {
    images: string[];
    videos: string[];
    documents: string[];
  };
  testimonials: Testimonial[];
  awards: Award[];
  tags: string[];
}

export interface ProjectCreate {
  title: string;
  description: string;
  category: string;
  event_id: number;
  event_name: string;
  event_type: string;
  team_members?: TeamMember[];
  technologies: string[];
  impact_metrics: {
    users_reached?: number;
    revenue_generated?: number;
    jobs_created?: number;
    social_impact?: number;
  };
  funding_status: string;
  funding_amount?: number;
  funding_goal?: number;
  location: string;
  state: string;
  status: string;
  completed_at?: string;
  media: {
    images?: string[];
    videos?: string[];
    documents?: string[];
  };
  testimonials?: Testimonial[];
  awards?: Award[];
  tags: string[];
}

export interface ProjectUpdate {
  title?: string;
  description?: string;
  category?: string;
  technologies?: string[];
  funding_status?: 'seeking' | 'funded' | 'self_funded';
  funding_amount?: number;
  funding_goal?: number;
  location?: string;
  state?: string;
  status?: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  tags?: string[];
}

export interface TeamMember {
  id: number;
  user_id: number;
  name: string;
  role: string;
  skills: string[];
  joined_at: string;
  project_id?: number;
  event_id?: number;
  project_title?: string;
}

export interface Testimonial {
  id: number;
  user_name: string;
  content: string;
  rating: number;
  created_at: string;
}

export interface Award {
  id: number;
  title: string;
  description: string;
  date: string;
  organization: string;
}

// Investment Types
export interface ProjectInvestment {
  id: number;
  project_id?: number;
  project_title?: string;
  investor_id?: number;
  investor_name: string;
  investor_email?: string;
  investor_phone: string;
  investment_amount: number;
  investment_type: 'equity' | 'loan' | 'grant' | 'partnership';
  equity_percentage?: number;
  expected_returns: string;
  terms_conditions?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating';
  invested_at: string;
  response_message?: string;
  response_at?: string;
}

export interface ProjectInvestmentCreate {
  project_id: number;
  investor_name: string;
  investor_email?: string;
  investor_phone: string;
  investment_amount: number;
  investment_type: 'equity' | 'loan' | 'grant' | 'partnership';
  equity_percentage?: number;
  expected_returns: string;
  terms_conditions?: string;
  message?: string;
}

export interface ProjectInvestmentUpdate {
  status: 'pending' | 'accepted' | 'rejected' | 'negotiating';
  response_message?: string;
}

// Job Types - Updated for Skill India integration
export interface Job {
  id: number;
  // Original fields
  title: string;
  description: string;
  company: string;
  location: string;
  company_contact?: string;
  pay?: string;
  created_at: string;
  
  // New Skill India fields
  job_title?: string;
  company_name?: string;
  salary_range?: string;
  job_type?: string;
  experience_required?: string;
  skills_required?: string[];
  industry?: string;
  sector?: string;
  posted_date?: string;
  application_deadline?: string;
  employment_type?: string;
  apply_url?: string;
  
  // Enhanced fields
  source?: string;
  tags?: string[];
  is_active?: boolean;
  job_status?: string; // Added for compatibility
  in_hand_salary?: string; // Added for compatibility
  
  // Smart recommendation fields
  relevance_score?: number;
  debug_info?: string;
}

export interface JobCreate {
  // Core required fields
  title: string;
  description: string;
  company: string;
  location: string;
  
  // Optional original fields
  company_contact?: string;
  pay?: string;
  
  // Optional new fields
  job_title?: string;
  company_name?: string;
  salary_range?: string;
  job_type?: string;
  experience_required?: string;
  skills_required?: string[];
  industry?: string;
  sector?: string;
  posted_date?: string;
  application_deadline?: string;
  employment_type?: string;
  source?: string;
  tags?: string[];
  is_active?: boolean;
}

export interface JobUpdate {
  // Original fields
  title?: string;
  description?: string;
  company?: string;
  location?: string;
  company_contact?: string;
  pay?: string;
  
  // New fields
  job_title?: string;
  company_name?: string;
  salary_range?: string;
  job_type?: string;
  experience_required?: string;
  skills_required?: string[];
  industry?: string;
  sector?: string;
  posted_date?: string;
  application_deadline?: string;
  employment_type?: string;
  source?: string;
  tags?: string[];
  is_active?: boolean;
}



//dont use profile, use userprofile

// Remove the separate Profile interface and use this unified one
export interface UserProfile {
  // Core fields (always present)
  user_id?: number;                // For unified_profiles table reference
  name: string;
  user_type: 'individual' | 'company' | 'ngo' | 'investor';
  
  // Optional profile fields
  organization?: string | null;
  location?: string;
  state?: string;
  skills: string[];
  experience?: string;
  goals?: string;
  
  // JSON stored fields (parsed from database)
  impact_metrics: {
    participants_target: number;
    skills_developed: number;
    projects_created: number;        // ✅ Match database
    employment_generated: number;
    revenue_generated: number;
    // Add calculated fields if needed
    events_hosted?: number;
    events_participated?: number;
    people_impacted?: number;
    jobs_created?: number;
    social_impact_score?: number;
    sustainability_score?: number;
  };
  
  achievements: Achievement[];
  recent_activities: Activity[];
  recommendations: Recommendation[];
  networking_suggestions: string[];
  
  // Metadata
  notifications_settings?: any;
  created_at: string;
  updated_at: string;
}

// For API requests (subset of UserProfile)
export interface UserProfileUpdate {
  name?: string;
  organization?: string | null;
  location?: string;
  state?: string;
  skills?: string[];
  experience?: string;
  goals?: string;
  impact_metrics?: Partial<UserProfile['impact_metrics']>;
  achievements?: Achievement[];
  recent_activities?: Activity[];
  recommendations?: Recommendation[];
  networking_suggestions?: string[];
}

// Remove the old Profile interface completely
// export interface Profile { ... } // ❌ DELETE THIS, DONE

export interface Achievement {
  title: string;
  description: string;
  type: string;
  date: string;
  impact_score: number;
}

// User Types
export interface User {
  id: number;
  phone: string;
  user_type: 'individual' | 'company' | 'ngo' | 'investor';
  name: string;
  organization?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
}


export interface Achievement {
  id: number;
  title: string;
  description: string;
  type: string;
  date: string;
  impact_score: number;
}

export interface Activity {
  id: number;
  type: string;
  title: string;
  description: string;
  date: string;
  impact_score: number;
}

export interface Recommendation {
  id: number;
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimated_impact: number;
}

export interface NetworkingSuggestion {
  id: number;
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  potential_benefit: number;
}

// CSR Course Types - Updated for Skill India integration
export interface CSRCourse {
  id: number;
  company_id: number;
  title: string;
  description: string;
  skills: string[];
  duration: string;
  language: string;
  certification: boolean;
  max_seats: number;
  start_date: string;
  status: 'active' | 'inactive' | 'completed';
  content_url?: string;
  created_at: string;
  updated_at: string;
  
  // New Skill India fields
  name?: string;         // For Skill India course name
  link?: string;         // For Skill India course link
  category?: string;     // Course category
  skill_level?: string;  // Beginner, Intermediate, Advanced
  provider?: string;     // Course provider
  
  // Enhanced fields
  source?: string;       // 'csr' or 'skill_india'
  tags?: string[];       // Course tags
  is_active?: boolean;   // Active status
}

export interface CSRCourseCreate {
  company_id: number;
  title: string;
  description: string;
  skills: string[];
  duration: string;
  language: string;
  certification: boolean;
  max_seats: number;
  start_date: string;
  status: 'active' | 'inactive' | 'completed';
  content_url?: string;
  
  // Optional new fields
  name?: string;
  link?: string;
  category?: string;
  skill_level?: string;
  provider?: string;
  source?: string;
  tags?: string[];
  is_active?: boolean;
}

export interface CSRCourseUpdate {
  title?: string;
  description?: string;
  skills?: string[];
  duration?: string;
  language?: string;
  certification?: boolean;
  max_seats?: number;
  start_date?: string;
  status?: 'active' | 'inactive' | 'completed';
  content_url?: string;
  
  // New optional fields
  name?: string;
  link?: string;
  category?: string;
  skill_level?: string;
  provider?: string;
  source?: string;
  tags?: string[];
  is_active?: boolean;
}

// Visual Summary Types
export interface VisualSummary {
  id: number;
  topic: string;
  summary_data: Record<string, unknown>;
  created_at: string;
}

export interface VisualSummaryCreate {
  topic: string;
  context: string;
  language: string;
  generateAudio: boolean;
  audioOnDemand: boolean;
}

// Event API
export class EventAPI {
  private api = new ApiService();

  // CREATE
  async createEvent(event: EventCreate): Promise<ApiResponse<Event>> {
    const user = localStorage.getItem('user');
    const userData = user ? JSON.parse(user) : null;
    const userId = userData?.id || localStorage.getItem('user_id') || 1;
    
    const queryParams = new URLSearchParams();
    queryParams.append('created_by', userId.toString());
    
    return this.api.post<EventCreate, Event>(`/api/events?${queryParams.toString()}`, event);
  }

  // READ
  async getEvents(params?: {
    limit?: number;
    offset?: number;
    event_type?: string;
    status?: string;
    location?: string;
  }): Promise<ApiResponse<Event[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    const endpoint = `/api/events${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.api.get<Event[]>(endpoint);
  }

  async getEventById(id: number): Promise<ApiResponse<Event>> {
    return this.api.get<Event>(`/api/events/${id}`);
  }

  async getUserEvents(userId: number): Promise<ApiResponse<Event[]>> {
    return this.api.get<Event[]>(`/api/users/${userId}/events`);
  }

  async getTeamMembersByEventId(eventId: number): Promise<ApiResponse<TeamMember[]>> {
    return this.api.get<TeamMember[]>(`/api/events/${eventId}/team-members`);
  }

  // UPDATE
  async updateEvent(id: number, event: EventUpdate): Promise<ApiResponse<Event>> {
    return this.api.put<EventUpdate, Event>(`/api/events/${id}`, event);
  }

  // DELETE
  async deleteEvent(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.delete<{ message: string }>(`/api/events/${id}`);
  }

  // Additional operations
  async joinEvent(eventId: number, userId: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.post<{ user_id: number }, { message: string }>(`/api/events/${eventId}/join`, { user_id: userId });
  }

  async leaveEvent(eventId: number, userId: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.post<{ user_id: number }, { message: string }>(`/api/events/${eventId}/leave`, { user_id: userId });
  }

  async generateSocialMediaPosts(eventId: number, setSelectedEvent: React.Dispatch<React.SetStateAction<Event | null>>) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/generate-social-posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const posts = await response.json();
        setSelectedEvent(prev => prev ? { ...prev, social_media_posts: posts } : null);
      }
    } catch (error) {
      console.error('Error generating social media posts:', error);
    }
  }

  async publishSocialMediaPost(eventId: number, postId: number, platform: string): Promise<ApiResponse<{ message: string }>> {
    return this.api.post<{ post_id: number; platform: string }, { message: string }>(`/api/events/${eventId}/publish-social-post`, { post_id: postId, platform });
  }

  async generateEventWithAI(prompt: string, eventType: string, language?: string): Promise<ApiResponse<EventCreate>> {
    return this.api.post<{ prompt: string; event_type: string; language?: string }, EventCreate>('/api/events/generate-with-ai', { prompt, event_type: eventType, language });
  }

  // Event Status Management
  async updateEventStatus(eventId: number, status: string, reason?: string): Promise<ApiResponse<{ message: string }>> {
    const user = localStorage.getItem('user');
    const userData = user ? JSON.parse(user) : null;
    const userId = userData?.id || localStorage.getItem('user_id') || 1;
    
    const queryParams = new URLSearchParams();
    queryParams.append('changed_by', userId.toString());
    
    return this.api.put<{ status: string; reason?: string }, { message: string }>(
      `/api/events/${eventId}/status?${queryParams.toString()}`,
      { status, reason }
    );
  }

  async getEventStatusHistory(eventId: number): Promise<ApiResponse<any[]>> {
    return this.api.get<any[]>(`/api/events/${eventId}/status-history`);
  }

  async updateAllEventStatuses(): Promise<ApiResponse<{ message: string }>> {
    return this.api.post<{}, { message: string }>('/api/events/update-statuses', {});
  }

  async getEventsByOrganizer(organizerId: number, type: string): Promise<ApiResponse<Event[]>> {
    const queryParams = new URLSearchParams({
      organizer_id: organizerId.toString(),
      organizer_type: type
    });
    return this.api.get<Event[]>(`/api/events/organizer?${queryParams}`);
  }

  async getOrganizerMetrics(organizerId: number, type: string): Promise<ApiResponse<any>> {
    return this.api.get<any>(`/api/events/organizer/${organizerId}/metrics?type=${type}`);
  }
}

// Project API
export class ProjectAPI {
  private api = new ApiService();

  // CREATE
  async createProject(project: ProjectCreate): Promise<ApiResponse<Project>> {
    const user = localStorage.getItem('user');
    const userData = user ? JSON.parse(user) : null;
    const userId = userData?.id || localStorage.getItem('user_id') || 1;
    
    const queryParams = new URLSearchParams();
    queryParams.append('created_by', userId.toString());
    
    return this.api.post<ProjectCreate, Project>(`/api/projects?${queryParams.toString()}`, project);
  }

  // READ
  async getProjects(params?: {
    limit?: number;
    offset?: number;
    category?: string;
    status?: string;
    funding_status?: string;
    location?: string;
  }): Promise<ApiResponse<Project[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    const endpoint = `/api/projects${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.api.get<Project[]>(endpoint);
  }

  async getProjectById(id: number): Promise<ApiResponse<Project>> {
    return this.api.get<Project>(`/api/projects/${id}`);
  }

  // UPDATE
  async updateProject(id: number, project: ProjectUpdate): Promise<ApiResponse<Project>> {
    return this.api.put<ProjectUpdate, Project>(`/api/projects/${id}`, project);
  }

  // DELETE
  async deleteProject(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.delete<{ message: string }>(`/api/projects/${id}`);
  }

  // Team management
  // async addTeamMember(projectId: number, member: {
  //   user_id: number;
  //   role: string;
  //   skills: string[];
  // }): Promise<ApiResponse<{ message: string }>> {
  //   // Deprecated: Use NotificationAPI.sendTeamInvite instead
  //   // Build query string
  //   const params = new URLSearchParams();
  //   params.append('user_id', member.user_id.toString());
  //   params.append('role', member.role);
  //   member.skills.forEach(skill => params.append('skills', skill));
  //   return this.api.post<undefined, { message: string }>(`/api/projects/${projectId}/team-members?${params.toString()}`, undefined);
  // }

  async removeTeamMember(projectId: number, userId: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.delete<{ message: string }>(`/api/projects/${projectId}/team-members/${userId}`);
  }

  async getProjectsByOrganizer(organizerId: number, type: string): Promise<ApiResponse<Project[]>> {
    const queryParams = new URLSearchParams({
      organizer_id: organizerId.toString(),
      organizer_type: type
    });
    return this.api.get<Project[]>(`/api/projects/organizer?${queryParams}`);
  }

  // Investment methods
  async createInvestment(investment: ProjectInvestmentCreate): Promise<ApiResponse<{ id: number; message: string }>> {
    return this.api.post<ProjectInvestmentCreate, { id: number; message: string }>(`/api/projects/${investment.project_id}/invest`, investment);
  }

  async getProjectInvestments(projectId: number): Promise<ApiResponse<ProjectInvestment[]>> {
    return this.api.get<ProjectInvestment[]>(`/api/projects/${projectId}/investments`);
  }

  async updateInvestmentStatus(projectId: number, investmentId: number, update: ProjectInvestmentUpdate): Promise<ApiResponse<{ message: string }>> {
    return this.api.put<ProjectInvestmentUpdate, { message: string }>(`/api/projects/${projectId}/investments/${investmentId}`, update);
  }

  async getMyInvestments(): Promise<ApiResponse<ProjectInvestment[]>> {
    return this.api.get<ProjectInvestment[]>(`/api/investments/my`);
  }
}

// Job API - Enhanced for Skill India integration
export class JobAPI {
  private api = new ApiService();

  // CREATE
  async createJob(job: JobCreate): Promise<ApiResponse<{ message: string }>> {
    return this.api.post<JobCreate, { message: string }>('/api/jobs', job);
  }

  // READ - Enhanced with filtering
  async getJobs(params?: {
    limit?: number;
    offset?: number;
    location?: string;
    industry?: string;
    sector?: string;
    job_type?: string;
    experience_level?: string;
    source?: string;
    is_active?: boolean;
    search?: string;
    diverse?: boolean;
  }): Promise<ApiResponse<{ jobs: Job[], total_count: number }>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    const endpoint = `/api/jobs?${queryParams.toString()}`;
    return this.api.get<{ jobs: Job[], total_count: number }>(endpoint);
  }

  async getJobById(id: number): Promise<ApiResponse<Job>> {
    return this.api.get<Job>(`/api/jobs/${id}`);
  }

  // Enhanced search endpoint
  async searchJobs(params: {
    query?: string;
    location?: string;
    industry?: string;
    job_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ jobs: Job[], total_count: number }>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.append(key, value.toString());
    });
    return this.api.get<{ jobs: Job[], total_count: number }>(`/api/jobs/search?${queryParams.toString()}`);
  }

  // Utility endpoints
  async getJobIndustries(): Promise<ApiResponse<{ industry: string, count: number }[]>> {
    return this.api.get<{ industry: string, count: number }[]>('/api/jobs/industries');
  }

  async getJobLocations(): Promise<ApiResponse<{ location: string, count: number }[]>> {
    return this.api.get<{ location: string, count: number }[]>('/api/jobs/locations');
  }

  async getJobSectors(): Promise<ApiResponse<{ sector: string, count: number }[]>> {
    return this.api.get<{ sector: string, count: number }[]>('/api/jobs/sectors');
  }

  async getJobStatistics(): Promise<ApiResponse<{
    total_jobs: number;
    active_jobs: number;
    job_by_industry: Record<string, number>;
    job_by_location: Record<string, number>;
    job_by_type: Record<string, number>;
  }>> {
    return this.api.get('/api/jobs/stats');
  }

  // UPDATE
  async updateJob(id: number, job: JobUpdate): Promise<ApiResponse<{ message: string }>> {
    return this.api.put<JobUpdate, { message: string }>(`/api/jobs/${id}`, job);
  }

  // DELETE
  async deleteJob(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.delete<{ message: string }>(`/api/jobs/${id}`);
  }

  // Additional operations
  async recommendJob(userInfo: string): Promise<ApiResponse<{ best_job: Job }>> {
    return this.api.post<{ user_info: string }, { best_job: Job }>('/api/recommend-job', { user_info: userInfo });
  }
}

// User API
export class UserAPI {
  private api = new ApiService();

  // Add createProfile method
  async createProfile(profileData: UserProfile): Promise<ApiResponse<UserProfile>> {
    console.log('sending profile data:', profileData);
    return this.api.post<UserProfile, UserProfile>('/api/profile', profileData);
  }

  // READ methods
  async getUsers(params?: {
    limit?: number;
    offset?: number;
    user_type?: string;
    is_active?: boolean;
  }): Promise<ApiResponse<User[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    const endpoint = `/api/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.api.get<User[]>(endpoint);
  }

  async getUserById(id: number): Promise<ApiResponse<User>> {
    return this.api.get<User>(`/api/users/${id}`);
  }

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    return this.api.get<User[]>(`/api/users/search?query=${encodeURIComponent(query)}`);
  }

  async getProfile(): Promise<ApiResponse<UserProfile>> {
const response = await this.api.get<UserProfile>('/api/profile');
  return response;  }

  async getProfileById(id: string | number): Promise<ApiResponse<UserProfile>> {
    return this.api.get<UserProfile>(`/api/profile/public/${id}`);
  }

  // UPDATE methods
  async updateUser(id: number, userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.api.put<Partial<User>, User>(`/api/users/${id}`, userData);
  }

  async updateProfile(profileData: UserProfileUpdate): Promise<ApiResponse<UserProfile>> {
    return this.api.put<UserProfileUpdate, UserProfile>('/api/profile', profileData);
  }


  // DELETE methods
  async deleteUser(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.delete<{ message: string }>(`/api/users/${id}`);
  }

  // User-specific data methods
  async getUserEvents(userId: number): Promise<ApiResponse<Event[]>> {
    return this.api.get<Event[]>(`/api/users/${userId}/events`);
  }

  async getUserProjects(userId: number): Promise<ApiResponse<Project[]>> {
    return this.api.get<Project[]>(`/api/users/${userId}/projects`);
  }

  async getUserAchievements(userId: number): Promise<ApiResponse<any[]>> {
    return this.api.get<any[]>(`/api/users/${userId}/achievements`);
  }

  async getUserActivities(userId: number, limit: number = 10): Promise<ApiResponse<any[]>> {
    return this.api.get<any[]>(`/api/users/${userId}/activities?limit=${limit}`);
  }

  async getUserRecommendations(userId: number): Promise<ApiResponse<any[]>> {
    return this.api.get<any[]>(`/api/users/${userId}/recommendations`);
  }

  async getUserNetworkingSuggestions(userId: number): Promise<ApiResponse<any[]>> {
    return this.api.get<any[]>(`/api/users/${userId}/networking-suggestions`);
  }

  async getUserStats(userId: number): Promise<ApiResponse<any>> {
    return this.api.get<any>(`/api/users/${userId}/stats`);
  }
}

// Course API for regular courses
export class CourseAPI {
  private api = new ApiService();

  async getCourses(params?: {
    limit?: number;
    offset?: number;
    category?: string;
    skill_level?: string;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<Course>>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    const endpoint = `/api/courses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.api.get<PaginatedResponse<Course>>(endpoint);
  }

  async getCourseById(id: number): Promise<ApiResponse<Course>> {
    return this.api.get<Course>(`/api/courses/${id}`);
  }

  async searchCourses(query: string, limit?: number, offset?: number): Promise<ApiResponse<PaginatedResponse<Course>>> {
    const params = new URLSearchParams({ query });
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    return this.api.get<PaginatedResponse<Course>>(`/api/courses/search?${params.toString()}`);
  }

  async getCourseCategories(): Promise<ApiResponse<string[]>> {
    return this.api.get<string[]>('/api/courses/categories');
  }

  async getCourseSkillLevels(): Promise<ApiResponse<string[]>> {
    return this.api.get<string[]>('/api/courses/skill-levels');
  }
}

// CSR Course API - Enhanced for Skill India integration
export class CSRCourseAPI {
  private api = new ApiService();

  // CREATE
  async createCourse(course: CSRCourseCreate): Promise<ApiResponse<CSRCourse>> {
    return this.api.post<CSRCourseCreate, CSRCourse>('/api/csr/courses', course);
  }

  // READ - Enhanced with filtering
  async getCourses(params?: {
    limit?: number;
    offset?: number;
    category?: string;
    skill_level?: string;
    language?: string;
    source?: string;
    is_active?: boolean;
    search?: string;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<CSRCourse>>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, value.toString());
      });
    }
    const endpoint = `/api/csr/courses${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.api.get<PaginatedResponse<CSRCourse>>(endpoint);
  }

  async getCourseById(id: number): Promise<ApiResponse<CSRCourse>> {
    return this.api.get<CSRCourse>(`/api/csr/courses/${id}`);
  }

  // Enhanced search and utility endpoints
  async getCourseCategories(): Promise<ApiResponse<string[]>> {
    return this.api.get<string[]>('/api/courses/categories');
  }

  async getCourseSkillLevels(): Promise<ApiResponse<string[]>> {
    return this.api.get<string[]>('/api/courses/skill-levels');
  }

  async getCourseStatistics(): Promise<ApiResponse<{
    total_courses: number;
    active_courses: number;
    courses_by_category: Record<string, number>;
    courses_by_level: Record<string, number>;
    courses_by_source: Record<string, number>;
  }>> {
    return this.api.get('/api/courses/stats');
  }

  // UPDATE
  async updateCourse(id: number, course: CSRCourseUpdate): Promise<ApiResponse<{ message: string }>> {
    return this.api.put<CSRCourseUpdate, { message: string }>(`/api/csr/courses/${id}`, course);
  }

  // DELETE
  async deleteCourse(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.delete<{ message: string }>(`/api/csr/courses/${id}`);
  }

  // Additional operations
  async enrollCourse(courseId: number, userId: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.post<{ user_id: number }, { message: string }>(`/api/csr/courses/${courseId}/enroll`, { user_id: userId });
  }

  async updateCourseStatus(courseId: number, status: string): Promise<ApiResponse<{ message: string }>> {
    return this.api.put<{ status: string }, { message: string }>(`/api/csr/courses/${courseId}/status`, { status });
  }

  // CSR Dashboard methods
  async initializeDashboard(): Promise<ApiResponse<any>> {
    return this.api.post<{}, any>('/api/csr/dashboard/initialize', {});
  }

  async getCompanies(): Promise<ApiResponse<any[]>> {
    return this.api.get<any[]>('/api/csr/dashboard/companies');
  }

  async getCompanyMetrics(companyId: number): Promise<ApiResponse<any>> {
    return this.api.get<any>(`/api/csr/dashboard/company/${companyId}/metrics`);
  }

  async getCompanyEvents(companyId: number, limit: number = 10): Promise<ApiResponse<any[]>> {
    return this.api.get<any[]>(`/api/csr/dashboard/company/${companyId}/events?limit=${limit}`);
  }
}

// Visual Summary API
export class VisualSummaryAPI {
  private api = new ApiService();

  // CREATE
  async createVisualSummary(summary: VisualSummaryCreate): Promise<ApiResponse<VisualSummary>> {
    return this.api.post<VisualSummaryCreate, VisualSummary>('/api/visual-summary', summary);
  }

  // READ
  async getVisualSummaries(): Promise<ApiResponse<VisualSummary[]>> {
    return this.api.get<VisualSummary[]>('/api/visual-summaries');
  }

  async getVisualSummaryById(id: number): Promise<ApiResponse<VisualSummary>> {
    return this.api.get<VisualSummary>(`/api/visual-summary/${id}`);
  }

  // UPDATE
  async updateVisualSummary(id: number, summary: Partial<VisualSummary>): Promise<ApiResponse<VisualSummary>> {
    return this.api.put<Partial<VisualSummary>, VisualSummary>(`/api/visual-summary/${id}`, summary);
  }

  // DELETE
  async deleteVisualSummary(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.delete<{ message: string }>(`/api/visual-summary/${id}`);
  }

  // Additional operations
  async updateSummaryAudio(summaryId: number, sectionIndex: number, audioUrl: string): Promise<ApiResponse<{ message: string }>> {
    return this.api.post<{ summary_id: number; section_index: number; audio_url: string }, { message: string }>('/api/update-summary-audio', {
      summary_id: summaryId,
      section_index: sectionIndex,
      audio_url: audioUrl,
    });
  }
}

// Notification Types
export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: string;
  related_id?: number;
  related_type?: string;
  event_id?: number;
  project_id?: number;
  metadata?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  updated_at?: string;
}

export interface NotificationCreate {
  user_id: number;
  title: string;
  message: string;
  notification_type: string;
  related_id?: number;
  related_type?: string;
  event_id?: number;
  project_id?: number;
  metadata?: Record<string, unknown>;
}

export interface NotificationUpdate {
  title?: string;
  message?: string;
  is_read?: boolean;
  metadata?: Record<string, unknown>;
}

export interface TeamInviteCreate {
  inviter_id: number;
  invitee_id: number;
  project_id: number;
  role: string;
  skills: string[];
  message?: string;
}

export interface TeamInviteResponse {
  invite_id: number;
  action: 'accept' | 'reject';
  message?: string;
}

// Notification API Class
export class NotificationAPI {
  private api = new ApiService();

  async getNotifications(
    user_id: number,
    unread_only: boolean = false,
    notification_type?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<Notification[]>> {
    const params = new URLSearchParams({
      user_id: user_id.toString(),
      unread_only: unread_only.toString(),
      limit: limit.toString(),
      offset: offset.toString()
    });
    
    if (notification_type) {
      params.append('notification_type', notification_type);
    }
    
    return this.api.get<Notification[]>(`/api/notifications?${params}`);
  }

  async getNotification(notification_id: number): Promise<ApiResponse<Notification>> {
    return this.api.get<Notification>(`/api/notifications/${notification_id}`);
  }

  async createNotification(notification: NotificationCreate): Promise<ApiResponse<Notification>> {
    return this.api.post<NotificationCreate, Notification>('/api/notifications', notification);
  }

  async updateNotification(notification_id: number, update: NotificationUpdate): Promise<ApiResponse<Notification>> {
    return this.api.put<NotificationUpdate, Notification>(`/api/notifications/${notification_id}`, update);
  }

  async deleteNotification(notification_id: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.delete<{ message: string }>(`/api/notifications/${notification_id}`);
  }

  async markAsRead(notification_id: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.put<{}, { message: string }>(`/api/notifications/${notification_id}/read`, {});
  }

  async markAllAsRead(user_id: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.put<{}, { message: string }>(`/api/notifications/user/${user_id}/read-all`, {});
  }

  async getUnreadCount(user_id: number): Promise<ApiResponse<{ unread_count: number }>> {
    return this.api.get<{ unread_count: number }>(`/api/notifications/unread-count/${user_id}`);
  }

  async getNotificationTypes(user_id: number): Promise<ApiResponse<any>> {
    return this.api.get<any>(`/api/notifications/types/${user_id}`);
  }

  // Team Invite Methods
  async sendTeamInvite(invite: TeamInviteCreate): Promise<ApiResponse<any>> {
    return this.api.post<TeamInviteCreate, any>('/api/notifications/team-invite', invite);
  }

  async respondToTeamInvite(invite_id: number, response: TeamInviteResponse): Promise<ApiResponse<any>> {
    return this.api.post<{ invite_id: number; action: 'accept' | 'reject'; message?: string }, any>(`/api/notifications/team-invite/${invite_id}/respond`, response);
  }
}

// Export API instances
export const eventAPI = new EventAPI();
export const projectAPI = new ProjectAPI();
export const jobAPI = new JobAPI();
export const userAPI = new UserAPI();
export const courseAPI = new CourseAPI();
export const csrCourseAPI = new CSRCourseAPI();
export const visualSummaryAPI = new VisualSummaryAPI();
export const notificationAPI = new NotificationAPI();

// Youtube Summary API
export class YoutubeSummaryAPI {
  private api = new ApiService();

  async getSummary(youtubeUrl: string, language: string): Promise<ApiResponse<any>> {
    return this.api.post<{ youtube_url: string; language: string }, any>('/api/youtube-summary/youtube-audio-summary', { youtube_url: youtubeUrl, language });
  }
}

export const youtubeSummaryAPI = new YoutubeSummaryAPI();

// Speech-to-text API
export class SttAPI {
  private api = new ApiService();

  async transcribeAudio(audioBlob: Blob, language: string): Promise<ApiResponse<{ text: string }>> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    formData.append('language', language);

    return this.api.post<FormData, { text: string }>('/api/transcribe', formData);
  }
}

export const sttAPI = new SttAPI();

// Voice profile update API
export async function voiceUpdateProfile(transcription: string, current_profile: any) {
  const response = await fetch(`${API_BASE_URL}/api/voice-update-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcription, current_profile })
  });
  if (!response.ok) {
    throw new Error('Failed to update profile with voice');
  }
  return await response.json();
}

// Export types
export type { ApiResponse };