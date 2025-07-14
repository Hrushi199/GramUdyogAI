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

// Generic CRUD operations
class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const authToken = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      if (authToken) {
        (headers as any)['Authorization'] = `Bearer ${authToken}`;
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

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
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
  status?: 'draft' | 'active' | 'ongoing' | 'completed' | 'cancelled' | 'postponed';
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
}

export interface SocialMediaPost {
  id: number;
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
  content: string;
  image_url?: string;
  scheduled_at?: string;
  status: 'draft' | 'scheduled' | 'published';
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
  testimonials?: any[];
  awards?: any[];
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

// Job Types
export interface Job {
  id: number;
  title: string;
  description: string;
  company: string;
  location: string;
  company_contact: string;
  pay: string;
  created_at: string;
}

export interface JobCreate {
  title: string;
  description: string;
  company: string;
  location: string;
  company_contact: string;
  pay: string;
}

export interface JobUpdate {
  title?: string;
  description?: string;
  company?: string;
  location?: string;
  company_contact?: string;
  pay?: string;
}



// Add these interfaces to match backend models
export interface Profile {
  name: string;
  organization?: string | null;
  location: string;
  state: string;
  skills: string[];
  experience: string;
  goals: string;
  user_type: string;
}

export interface ProfileUpdate {
  name?: string;
  organization?: string;
  location?: string;
  state?: string;
  skills?: string[];
  experience?: string;
  goals?: string;
}

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

// CSR Course Types
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
}

// Visual Summary Types
export interface VisualSummary {
  id: number;
  topic: string;
  summary_data: any;
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
    
    return this.api.post<Event>(`/api/events?${queryParams.toString()}`, event);
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
    return this.api.put<Event>(`/api/events/${id}`, event);
  }

  // DELETE
  async deleteEvent(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.delete<{ message: string }>(`/api/events/${id}`);
  }

  // Additional operations
  async joinEvent(eventId: number, userId: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.post<{ message: string }>(`/api/events/${eventId}/join`, { user_id: userId });
  }

  async leaveEvent(eventId: number, userId: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.post<{ message: string }>(`/api/events/${eventId}/leave`, { user_id: userId });
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
    return this.api.post<{ message: string }>(`/api/events/${eventId}/publish-social-post`, { post_id: postId, platform });
  }

  async generateEventWithAI(prompt: string, eventType: string, language?: string): Promise<ApiResponse<EventCreate>> {
    return this.api.post<EventCreate>('/api/events/generate-with-ai', { prompt, event_type: eventType, language });
  }

  // Event Status Management
  async updateEventStatus(eventId: number, status: string, reason?: string): Promise<ApiResponse<{ message: string }>> {
    const user = localStorage.getItem('user');
    const userData = user ? JSON.parse(user) : null;
    const userId = userData?.id || localStorage.getItem('user_id') || 1;
    
    const queryParams = new URLSearchParams();
    queryParams.append('changed_by', userId.toString());
    
    return this.api.put<{ message: string }>(
      `/api/events/${eventId}/status?${queryParams.toString()}`,
      { status, reason }
    );
  }

  async getEventStatusHistory(eventId: number): Promise<ApiResponse<any[]>> {
    return this.api.get<any[]>(`/api/events/${eventId}/status-history`);
  }

  async updateAllEventStatuses(): Promise<ApiResponse<{ message: string }>> {
    return this.api.post<{ message: string }>('/api/events/update-statuses', {});
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
    
    return this.api.post<Project>(`/api/projects?${queryParams.toString()}`, project);
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
    return this.api.put<Project>(`/api/projects/${id}`, project);
  }

  // DELETE
  async deleteProject(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.delete<{ message: string }>(`/api/projects/${id}`);
  }

  // Team management
  async addTeamMember(projectId: number, member: {
    user_id: number;
    role: string;
    skills: string[];
  }): Promise<ApiResponse<{ message: string }>> {
    return this.api.post<{ message: string }>(`/api/projects/${projectId}/team-members`, member);
  }

  async removeTeamMember(projectId: number, userId: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.delete<{ message: string }>(`/api/projects/${projectId}/team-members/${userId}`);
  }
}

// Job API
export class JobAPI {
  private api = new ApiService();

  // CREATE
  async createJob(job: JobCreate): Promise<ApiResponse<{ message: string }>> {
    return this.api.post<{ message: string }>('/api/jobs', job);
  }

  // READ
  async getJobs(): Promise<ApiResponse<Job[]>> {
    return this.api.get<Job[]>('/api/jobs');
  }

  // UPDATE
  async updateJob(id: number, job: JobUpdate): Promise<ApiResponse<{ message: string }>> {
    return this.api.put<{ message: string }>(`/api/jobs/${id}`, job);
  }

  // DELETE
  async deleteJob(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.delete<{ message: string }>(`/api/jobs/${id}`);
  }

  // Additional operations
  async recommendJob(userInfo: string): Promise<ApiResponse<{ best_job: Job }>> {
    return this.api.post<{ best_job: Job }>('/api/recommend-job', { user_info: userInfo });
  }
}

// User API
export class UserAPI {
  private api = new ApiService();

