import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI, projectAPI, userAPI, Event } from '../../lib/api';
import type { User as UserType, Project } from '../../lib/api';
import { Badge } from '../ui/badge';
import { 
  Calendar, MapPin, Users, Award, Share2, Target, TrendingUp, DollarSign, Plus, Activity, User, Crown,
  Search, UserPlus, Edit, Trash2, Star, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { getEventTypeColor, getStatusColor } from '../../lib/utils';
import { formatCurrency } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { TeamMember } from '../../lib/api';
import { Toaster, toast } from 'react-hot-toast';
import PublicProfileAvatar from '../ui/PublicProfileAvatar';
import { notificationAPI } from '../../lib/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Helper functions moved from EventManagement
export const generateSocialMediaPosts = async (eventId: number, setSelectedEvent: React.Dispatch<React.SetStateAction<Event | null>>, setShowSocialMediaModal: React.Dispatch<React.SetStateAction<boolean>>, API_BASE_URL: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/generate-social-posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) {
      const posts = await response.json();
      setSelectedEvent(prev => prev ? { ...prev, social_media_posts: posts } : null);
      setShowSocialMediaModal(true);
    }
  } catch (error) {
    console.error('Error generating social media posts:', error);
  }
};

export const joinEvent = async (eventId: number, fetchEvent: () => Promise<void>, API_BASE_URL: string, t: any) => {
  try {
    const user = localStorage.getItem('user');
    const userData = user ? JSON.parse(user) : null;
    const userId = userData?.id || localStorage.getItem('user_id');
    if (!userId) {
      toast.error(t('toasts.loginRequired'));
      return;
    }
    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/join?user_id=${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) {
      await fetchEvent();
      toast.success(t('toasts.joinSuccess'));
    } else {
      const error = await response.json();
      toast.error(error.detail || t('toasts.joinError'));
    }
  } catch (error) {
    console.error('Error joining event:', error);
    toast.error(t('toasts.joinError'));
  }
};

export const createProjectForEvent = async (eventId: number, selectedEvent: Event | null, fetchTeamMembers: (eventId: number) => Promise<void>, t: any) => {
  const user = localStorage.getItem('user');
  const userData = user ? JSON.parse(user) : null;
  const userId = userData?.id || localStorage.getItem('user_id');
  if (!userId) {
    toast.error(t('toasts.projectCreateLoginRequired'));
    return;
  }
  const projectData = {
    title: `Project for ${selectedEvent?.title || 'Event'}`,
    description: 'A collaborative project for this event',
    category: selectedEvent?.category || 'General',
    event_id: eventId,
    event_name: selectedEvent?.title || 'Event',
    event_type: selectedEvent?.event_type || 'hackathon',
    team_members: [],
    technologies: [],
    impact_metrics: {
      users_reached: 0,
      revenue_generated: 0,
      jobs_created: 0,
      social_impact: 0
    },
    funding_status: 'seeking',
    funding_amount: 0,
    funding_goal: 0,
    location: selectedEvent?.location || '',
    state: selectedEvent?.state || '',
    created_by: parseInt(userId),
    status: 'planning',
    media: {
      images: [],
      videos: [],
      documents: []
    },
    testimonials: [],
    awards: [],
    tags: selectedEvent?.tags || []
  };

  const { created_by, ...restProjectData } = projectData;

  try {
    const response = await projectAPI.createProject({
      ...restProjectData,
    });

    if (response.data) {
      toast.success(t('toasts.projectCreated', { id: response.data.id }));
      if (selectedEvent) {
        await fetchTeamMembers(selectedEvent.id);
      }
    } else {
      toast.error(t('toasts.projectCreateError', { error: response.error || t('toasts.projectCreateErrorGeneric') }));
    }
  } catch (error) {
    console.error('Error creating project for event:', error);
    toast.error(t('toasts.projectCreateErrorGeneric'));
  } finally {
    // Optional: Any cleanup or final actions can go here
  }
};

export const removeTeamMember = async (projectId: number, userId: number, selectedEvent: Event | null, fetchTeamMembers: (eventId: number) => Promise<void>, API_BASE_URL: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/team-members/${userId}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      // Refresh team members
      if (selectedEvent) {
        await fetchTeamMembers(selectedEvent.id);
      }
    } else {
      console.error('Error removing team member:', response.statusText);
    }
  } catch (error) {
    console.error('Error removing team member:', error);
  }
};

