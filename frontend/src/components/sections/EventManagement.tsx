import React, { useState, useEffect, useRef } from 'react';
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
import { eventAPI, projectAPI, userAPI, notificationAPI, sttAPI, Event, EventCreate, EventUpdate, Project, User as ApiUser, SocialMediaPost, TeamInviteCreate } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import PublicProfileAvatar from '../ui/PublicProfileAvatar';

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
  marketing_highlights?: string[];
  success_metrics?: string[];
  sections?: { title: string; description: string; key_points?: string[]; target_audience?: string; expected_outcome?: string }[];
  organizer: {
    id: number;
    name: string;
    type: 'company' | 'ngo' | 'individual';
    logo?: string;
  };
  impact_metrics: {
    participants_target: number;
    skills_developed: number;
    projects_created: number;
    employment_generated: number;
  };
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
  const { i18n, t } = useTranslation('event-management');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all')
  // AI and translation state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatedEvent, setTranslatedEvent] = useState<any>(null);
  const [voicePrompt, setVoicePrompt] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
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
    tags: [],
    marketing_highlights: [],
    success_metrics: [],
    sections: [],
    organizer: {
      id: 1,
      name: '',
      type: 'company',
      logo: '',
    },
    impact_metrics: {
      participants_target: 0,
      skills_developed: 0,
      projects_created: 0,
      employment_generated: 0,
    },
  });
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Add state for user search
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<ApiUser[]>([]);
  const [searching, setSearching] = useState(false);
  // Add state to control visibility of user search UI
  const [showUserSearch, setShowUserSearch] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const navigate = useNavigate();

  // Validation functions
  const validateEventForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    // Required field validations
    if (!eventForm.title.trim()) {
      errors.title = t('validation.titleRequired');
    } else if (eventForm.title.trim().length < 5) {
      errors.title = t('validation.titleMinLength');
    }
    
    if (!eventForm.description.trim()) {
      errors.description = t('validation.descriptionRequired');
    } else if (eventForm.description.trim().length < 20) {
      errors.description = t('validation.descriptionMinLength');
    }
    
    if (!eventForm.category.trim()) {
      errors.category = t('validation.categoryRequired');
    }
    
    if (!eventForm.location.trim()) {
      errors.location = t('validation.locationRequired');
    }
    
    if (!eventForm.state.trim()) {
      errors.state = t('validation.stateRequired');
    }
    
    if (!eventForm.start_date) {
      errors.start_date = t('validation.startDateRequired');
    }
    
    if (!eventForm.end_date) {
      errors.end_date = t('validation.endDateRequired');
    }
    
    // Date validation
    if (eventForm.start_date && eventForm.end_date) {
      const startDate = new Date(eventForm.start_date);
      const endDate = new Date(eventForm.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        errors.start_date = t('validation.startDatePast');
      }
      
      if (endDate <= startDate) {
        errors.end_date = t('validation.endDateInvalid');
      }
    }
    
    // Number validations
    if (eventForm.max_participants <= 0) {
      errors.max_participants = t('validation.maxParticipantsPositive');
    } else if (eventForm.max_participants > 10000) {
      errors.max_participants = t('validation.maxParticipantsLimit');
    }
    
    if (eventForm.budget < 0) {
      errors.budget = t('validation.budgetNegative');
    }
    
    if (eventForm.prize_pool < 0) {
      errors.prize_pool = t('validation.prizePoolNegative');
    }
    
    // Skills and tags validation
    if (eventForm.skills_required.length === 0) {
      errors.skills_required = t('validation.skillsRequired');
    }
    
    if (eventForm.tags.length === 0) {
      errors.tags = t('validation.tagsRequired');
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
      const response = await fetch(`${API_BASE_URL}/translate`, {
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

  // Replace useState for audioChunks with useRef
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startListening = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          audioChunksRef.current = [];
          try {
            // 1. Transcribe audio to text
            const response = await sttAPI.transcribeAudio(audioBlob, selectedLanguage);
            let transcript = '';
            if (response.data && response.data.text) {
              transcript = response.data.text;
              setVoicePrompt(transcript);
              // 2. Use LLM to generate structured event JSON
              const aiResponse = await fetch(`${API_BASE_URL}/api/events/generate-with-ai`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  prompt: transcript,
                  event_type: eventForm.event_type,
                  language: selectedLanguage
                })
              });
              if (aiResponse.ok) {
                const aiEvent = await aiResponse.json();
                // Schema validation: only update known fields
                setEventForm(prev => ({
                  ...prev,
                  title: aiEvent.title || prev.title,
                  description: aiEvent.description || prev.description,
                  category: aiEvent.category || prev.category,
                  skills_required: Array.isArray(aiEvent.skills_required) ? aiEvent.skills_required : prev.skills_required,
                  tags: Array.isArray(aiEvent.tags) ? aiEvent.tags : prev.tags,
                  marketing_highlights: Array.isArray(aiEvent.marketing_highlights) ? aiEvent.marketing_highlights : prev.marketing_highlights,
                  success_metrics: Array.isArray(aiEvent.success_metrics) ? aiEvent.success_metrics : prev.success_metrics,
                  sections: Array.isArray(aiEvent.sections) ? aiEvent.sections : prev.sections,
                }));
              } else {
                setSpeechError(t('toast.aiGenerationFailed'));
              }
            } else {
              setSpeechError(t('toast.noTranscript'));
            }
          } catch (error) {
            setSpeechError(t('toast.transcriptionError'));
          }
        };

        recorder.start();
        setIsListening(true);
      } catch (error) {
        setSpeechError(t('toast.microphoneAccessDenied'));
      }
    } else {
      setSpeechSupported(false);
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
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
          tags: [],
          marketing_highlights: [],
          success_metrics: [],
          sections: [],
          organizer: {
            id: 1,
            name: '',
            type: 'company',
            logo: '',
          },
          impact_metrics: {
            participants_target: 0,
            skills_developed: 0,
            projects_created: 0,
            employment_generated: 0,
          },
        });
        clearValidationErrors();
        toast.success(t('toast.eventCreated'), { style: { background: 'rgba(30, 0, 60, 0.8)', color: '#fff', border: '1px solid #a259ec', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' } });
      } else if (response.error) {
        console.error('Error creating event:', response.error);
        setValidationErrors({ general: response.error });
      }
    } catch (error) {
      console.error('Error creating event:', error);
      setValidationErrors({ general: t('validation.createFailed') });
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

  const handleUserSearch = async () => {
    if (!userSearchTerm.trim()) {
      toast.error('Please enter a name, phone, or organization to search.');
      return;
    }
    setSearching(true);
    try {
      const response = await userAPI.searchUsers(userSearchTerm);
      if (response.data) setUserSearchResults(response.data);
      else setUserSearchResults([]);
    } catch (e) {
      setUserSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddToTeam = async (user: ApiUser) => {
    try {
      const invite = {
        inviter_id: parseInt(localStorage.getItem('user_id') || '0'),
        invitee_id: user.id,
        project_id: 0, // or event/project context
        role: 'Member',
        skills: [],
        message: '',
      };
      const response = await notificationAPI.sendTeamInvite(invite);
      if (response.data) toast.success('Team invite sent!');
      else toast.error(response.error || 'Failed to send invite');
    } catch (e) {
      toast.error('Failed to send invite');
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
            <h1 className="text-3xl font-bold text-white">{t('pageTitle')}</h1>
            <p className="text-gray-300">{t('pageSubtitle')}</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>{t('createEvent')}</span>
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
                    placeholder={t('searchPlaceholder')}
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
                <option value="all">{t('filters.allTypes')}</option>
                <option value="hackathon">{t('eventTypes.hackathon')}</option>
                <option value="workshop">{t('eventTypes.workshop')}</option>
                <option value="competition">{t('eventTypes.competition')}</option>
                <option value="training">{t('eventTypes.training')}</option>
                <option value="meetup">{t('eventTypes.meetup')}</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-800/50 text-white"
              >
                <option value="all">{t('filters.allStatus')}</option>
                <option value="draft">{t('eventStatus.draft')}</option>
                <option value="active">{t('eventStatus.active')}</option>
                <option value="ongoing">{t('eventStatus.ongoing')}</option>
                <option value="completed">{t('eventStatus.completed')}</option>
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
                        {t(`eventTypes.${event.event_type}`)}
                      </Badge>
                      <Badge className={getStatusColor(event.status)}>
                        {t(`eventStatus.${event.status}`)}
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
                    <span>{event.current_participants}/{event.max_participants} {t('eventCard.participants')}</span>
                  </div>
                  {event.prize_pool > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                      <Award className="h-4 w-4" />
                      <span>{formatCurrency(event.prize_pool)} {t('eventCard.prizePool')}</span>
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
                      +{event.tags.length - 3} {t('eventCard.more')}
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
            <div className="bg-purple-900/10 backdrop-blur-2xl border border-purple-500/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl shadow-purple-500/20">
              <button
                onClick={() => {
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
                    tags: [],
                    marketing_highlights: [],
                    success_metrics: [],
                    sections: [],
                    organizer: {
                      id: 1,
                      name: '',
                      type: 'company',
                      logo: '',
                    },
                    impact_metrics: {
                      participants_target: 0,
                      skills_developed: 0,
                      projects_created: 0,
                      employment_generated: 0,
                    },
                  });
                  clearValidationErrors();
                }}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110 bg-gray-800/50 hover:bg-gray-700/50 p-2 rounded-full backdrop-blur-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-white mb-6">{t('createEventModal.title')}</h2>
              <form onSubmit={e => { e.preventDefault(); createEvent(); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('createEventModal.eventTitle')}</label>
                    <input
                      type="text"
                      value={eventForm.title}
                      onChange={e => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-900/20 text-white placeholder-gray-400 transition"
                      required
                    />
                    {validationErrors.title && <p className="text-red-400 text-xs mt-1">{validationErrors.title}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('createEventModal.eventType')}</label>
                    <select
                      value={eventForm.event_type}
                      onChange={e => setEventForm(prev => ({ ...prev, event_type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-900/20 text-white transition"
                    >
                      <option value="hackathon">{t('eventTypes.hackathon')}</option>
                      <option value="workshop">{t('eventTypes.workshop')}</option>
                      <option value="competition">{t('eventTypes.competition')}</option>
                      <option value="training">{t('eventTypes.training')}</option>
                      <option value="meetup">{t('eventTypes.meetup')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('createEventModal.category')}</label>
                    <input
                      type="text"
                      value={eventForm.category}
                      onChange={e => setEventForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-900/20 text-white placeholder-gray-400 transition"
                      required
                    />
                    {validationErrors.category && <p className="text-red-400 text-xs mt-1">{validationErrors.category}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('createEventModal.location')}</label>
                    <input
                      type="text"
                      value={eventForm.location}
                      onChange={e => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-900/20 text-white placeholder-gray-400 transition"
                      required
                    />
                    {validationErrors.location && <p className="text-red-400 text-xs mt-1">{validationErrors.location}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('createEventModal.state')}</label>
                    <input
                      type="text"
                      value={eventForm.state}
                      onChange={e => setEventForm(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-3 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-900/20 text-white placeholder-gray-400 transition"
                      required
                    />
                    {validationErrors.state && <p className="text-red-400 text-xs mt-1">{validationErrors.state}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('createEventModal.startDate')}</label>
                    <input
                      type="datetime-local"
                      value={eventForm.start_date}
                      onChange={e => setEventForm(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-900/20 text-white transition"
                      required
                    />
                    {validationErrors.start_date && <p className="text-red-400 text-xs mt-1">{validationErrors.start_date}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('createEventModal.endDate')}</label>
                    <input
                      type="datetime-local"
                      value={eventForm.end_date}
                      onChange={e => setEventForm(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-900/20 text-white transition"
                      required
                    />
                    {validationErrors.end_date && <p className="text-red-400 text-xs mt-1">{validationErrors.end_date}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('createEventModal.maxParticipants')}</label>
                    <input
                      type="number"
                      value={eventForm.max_participants}
                      onChange={e => setEventForm(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-900/20 text-white transition"
                      min="1"
                      required
                    />
                    {validationErrors.max_participants && <p className="text-red-400 text-xs mt-1">{validationErrors.max_participants}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('createEventModal.budget')}</label>
                    <input
                      type="number"
                      value={eventForm.budget}
                      onChange={e => setEventForm(prev => ({ ...prev, budget: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-900/20 text-white transition"
                      min="0"
                    />
                    {validationErrors.budget && <p className="text-red-400 text-xs mt-1">{validationErrors.budget}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('createEventModal.prizePool')}</label>
                    <input
                      type="number"
                      value={eventForm.prize_pool}
                      onChange={e => setEventForm(prev => ({ ...prev, prize_pool: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-900/20 text-white transition"
                      min="0"
                    />
                    {validationErrors.prize_pool && <p className="text-red-400 text-xs mt-1">{validationErrors.prize_pool}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('createEventModal.description')}</label>
                  <textarea
                    value={eventForm.description}
                    onChange={e => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-900/20 text-white placeholder-gray-400 transition"
                    required
                  />
                  {validationErrors.description && <p className="text-red-400 text-xs mt-1">{validationErrors.description}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('createEventModal.requiredSkills')}</label>
                    <input
                      type="text"
                      value={eventForm.skills_required.join(', ')}
                      onChange={e => setEventForm(prev => ({ 
                        ...prev, 
                        skills_required: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                      }))}
                      className="w-full px-3 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-900/20 text-white placeholder-gray-400 transition"
                      placeholder={t('createEventModal.skillsPlaceholder')}
                    />
                    {validationErrors.skills_required && <p className="text-red-400 text-xs mt-1">{validationErrors.skills_required}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('createEventModal.tags')}</label>
                    <input
                      type="text"
                      value={eventForm.tags.join(', ')}
                      onChange={e => setEventForm(prev => ({ 
                        ...prev, 
                        tags: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                      }))}
                      className="w-full px-3 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-900/20 text-white placeholder-gray-400 transition"
                      placeholder={t('createEventModal.tagsPlaceholder')}
                    />
                    {validationErrors.tags && <p className="text-red-400 text-xs mt-1">{validationErrors.tags}</p>}
                  </div>
                </div>
                {/* Marketing Highlights */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('createEventModal.marketingHighlights')}</label>
                  <textarea
                    value={eventForm.marketing_highlights?.join('\n') || ''}
                    onChange={e => setEventForm(prev => ({ ...prev, marketing_highlights: e.target.value.split('\n').filter(Boolean) }))}
                    className="w-full px-3 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-900/20 text-white placeholder-gray-400 transition min-h-[60px]"
                    placeholder={t('createEventModal.marketingHighlightsPlaceholder')}
                  />
                </div>
                {/* Success Metrics */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('createEventModal.successMetrics')}</label>
                  <textarea
                    value={eventForm.success_metrics?.join('\n') || ''}
                    onChange={e => setEventForm(prev => ({ ...prev, success_metrics: e.target.value.split('\n').filter(Boolean) }))}
                    className="w-full px-3 py-2 border border-purple-500/30 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-purple-900/20 text-white placeholder-gray-400 transition min-h-[60px]"
                    placeholder={t('createEventModal.successMetricsPlaceholder')}
                  />
                </div>
                {/* Sections (Agenda) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('createEventModal.eventSections')}</label>
                  {(eventForm.sections || []).map((section, idx) => (
                    <div key={idx} className="mb-2 border border-purple-700/30 rounded-lg p-2 bg-purple-900/10">
                      <input
                        type="text"
                        value={section.title}
                        onChange={e => setEventForm(prev => ({
                          ...prev,
                          sections: prev.sections?.map((s, i) => i === idx ? { ...s, title: e.target.value } : s)
                        }))}
                        className="w-full mb-1 px-2 py-1 rounded bg-purple-900/20 text-white border border-purple-700/30"
                        placeholder={t('createEventModal.sectionTitle')}
                      />
                      <textarea
                        value={section.description}
                        onChange={e => setEventForm(prev => ({
                          ...prev,
                          sections: prev.sections?.map((s, i) => i === idx ? { ...s, description: e.target.value } : s)
                        }))}
                        className="w-full mb-1 px-2 py-1 rounded bg-purple-900/20 text-white border border-purple-700/30"
                        placeholder={t('createEventModal.sectionDescription')}
                      />
                      <input
                        type="text"
                        value={section.key_points?.join(', ') || ''}
                        onChange={e => setEventForm(prev => ({
                          ...prev,
                          sections: prev.sections?.map((s, i) => i === idx ? { ...s, key_points: e.target.value.split(',').map(k => k.trim()).filter(Boolean) } : s)
                        }))}
                        className="w-full mb-1 px-2 py-1 rounded bg-purple-900/20 text-white border border-purple-700/30"
                        placeholder={t('createEventModal.keyPoints')}
                      />
                      <input
                        type="text"
                        value={section.target_audience || ''}
                        onChange={e => setEventForm(prev => ({
                          ...prev,
                          sections: prev.sections?.map((s, i) => i === idx ? { ...s, target_audience: e.target.value } : s)
                        }))}
                        className="w-full mb-1 px-2 py-1 rounded bg-purple-900/20 text-white border border-purple-700/30"
                        placeholder={t('createEventModal.targetAudience')}
                      />
                      <input
                        type="text"
                        value={section.expected_outcome || ''}
                        onChange={e => setEventForm(prev => ({
                          ...prev,
                          sections: prev.sections?.map((s, i) => i === idx ? { ...s, expected_outcome: e.target.value } : s)
                        }))}
                        className="w-full px-2 py-1 rounded bg-purple-900/20 text-white border border-purple-700/30"
                        placeholder={t('createEventModal.expectedOutcome')}
                      />
                      <button
                        type="button"
                        className="mt-1 text-xs text-red-400 hover:text-red-600"
                        onClick={() => setEventForm(prev => ({
                          ...prev,
                          sections: prev.sections?.filter((_, i) => i !== idx)
                        }))}
                      >{t('createEventModal.removeSection')}</button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="mt-2 px-3 py-1 bg-purple-700/60 text-white rounded hover:bg-purple-800/80"
                    onClick={() => setEventForm(prev => ({
                      ...prev,
                      sections: [...(prev.sections || []), { title: '', description: '', key_points: [], target_audience: '', expected_outcome: '' }]
                    }))}
                  >{t('createEventModal.addSection')}</button>
                </div>
                {/* AI/Translation/Voice Features */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => generateEventWithAI()}
                    disabled={aiGenerating}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-lg shadow-purple-500/20"
                  >
                    {aiGenerating ? (
                      <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></span>
                    ) : (
                      <Activity className="h-4 w-4 mr-2" />
                    )}
                    {t('createEventModal.generateWithAI')}
                  </button>
                  
                  {/* Optional: Voice prompt input */}
                  <button
                      type="button"
                      onClick={handleToggleListening}
                      disabled={!speechSupported}
                      className={`bg-gradient-to-r text-white px-4 py-2 rounded-lg transition flex items-center shadow-lg ${isListening
                          ? 'from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-red-500/20'
                          : 'from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-purple-500/20'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isListening ? (
                        <MicOff className="h-4 w-4 mr-2" />
                      ) : (
                        <Mic className="h-4 w-4 mr-2" />
                      )}
                      {isListening ? t('createEventModal.stopListening') : t('createEventModal.startVoiceInput')}
                    </button>
                </div>
                {/* Validation/general errors */}
                {validationErrors.general && <p className="text-red-400 text-sm mt-2">{validationErrors.general}</p>}
                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-700/50 transition text-gray-300 hover:text-white"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? t('createEventModal.creating') : t('createEventModal.createEvent')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* In the UI, only render the user search bar and results if showUserSearch is true */}
        {showUserSearch && (
          <div className="my-4">
            <input
              type="text"
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
              placeholder="Search users by name, phone, or organization..."
              className="px-4 py-2 border border-gray-700 rounded-lg bg-gray-800/50 text-white w-full mb-2"
            />
            <button
              onClick={handleUserSearch}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              disabled={searching}
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
            <div className="mt-2 space-y-2">
              {userSearchResults.map((user) => (
                <div key={user.id} className="flex items-center gap-2 bg-gray-900 p-2 rounded">
                  <PublicProfileAvatar userId={user.id} name={user.name} size={32} />
                  <span>{user.name}</span>
                  <button onClick={() => handleAddToTeam(user)} className="ml-auto px-3 py-1 bg-green-600 text-white rounded">Add to Team</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Add a button to open the user search UI in the team management section/modal */}
        <button onClick={() => setShowUserSearch(true)} className="px-3 py-1 bg-blue-600 text-white rounded">Add Team Member</button>
<Toaster position="top-right" />
      </div>
    </div>
  );
};

export default EventManagement;