  // Add createProfile method
  async createProfile(profileData: Profile): Promise<ApiResponse<Profile>> {
    console.log('sending profile data:', profileData);
    return this.api.post<Profile>('/api/profile/', profileData);
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

  async getProfile(): Promise<ApiResponse<Profile>> {
    return this.api.get<Profile>(`/api/profile/`);
  }

  // UPDATE methods
  async updateUser(id: number, userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.api.put<User>(`/api/users/${id}`, userData);
  }

  async updateProfile(profileData: ProfileUpdate): Promise<ApiResponse<Profile>> {
    return this.api.put<Profile>('/api/profile/', profileData);
  }


  // DELETE methods
  async deleteUser(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.delete<{ message: string }>(`/api/users/${id}`);
  }
}


// CSR Course API
export class CSRCourseAPI {
  private api = new ApiService();

  // CREATE
  async createCourse(course: CSRCourseCreate): Promise<ApiResponse<CSRCourse>> {
    return this.api.post<CSRCourse>('/api/csr/courses', course);
  }

  // READ
  async getCourses(): Promise<ApiResponse<CSRCourse[]>> {
    return this.api.get<CSRCourse[]>('/api/csr/courses');
  }

  async getCourseById(id: number): Promise<ApiResponse<CSRCourse>> {
    return this.api.get<CSRCourse>(`/api/csr/courses/${id}`);
  }

  // UPDATE
  async updateCourse(id: number, course: CSRCourseUpdate): Promise<ApiResponse<{ message: string }>> {
    return this.api.put<{ message: string }>(`/api/csr/courses/${id}`, course);
  }

  // DELETE
  async deleteCourse(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.delete<{ message: string }>(`/api/csr/courses/${id}`);
  }

  // Additional operations
  async enrollCourse(courseId: number, userId: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.post<{ message: string }>(`/api/csr/courses/${courseId}/enroll`, { user_id: userId });
  }

  async updateCourseStatus(courseId: number, status: string): Promise<ApiResponse<{ message: string }>> {
    return this.api.put<{ message: string }>(`/api/csr/courses/${courseId}/status`, { status });
  }

  // CSR Dashboard methods
  async initializeDashboard(): Promise<ApiResponse<any>> {
    return this.api.post<any>('/api/csr/dashboard/initialize', {});
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
    return this.api.post<VisualSummary>('/api/visual-summary', summary);
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
    return this.api.put<VisualSummary>(`/api/visual-summary/${id}`, summary);
  }

  // DELETE
  async deleteVisualSummary(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.delete<{ message: string }>(`/api/visual-summary/${id}`);
  }

  // Additional operations
  async updateSummaryAudio(summaryId: number, sectionIndex: number, audioUrl: string): Promise<ApiResponse<{ message: string }>> {
    return this.api.post<{ message: string }>('/api/update-summary-audio', {
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
  metadata?: any;
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
  metadata?: any;
}

export interface NotificationUpdate {
  title?: string;
  message?: string;
  is_read?: boolean;
  metadata?: any;
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
    return this.api.post<Notification>('/api/notifications', notification);
  }

  async updateNotification(notification_id: number, update: NotificationUpdate): Promise<ApiResponse<Notification>> {
    return this.api.put<Notification>(`/api/notifications/${notification_id}`, update);
  }

  async deleteNotification(notification_id: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.delete<{ message: string }>(`/api/notifications/${notification_id}`);
  }

  async markAsRead(notification_id: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.put<{ message: string }>(`/api/notifications/${notification_id}/read`, {});
  }

  async markAllAsRead(user_id: number): Promise<ApiResponse<{ message: string }>> {
    return this.api.put<{ message: string }>(`/api/notifications/user/${user_id}/read-all`, {});
  }

  async getUnreadCount(user_id: number): Promise<ApiResponse<{ unread_count: number }>> {
    return this.api.get<{ unread_count: number }>(`/api/notifications/unread-count/${user_id}`);
  }

  async getNotificationTypes(user_id: number): Promise<ApiResponse<any>> {
    return this.api.get<any>(`/api/notifications/types/${user_id}`);
  }

  // Team Invite Methods
  async sendTeamInvite(invite: TeamInviteCreate): Promise<ApiResponse<any>> {
    return this.api.post<any>('/api/notifications/team-invite', invite);
  }

  async respondToTeamInvite(invite_id: number, response: TeamInviteResponse): Promise<ApiResponse<any>> {
    return this.api.post<any>(`/api/notifications/team-invite/${invite_id}/respond`, response);
  }
}

// Export API instances
export const eventAPI = new EventAPI();
export const projectAPI = new ProjectAPI();
export const jobAPI = new JobAPI();
export const userAPI = new UserAPI();
export const csrCourseAPI = new CSRCourseAPI();
export const visualSummaryAPI = new VisualSummaryAPI();
export const notificationAPI = new NotificationAPI();

// Youtube Summary API
export class YoutubeSummaryAPI {
  private api = new ApiService();

  async getSummary(youtubeUrl: string, language: string): Promise<ApiResponse<any>> {
    return this.api.post<any>('/api/youtube-summary/youtube-audio-summary', { youtube_url: youtubeUrl, language });
  }
}

export const youtubeSummaryAPI = new YoutubeSummaryAPI();

// Export types
export type { ApiResponse }; 