interface TeamMemberWithProject extends TeamMember {
  project_id: number;
  project_title: string;
}

const EventDetails: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('event-details');
  
  // Event state
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [eventForm, setEventForm] = useState<Event>({
    id: 0,
    title: '',
    description: '',
    event_type: 'hackathon',
    category: '',
    location: '',
    state: '',
    start_date: '',
    end_date: '',
    max_participants: 0,
    current_participants: 0,
    budget: 0,
    prize_pool: 0,
    organizer: {
      id: 0,
      name: '',
      type: 'individual',
    },
    created_by: 0,
    skills_required: [],
    tags: [],
    status: 'draft',
    impact_metrics: {
      participants_target: 0,
      skills_developed: 0,
      projects_created: 0,
      employment_generated: 0,
    },
    social_media_posts: [],
    created_at: '',
    updated_at: '',
  });

  // Team management state
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithProject[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showSocialMediaModal, setShowSocialMediaModal] = useState(false);
  
  // User search and selection
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [newMemberSkills, setNewMemberSkills] = useState('');
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Add state for pending invites
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);

  // Better user management utility function
const getCurrentUserId = (): number => {
  try {
    // First try to get from parsed user object
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.id) {
        return parseInt(user.id);
      }
    }
    
    // Fallback to user_id
    const userId = localStorage.getItem('user_id');
    if (userId) {
      return parseInt(userId);
    }
    
    // Default fallback
    return 0;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return 0;
  }
};
  const fetchTeamMembers = async (eventId: number) => {
    try {
      setLoadingTeamMembers(true);
      // Fetch projects for this specific event
      const response = await projectAPI.getProjects();
      if (response.data) {
        // Filter projects by event_id for exact matching
        const eventProjects = response.data.filter((project: Project) => 
          project.event_id === eventId
        );
        
        // Extract team members from projects for this specific event
        const allTeamMembers: TeamMemberWithProject[] = eventProjects.flatMap((project: Project) => 
          project.team_members.map((member: TeamMember) => ({
            ...member,
            project_id: project.id,
            project_title: project.title
          }))
        );
        setTeamMembers(allTeamMembers);
      } else if (response.error) {
        console.error('Error fetching team members:', response.error);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoadingTeamMembers(false);
    }
  };

  // Search users for adding to team
  const searchUsers = async (query: string) => {
  try {
    const response = await userAPI.searchUsers(query);
    if (response.data) {
      setSearchResults(response.data);
    }
  } catch (error) {
    console.log('Search error details:', error);
    setSearchResults([]);
  }
};


  // Fetch user's own projects
  const fetchUserProjects = async () => {
    try {
      const user = localStorage.getItem('user');
      const userData = user ? JSON.parse(user) : null;
      const userId = userData?.id || localStorage.getItem('user_id');
      
      if (!userId) return;

      const response = await projectAPI.getProjects();
      if (response.data) {
        // Filter projects created by the current user
        const userOwnedProjects: Project[] = response.data.filter((project: Project) => 
          project.created_by === parseInt(userId)
        );
        setUserProjects(userOwnedProjects);
      }
    } catch (error) {
      console.error('Error fetching user projects:', error);
    }
  };

  const addTeamMember = async () => {
    if (!selectedProject || !selectedUser || !newMemberSkills || !event) {
      toast.error('Please select a project, a user, and define skills.');
      return;
    }
    const user = localStorage.getItem('user');
    const userData = user ? JSON.parse(user) : null;
    const inviterId = userData?.id || localStorage.getItem('user_id');
    try {
      const response = await notificationAPI.sendTeamInvite({
        inviter_id: parseInt(inviterId),
        invitee_id: selectedUser.id,
        project_id: selectedProject.id,
        role: 'Member',
        skills: newMemberSkills.split(',').map(s => s.trim()),
        message: ''
      });
      if (response.data) {
        toast.success('Team invite sent successfully!');
        setShowAddMemberModal(false);
        setSelectedUser(null);
        setNewMemberSkills('');
        // Optionally refresh invites list
      } else {
        toast.error('Error sending invite: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error('An unexpected error occurred.');
    }
  };

  const publishSocialMediaPost = async (eventId: number, postId: number, platform: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/publish-social-post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, platform })
      });
      
      if (response.ok) {
        // Update the post status
        setEvent(prev => {
          if (!prev) return null;
          return {
            ...prev,
            social_media_posts: prev.social_media_posts.map(post =>
              post.id === postId ? { ...post, status: 'published' } : post
            )
          };
        });
      }
    } catch (error) {
      console.error('Error publishing social media post:', error);
    }
  };

  const markEventActive = async (eventId: number) => {
    try {
      const response = await eventAPI.updateEventStatus(eventId, 'active');
      if (response.data) {
        toast.success(t('toasts.eventActivated'));
        fetchEvent(); // Refresh the event
      } else {
        toast.error(t('toasts.eventActivateError', { error: response.error || t('toasts.unexpectedError') }));
      }
    } catch (error) {
      console.error('Error marking event as active:', error);
      toast.error(t('toasts.unexpectedError'));
    }
  };

  const markEventInactive = async (eventId: number) => {
    try {
      const response = await eventAPI.updateEventStatus(eventId, 'inactive');
      if (response.data) {
        toast.success(t('toasts.eventDeactivated'));
        fetchEvent(); // Refresh the event
      } else {
        toast.error(t('toasts.eventDeactivateError', { error: response.error || t('toasts.unexpectedError') }));
      }
    } catch (error) {
      console.error('Error marking event as inactive:', error);
      toast.error(t('toasts.unexpectedError'));
    }
  };

  const fetchEvent = async () => {
    if (!eventId) return;
    try {
      const response = await eventAPI.getEventById(parseInt(eventId));
      if (response.data) {
        setEvent(response.data);
        setEventForm(response.data);
      } else {
        console.error('Error fetching event:', response.error);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  // Move isCreator up so it is available for useEffect
  const isCreator = event?.created_by === parseInt(localStorage.getItem('user_id') || '0');

  useEffect(() => {
    fetchEvent();
    if (eventId) {
      fetchTeamMembers(parseInt(eventId));
    }
  }, [eventId]);

  // Load user projects when add member modal opens
  useEffect(() => {
    if (showAddMemberModal) {
      fetchUserProjects();
    }
  }, [showAddMemberModal]);

  // Update selectedLanguage if i18n.language changes
  // useEffect(() => {
  //   setSelectedLanguage(i18n.language || 'en');
  // }, [i18n.language]);

  // Fetch pending invites for this event's projects (for organizer)
  const fetchPendingInvites = async () => {
    const user = localStorage.getItem('user');
    const userData = user ? JSON.parse(user) : null;
    const userId = userData?.id || localStorage.getItem('user_id');
    if (!userId || !event) return;
    try {
      // Get all team_invite notifications sent by this user for projects in this event
      const response = await notificationAPI.getNotifications(
        parseInt(userId),
        false,
        'team_invite',
        100,
        0
      );
      if (response.data) {
        // Filter for invites related to this event's projects and still pending
        const eventProjectIds = userProjects.filter(p => p.event_id === event.id).map(p => p.id);
        const pending = response.data.filter(
          (n: any) => n.metadata?.status === 'pending' && eventProjectIds.includes(n.project_id)
        );
        setPendingInvites(pending);
      }
    } catch (error) {
      setPendingInvites([]);
    }
  };

  // Fetch pending invites when event or userProjects change
  useEffect(() => {
    if (isCreator && event && userProjects.length > 0) {
      fetchPendingInvites();
    }
  }, [event, userProjects, isCreator]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (eventForm && event) {
      try {
        const response = await eventAPI.updateEvent(event.id, eventForm);
        if (response.data) {
          toast.success(t('toasts.eventUpdated'));
          setEvent(response.data);
          setIsEditing(false);
        } else {
          toast.error(t('toasts.eventUpdateError', { error: response.error || t('toasts.unexpectedError') }));
        }
      } catch (error) {
        console.error('Error updating event:', error);
        toast.error(t('toasts.unexpectedError'));
      }
    }
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

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">{t('eventNotFound')}</h2>
          <button
            onClick={() => navigate('/events')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition"
          >
            {t('backToEvents')}
          </button>
        </div>
      </div>
    );
  }

  const eventTypeColor = getEventTypeColor(event.event_type);
  const statusColor = getStatusColor(event.status);
  const formattedBudget = formatCurrency(event.budget);
  console.log(event.organizer);
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
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/events')}
              className="text-purple-400 hover:text-purple-300 mb-2 flex items-center"
            >
              ← {t('backToEvents')}
            </button>
            <h1 className="text-3xl font-bold text-white">{event.title}</h1>
            <p className="text-gray-300">{t('eventDetails')}</p>
          </div>
          {isCreator && (
            <div className="flex items-center space-x-3">
              <button
                onClick={handleEdit}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                {t('editEvent')}
              </button>
              {event.status === 'draft' && (
                <button
                  onClick={() => markEventActive(event.id)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition"
                >
                  {t('activateEvent')}
                </button>
              )}
              {event.status === 'active' && (
                <button
                  onClick={() => markEventInactive(event.id)}
                  className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-pink-700 transition"
                >
                  {t('deactivateEvent')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Event Header Card */}
        <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <PublicProfileAvatar userId={event.organizer.id} name={event.organizer.name} size={40} />
                  <span className="text-lg font-semibold text-white">{event.organizer.name}</span>
                </div>
                <div className="flex items-center space-x-3 mb-3">
                  <Badge className={eventTypeColor}>
                    {event.event_type}
                  </Badge>
                  <Badge className={statusColor}>
                    {event.status}
                  </Badge>
                  <Badge variant="outline" className="border-purple-700 text-purple-300">
                    {event.category}
                  </Badge>
                </div>
                <p className="text-gray-300 text-lg mb-4">{event.description}</p>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setShowSocialMediaModal(true);
                      generateSocialMediaPosts(event.id, setEvent, setShowSocialMediaModal, API_BASE_URL);
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition flex items-center shadow-lg hover:shadow-xl"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    {t('socialMedia')}
                  </button>
                  <button
                    onClick={() => joinEvent(event.id, fetchEvent, API_BASE_URL, t)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition flex items-center shadow-lg hover:shadow-xl"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {t('joinEvent')}
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Event Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Event Info */}
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-400" />
                {t('eventDetailsSection')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center text-gray-300">
                <MapPin className="h-4 w-4 mr-2 text-blue-400" />
                <span>{event.location}, {event.state}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Calendar className="h-4 w-4 mr-2 text-green-400" />
                <span>{new Date(event.start_date).toLocaleDateString()} - {new Date(event.end_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-gray-300">
                <Users className="h-4 w-4 mr-2 text-purple-400" />
                <span>{event.current_participants}/{event.max_participants} {t('participants')}</span>
              </div>
              {event.prize_pool > 0 && (
                <div className="flex items-center text-gray-300">
                  <Award className="h-4 w-4 mr-2 text-yellow-400" />
                  <span>{formatCurrency(event.prize_pool)} {t('prizePool')}</span>
                </div>
              )}
              <div className="flex items-center text-gray-300">
                <DollarSign className="h-4 w-4 mr-2 text-green-400" />
                <span>{formatCurrency(event.budget)} {t('budget')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Skills & Requirements */}
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Target className="h-5 w-5 mr-2 text-blue-400" />
                {t('skillsRequirements')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">{t('requiredSkills')}</h4>
                  <div className="flex flex-wrap gap-1">
                    {event.skills_required.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-blue-700 text-blue-300">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">{t('tags')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <span key={index} className="bg-purple-900/50 text-purple-300 border border-purple-700 px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Impact Metrics */}
          <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
                {t('impactMetrics')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">{t('targetParticipants')}</span>
                <span className="text-white font-semibold">{event.impact_metrics.participants_target}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">{t('skillsDeveloped')}</span>
                <span className="text-white font-semibold">{event.impact_metrics.skills_developed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">{t('projectsCreated')}</span>
                <span className="text-white font-semibold">{event.impact_metrics.projects_created}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">{t('employmentGenerated')}</span>
                <span className="text-white font-semibold">{event.impact_metrics.employment_generated}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Marketing Highlights & Success Metrics & Agenda */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Marketing Highlights */}
          <Card className="bg-gradient-to-br from-purple-900/30 to-purple-900/10 border border-purple-700/40">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-400" />
                Marketing Highlights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {event.marketing_highlights && event.marketing_highlights.length > 0 ? (
                <ul className="list-disc pl-5 text-purple-100 space-y-1">
                  {event.marketing_highlights.map((highlight, idx) => (
                    <li key={idx}>{highlight}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-purple-200">No marketing highlights provided.</p>
              )}
            </CardContent>
          </Card>

          {/* Success Metrics */}
          <Card className="bg-gradient-to-br from-green-900/30 to-green-900/10 border border-green-700/40">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-400" />
                Success Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {event.success_metrics && event.success_metrics.length > 0 ? (
                <ul className="list-disc pl-5 text-green-100 space-y-1">
                  {event.success_metrics.map((metric, idx) => (
                    <li key={idx}>{metric}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-green-200">No success metrics provided.</p>
              )}
            </CardContent>
          </Card>

          {/* Agenda / Sections */}
          <Card className="bg-gradient-to-br from-blue-900/30 to-blue-900/10 border border-blue-700/40">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-400" />
                Agenda / Sections
              </CardTitle>
            </CardHeader>
            <CardContent>
              {event.sections && event.sections.length > 0 ? (
                <div className="space-y-4">
                  {event.sections.map((section, idx) => (
                    <div key={idx} className="border-l-4 border-blue-700 pl-4 py-2 bg-blue-900/10 rounded">
                      <h4 className="text-blue-200 font-semibold mb-1">{section.title}</h4>
                      <p className="text-blue-100 mb-1">{section.description}</p>
                      {section.key_points && section.key_points.length > 0 && (
                        <div className="mb-1">
                          <span className="text-xs text-blue-300 font-medium">Key Points: </span>
                          <span className="text-xs text-blue-100">{section.key_points.join(', ')}</span>
                        </div>
                      )}
                      {section.target_audience && (
                        <div className="mb-1">
                          <span className="text-xs text-blue-300 font-medium">Target Audience: </span>
                          <span className="text-xs text-blue-100">{section.target_audience}</span>
                        </div>
                      )}
                      {section.expected_outcome && (
                        <div>
                          <span className="text-xs text-blue-300 font-medium">Expected Outcome: </span>
                          <span className="text-xs text-blue-100">{section.expected_outcome}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-blue-200">No agenda/sections provided.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Team Management Section */}
        <Card className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-400" />
                {t('teamManagement')}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-teal-700 transition flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addMember')}
                </button>
                <button
                  onClick={() => createProjectForEvent(event.id, event, fetchTeamMembers, t)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition flex items-center"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  {t('createProject')}
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Team Members */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">{t('currentTeam')}</h4>
                {loadingTeamMembers ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-gray-400 mt-2">{t('loadingTeamMembers')}</p>
                  </div>
                ) : teamMembers.length === 0 ? (
                  <div className="text-center py-4">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400">{t('noTeamMembers')}</p>
                    <p className="text-gray-500 text-sm">{t('noTeamMembersMessage')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teamMembers.map((member, index) => (
                      <div key={`${member.project_id}-${member.user_id || index}`} className="bg-gray-800/30 border border-gray-600 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <PublicProfileAvatar userId={member.user_id} name={member.name} size={32} />
                              {member.role === 'Team Leader' && (
                                <Badge className="bg-yellow-900/80 text-yellow-200 border-yellow-600 text-xs flex items-center">
                                  <Crown className="h-3 w-3 mr-1 text-yellow-300" />
                                  Team Leader
                                </Badge>
                              )}
                              {member.user_id && (
                                <Badge className="bg-green-900/50 text-green-300 border-green-700 text-xs">
                                  <User className="h-3 w-3 mr-1" />
                                  {t('realUser')}
                                </Badge>
                              )}
                              {member.user_id === getCurrentUserId() && (
                                <Badge className="bg-purple-900/50 text-purple-300 border-purple-700 text-xs">
                                  <Crown className="h-3 w-3 mr-1" />
                                  {t('you')}
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm">{member.role}</p>
                            {member.project_title && (
                              <p className="text-gray-500 text-xs">{t('project')} {member.project_title}</p>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {member.skills.slice(0, 3).map((skill: string, skillIndex: number) => (
                                <Badge key={skillIndex} variant="outline" className="text-xs border-blue-700 text-blue-300">
                                  {skill}
                                </Badge>
                              ))}
                              {member.skills.length > 3 && (
                                <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                                  {t('moreSkills', { count: member.skills.length - 3 })}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {member.user_id && member.project_id && (
                            <button 
                              onClick={() => removeTeamMember(member.project_id, member.user_id, event, fetchTeamMembers, API_BASE_URL)}
                              className="text-red-400 hover:text-red-300 transition p-1"
                              title="Remove from team"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Project Ideas */}
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">{t('projectIdeas')}</h4>
                <div className="space-y-3">
                  <div className="bg-gray-800/30 border border-gray-600 rounded-lg p-3">
                    <h5 className="text-white font-medium mb-1">{t('projectIdeasList.cropDisease.title')}</h5>
                    <p className="text-gray-400 text-sm mb-2">{t('projectIdeasList.cropDisease.description')}</p>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-purple-900/50 text-purple-300 border-purple-700">
                        {t('categories.ai_ml')}
                      </Badge>
                      <button className="text-blue-400 hover:text-blue-300 text-sm">
                        {t('viewDetails')}
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/30 border border-gray-600 rounded-lg p-3">
                    <h5 className="text-white font-medium mb-1">{t('projectIdeasList.digitalLiteracy.title')}</h5>
                    <p className="text-gray-400 text-sm mb-2">{t('projectIdeasList.digitalLiteracy.description')}</p>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-blue-900/50 text-blue-300 border-blue-700">
                        {t('categories.education')}
                      </Badge>
                      <button className="text-blue-400 hover:text-blue-300 text-sm">
                        {t('viewDetails')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Media Posts Modal */}
        {showSocialMediaModal && event && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            <div className="glassmorphism-card rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
              <button
                onClick={() => setShowSocialMediaModal(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 bg-gray-800/50 hover:bg-gray-700/50 p-2 rounded-full backdrop-blur-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <h2 className="text-2xl font-bold text-white mb-6">{t('socialMediaPosts')}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {event.social_media_posts.map((post, index) => (
                  <Card key={index} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center justify-between">
                        <span className="capitalize">{post.platform}</span>
                        <Badge className={post.status === 'published' ? 'bg-green-900/50 text-green-300' : 'bg-yellow-900/50 text-yellow-300'}>
                          {post.status === 'published' ? t('published') : t('draft')}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 mb-4">{post.content}</p>
                      {post.hashtags && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {post.hashtags.map((tag: string, tagIndex: number) => (
                            <span key={tagIndex} className="text-blue-400 text-sm">#{tag}</span>
                          ))}
                        </div>
                      )}
                      {post.status !== 'published' && (
                        <button
                          onClick={() => publishSocialMediaPost(event.id, post.id, post.platform)}
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition"
                        >
                          {t('publishTo', { platform: post.platform })}
                        </button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Member Modal */}
        {showAddMemberModal && (
          <div className="fixed inset-0 bg-black/80 flex items-start justify-center p-4 z-[9999] pt-20">
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-gray-700/70 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto relative mt-8">
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setSelectedUser(null);
                  setSelectedProject(null);
                  setNewMemberSkills('');
                }}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <h2 className="text-2xl font-bold mb-6 text-white">{t('addTeamMember')}</h2>
              
              <div className="space-y-4">
                {/* Search Users */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('searchUsers')}</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder={t('searchByNameOrPhone')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                      value={searchUserQuery}
                      onChange={(e) => {
                        setSearchUserQuery(e.target.value);
                        searchUsers(e.target.value);
                      }}
                    />
                  </div>
                  
                  {/* User Results */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 max-h-40 overflow-y-auto border border-gray-700 rounded-lg">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => setSelectedUser(user)}
                          className={`w-full text-left p-3 hover:bg-gray-700/50 transition ${
                            selectedUser?.id === user.id ? 'bg-purple-700/50' : ''
                          }`}
                        >
                          <div className="text-white font-medium">{user.name}</div>
                          <div className="text-gray-400 text-sm">{user.phone}</div>
                          <div className="text-gray-500 text-xs capitalize">{user.user_type}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Selected User */}
                {selectedUser && (
                  <div className="bg-gray-800/30 border border-gray-600 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <PublicProfileAvatar userId={selectedUser.id} name={selectedUser.name} size={32} />
                      <div>
                        <div className="text-white font-medium">{selectedUser.name}</div>
                        <div className="text-gray-400 text-sm">{selectedUser.phone}</div>
                        <div className="text-gray-500 text-xs capitalize">{selectedUser.user_type}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('skills')}</label>
                  <input
                    type="text"
                    placeholder={t('skillsPlaceholder')}
                    className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                    value={newMemberSkills}
                    onChange={(e) => setNewMemberSkills(e.target.value)}
                  />
                </div>
                
                {/* Project Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('addToProject')}</label>
                  <select 
                    value={selectedProject?.id || ''}
                    onChange={(e) => {
                      const project = userProjects.find(p => p.id === parseInt(e.target.value));
                      setSelectedProject(project || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white"
                  >
                    <option value="">{t('selectProject')}</option>
                    {userProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                  {userProjects.length === 0 && (
                    <p className="text-gray-500 text-sm mt-1">{t('noProjectsFound')}</p>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowAddMemberModal(false)}
                    className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700/50 transition text-gray-300 hover:text-white"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={() => addTeamMember()}
                    disabled={!selectedProject || !selectedUser || !newMemberSkills}
                    className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t('addMember')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Event Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            <div className="glassmorphism-card rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
              <button
                onClick={() => setIsEditing(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 bg-gray-800/50 hover:bg-gray-700/50 p-2 rounded-full backdrop-blur-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <h2 className="text-2xl font-bold text-white mb-6">{t('editEventTitle')}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('eventTitle')}</label>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('eventType')}</label>
                    <select
                      value={eventForm.event_type}
                      onChange={(e) => setEventForm(prev => ({ ...prev, event_type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white"
                    >
                      <option value="hackathon">{t('eventTypes.hackathon')}</option>
                      <option value="workshop">{t('eventTypes.workshop')}</option>
                      <option value="competition">{t('eventTypes.competition')}</option>
                      <option value="training">{t('eventTypes.training')}</option>
                      <option value="meetup">{t('eventTypes.meetup')}</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('category')}</label>
                    <input
                      type="text"
                      value={eventForm.category}
                      onChange={(e) => setEventForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('location')}</label>
                    <input
                      type="text"
                      value={eventForm.location}
                      onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('state')}</label>
                    <input
                      type="text"
                      value={eventForm.state}
                      onChange={(e) => setEventForm(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('startDate')}</label>
                    <input
                      type="datetime-local"
                      value={eventForm.start_date}
                      onChange={(e) => setEventForm(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('endDate')}</label>
                    <input
                      type="datetime-local"
                      value={eventForm.end_date}
                      onChange={(e) => setEventForm(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('maxParticipants')}</label>
                    <input
                      type="number"
                      value={eventForm.max_participants}
                      onChange={(e) => setEventForm(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('budget')}</label>
                    <input
                      type="number"
                      value={eventForm.budget}
                      onChange={(e) => setEventForm(prev => ({ ...prev, budget: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('prizePool')}</label>
                    <input
                      type="number"
                      value={eventForm.prize_pool}
                      onChange={(e) => setEventForm(prev => ({ ...prev, prize_pool: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white"
                      min="0"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('description')}</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('requiredSkillsInput')}</label>
                  <input
                    type="text"
                    value={eventForm.skills_required.join(', ')}
                    onChange={(e) => setEventForm(prev => ({ 
                      ...prev, 
                      skills_required: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                    }))}
                    className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                    placeholder={t('skillsPlaceholderInput')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('tagsInput')}</label>
                  <input
                    type="text"
                    value={eventForm.tags.join(', ')}
                    onChange={(e) => setEventForm(prev => ({ 
                      ...prev, 
                      tags: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                    }))}
                    className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                    placeholder={t('tagsPlaceholderInput')}
                  />
                </div>
                
                {isEditing && isCreator && (
                  <>
                    {/* Marketing Highlights */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Marketing Highlights</label>
                      <textarea
                        value={eventForm.marketing_highlights?.join('\n') || ''}
                        onChange={e => setEventForm(prev => ({ ...prev, marketing_highlights: e.target.value.split('\n').filter(Boolean) }))}
                        className="w-full px-3 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-900/20 text-white placeholder-gray-400 transition min-h-[60px]"
                        placeholder="One highlight per line"
                      />
                    </div>
                    {/* Success Metrics */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Success Metrics</label>
                      <textarea
                        value={eventForm.success_metrics?.join('\n') || ''}
                        onChange={e => setEventForm(prev => ({ ...prev, success_metrics: e.target.value.split('\n').filter(Boolean) }))}
                        className="w-full px-3 py-2 border border-green-500/30 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-green-900/20 text-white placeholder-gray-400 transition min-h-[60px]"
                        placeholder="One metric per line"
                      />
                    </div>
                    {/* Sections (Agenda) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Event Sections / Agenda</label>
                      {(eventForm.sections || []).map((section, idx) => (
                        <div key={idx} className="mb-2 border border-blue-700/30 rounded-lg p-2 bg-blue-900/10">
                          <input
                            type="text"
                            value={section.title}
                            onChange={e => setEventForm(prev => ({
                              ...prev,
                              sections: prev.sections?.map((s, i) => i === idx ? { ...s, title: e.target.value } : s)
                            }))}
                            className="w-full mb-1 px-2 py-1 rounded bg-blue-900/20 text-white border border-blue-700/30"
                            placeholder="Section Title"
                          />
                          <textarea
                            value={section.description}
                            onChange={e => setEventForm(prev => ({
                              ...prev,
                              sections: prev.sections?.map((s, i) => i === idx ? { ...s, description: e.target.value } : s)
                            }))}
                            className="w-full mb-1 px-2 py-1 rounded bg-blue-900/20 text-white border border-blue-700/30"
                            placeholder="Section Description"
                          />
                          <input
                            type="text"
                            value={section.key_points?.join(', ') || ''}
                            onChange={e => setEventForm(prev => ({
                              ...prev,
                              sections: prev.sections?.map((s, i) => i === idx ? { ...s, key_points: e.target.value.split(',').map(k => k.trim()).filter(Boolean) } : s)
                            }))}
                            className="w-full mb-1 px-2 py-1 rounded bg-blue-900/20 text-white border border-blue-700/30"
                            placeholder="Key Points (comma separated)"
                          />
                          <input
                            type="text"
                            value={section.target_audience || ''}
                            onChange={e => setEventForm(prev => ({
                              ...prev,
                              sections: prev.sections?.map((s, i) => i === idx ? { ...s, target_audience: e.target.value } : s)
                            }))}
                            className="w-full mb-1 px-2 py-1 rounded bg-blue-900/20 text-white border border-blue-700/30"
                            placeholder="Target Audience"
                          />
                          <input
                            type="text"
                            value={section.expected_outcome || ''}
                            onChange={e => setEventForm(prev => ({
                              ...prev,
                              sections: prev.sections?.map((s, i) => i === idx ? { ...s, expected_outcome: e.target.value } : s)
                            }))}
                            className="w-full px-2 py-1 rounded bg-blue-900/20 text-white border border-blue-700/30"
                            placeholder="Expected Outcome"
                          />
                          <button
                            type="button"
                            className="mt-1 text-xs text-red-400 hover:text-red-600"
                            onClick={() => setEventForm(prev => ({
                              ...prev,
                              sections: prev.sections?.filter((_, i) => i !== idx)
                            }))}
                          >Remove Section</button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="mt-2 px-3 py-1 bg-blue-700/60 text-white rounded hover:bg-blue-800/80"
                        onClick={() => setEventForm(prev => ({
                          ...prev,
                          sections: [...(prev.sections || []), { title: '', description: '', key_points: [], target_audience: '', expected_outcome: '' }]
                        }))}
                      >Add Section</button>
                    </div>
                  </>
                )}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-700/50 transition text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition"
                  >
                    Update Event
                  </button>
                </div>
              </form>
            </div>
          </div>
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


export default EventDetails;
