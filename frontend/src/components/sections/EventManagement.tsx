import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Calendar, MapPin, Users, DollarSign, Target, 
  TrendingUp, Award, Activity, Search, Plus,
  Share2, MessageSquare, Eye, Edit, Trash2,
  Clock, Tag, Building2, Globe, Star, Mic, MicOff,
  User, Crown, UserPlus
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { eventAPI, projectAPI, userAPI, notificationAPI, Event, EventCreate, EventUpdate, Project, User as ApiUser, SocialMediaPost, TeamInviteCreate } from '../../lib/api';
import { useNavigate } from 'react-router-dom';

interface EventForm {
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
}

interface ValidationErrors {
  title?: string;
  description?: string;
  category?: string;
  location?: string;
  state?: string;
  start_date?: string;
  end_date?: string;
  max_participants?: string;
  budget?: string;
  prize_pool?: string;
  skills_required?: string;
  tags?: string;
  general?: string;
}

const EventManagement: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedEvent, setTranslatedEvent] = useState<any>(null);
  const [eventForm, setEventForm] = useState<EventForm>({
    title: '',
    description: '',
    event_type: 'hackathon',
    category: '',
    location: '',
    state: '',
    start_date: '',
    end_date: '',
    max_participants: 50,
    budget: 0,
    prize_pool: 0,
    skills_required: [],
    tags: []
  });
  const [voicePrompt, setVoicePrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const { i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const navigate = useNavigate();

  // Validation functions
  const validateEventForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    // Required field validations
    if (!eventForm.title.trim()) {
      errors.title = 'Event title is required';
    } else if (eventForm.title.trim().length < 5) {
      errors.title = 'Event title must be at least 5 characters long';
    }
    
    if (!eventForm.description.trim()) {
      errors.description = 'Event description is required';
    } else if (eventForm.description.trim().length < 20) {
      errors.description = 'Event description must be at least 20 characters long';
    }
    
    if (!eventForm.category.trim()) {
      errors.category = 'Event category is required';
    }
    
    if (!eventForm.location.trim()) {
      errors.location = 'Event location is required';
    }
    
    if (!eventForm.state.trim()) {
      errors.state = 'Event state is required';
    }
    
    if (!eventForm.start_date) {
      errors.start_date = 'Start date is required';
    }
    
    if (!eventForm.end_date) {
      errors.end_date = 'End date is required';
    }
    
    // Date validation
    if (eventForm.start_date && eventForm.end_date) {
      const startDate = new Date(eventForm.start_date);
      const endDate = new Date(eventForm.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        errors.start_date = 'Start date cannot be in the past';
      }
      
      if (endDate <= startDate) {
        errors.end_date = 'End date must be after start date';
      }
    }
    
    // Number validations
    if (eventForm.max_participants <= 0) {
      errors.max_participants = 'Maximum participants must be greater than 0';
    } else if (eventForm.max_participants > 10000) {
      errors.max_participants = 'Maximum participants cannot exceed 10,000';
    }
    
    if (eventForm.budget < 0) {
      errors.budget = 'Budget cannot be negative';
    }
    
    if (eventForm.prize_pool < 0) {
      errors.prize_pool = 'Prize pool cannot be negative';
    }
    
    // Skills and tags validation
    if (eventForm.skills_required.length === 0) {
      errors.skills_required = 'At least one skill is required';
    }
    
    if (eventForm.tags.length === 0) {
      errors.tags = 'At least one tag is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearValidationErrors = () => {
    setValidationErrors({});
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // Update selectedLanguage if i18n.language changes
  useEffect(() => {
    setSelectedLanguage(i18n.language || 'en');
  }, [i18n.language]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getEvents();
      if (response.data) {
        setEvents(response.data);
      } else if (response.error) {
        console.error('Error fetching events:', response.error);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const translateEventData = async (eventData: any) => {
    setTranslating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          json: eventData,
          target_language: i18n.language
        })
      });
      if (response.ok) {
        const translated = await response.json();
        setTranslatedEvent(translated);
        // Update the form with translated data
        setEventForm(prev => ({
          ...prev,
          title: translated.title || prev.title,
          description: translated.description || prev.description,
          skills_required: translated.skills_required || prev.skills_required,
          tags: translated.tags || prev.tags
        }));
      }
    } catch (error) {
      console.error('Error translating event:', error);
    } finally {
      setTranslating(false);
    }
  };

  const generateEventWithAI = async (customPrompt?: string) => {
    setAiGenerating(true);
    try {
      const prompt = customPrompt || voicePrompt ||
        `Create a ${eventForm.event_type} event that focuses on ${eventForm.category || 'skill development'}. Location: ${eventForm.location}, ${eventForm.state}. Budget: ${eventForm.budget}, Prize Pool: ${eventForm.prize_pool}`;
      const response = await fetch(`${API_BASE_URL}/api/events/generate-with-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          event_type: eventForm.event_type,
          language: i18n.language
        })
      });
      if (response.ok) {
        const generatedEvent = await response.json();
        setEventForm(prev => ({
          ...prev,
          title: generatedEvent.title || prev.title,
          description: generatedEvent.description || prev.description,
          skills_required: generatedEvent.skills_required || prev.skills_required,
          tags: generatedEvent.tags || prev.tags,
          category: generatedEvent.category || prev.category,
        }));
        // Store the generated event for translation
        setTranslatedEvent(generatedEvent);
      }
    } catch (error) {
      console.error('Error generating event with AI:', error);
    } finally {
      setAiGenerating(false);
    }
  };

  const createEvent = async () => {
    // Clear previous validation errors
    clearValidationErrors();
    
    // Validate form before submission
    if (!validateEventForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await eventAPI.createEvent(eventForm);
      
      if (response.data) {
        setEvents(prev => [response.data!, ...prev]);
        setShowCreateModal(false);
        setEventForm({
          title: '',
          description: '',
          event_type: 'hackathon',
          category: '',
          location: '',
          state: '',
          start_date: '',
          end_date: '',
          max_participants: 50,
          budget: 0,
          prize_pool: 0,
          skills_required: [],
          tags: []
        });
        clearValidationErrors();
        alert('Event created successfully!');
      } else if (response.error) {
        console.error('Error creating event:', response.error);
        setValidationErrors({ general: response.error });
      }
    } catch (error) {
      console.error('Error creating event:', error);
      setValidationErrors({ general: 'Failed to create event. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || event.event_type === filterType;
    const matchesStatus = filterStatus === 'all' || event.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getEventTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      hackathon: 'bg-purple-100 text-purple-800',
      workshop: 'bg-blue-100 text-blue-800',
      competition: 'bg-red-100 text-red-800',
      training: 'bg-green-100 text-green-800',
      meetup: 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      ongoing: 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-lg text-white">Loading Events...</p>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Event Management</h1>
            <p className="text-gray-300">AI-Powered Hackathon & Event Platform</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create Event</span>
          </button>
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
                    placeholder="Search events..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white"
              >
                <option value="all">All Types</option>
                <option value="hackathon">Hackathon</option>
                <option value="workshop">Workshop</option>
                <option value="competition">Competition</option>
                <option value="training">Training</option>
                <option value="meetup">Meetup</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="glassmorphism-light border border-gray-700/50 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105" onClick={() => navigate(`/events/${event.id}`)}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-white mb-2">
                      {event.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getEventTypeColor(event.event_type)}>
                        {event.event_type}
                      </Badge>
                      <Badge className={getStatusColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/events/${event.id}`);
                      }}
                      className="p-2 text-gray-400 hover:text-purple-400 transition-all duration-300 hover:scale-110"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {event.description}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(event.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}, {event.state}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>{event.current_participants}/{event.max_participants} participants</span>
                  </div>
                  {event.prize_pool > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Award className="h-4 w-4" />
                      <span>{formatCurrency(event.prize_pool)} prize pool</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {event.tags.slice(0, 3).map((tag, index) => (
                    <span key={index} className="bg-purple-900/50 text-purple-300 border border-purple-700 px-2 py-1 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                  {event.tags.length > 3 && (
                    <span className="bg-purple-900/50 text-purple-300 border border-purple-700 px-2 py-1 rounded text-xs">
                      +{event.tags.length - 3} more
                    </span>
                  )}
                </div>      
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Event Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            {/* Modal content */}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventManagement;