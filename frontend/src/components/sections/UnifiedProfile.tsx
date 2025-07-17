import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { userAPI } from '../../lib/api';
import ParticleBackground from "../ui/ParticleBackground";
import { 
  User, Building2, Users, Award, Calendar, MapPin, 
  DollarSign, Activity, Globe, Star,
  Edit, Plus, Target, Users2, Briefcase,
  BarChart3, Lightbulb,
  ArrowRight, Settings, Trophy, Mic, Square, X
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUserId, UserProfile, UserProfileUpdate, Project, Event, voiceUpdateProfile } from '../../lib/api.ts';
import { Toaster, toast } from 'react-hot-toast';

interface Activity {
  id: number;
  type: 'event_created' | 'event_participated' | 'project_completed' | 'skill_earned';
  title: string;
  description: string;
  date: string;
  impact_score: number;
}

interface UnifiedProfileProps {
  publicView?: boolean;
  userId?: string | number;
}

const UnifiedProfile: React.FC<UnifiedProfileProps> = ({ publicView = false, userId: propUserId }) => {
  const { i18n } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<UserProfileUpdate>({
    name: '',
    organization: '',
    location: '',
    state: '',
    skills: [],
    experience: '',
    goals: ''
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loaded, setLoaded] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [networkingSuggestions, setNetworkingSuggestions] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [showVoiceOnboarding, setShowVoiceOnboarding] = useState(false);

  // Voice input states
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentVoiceField, setCurrentVoiceField] = useState<string | null>(null);

  // Media recorder reference
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  let resolveDataAvailable: () => void;

  // Add state for pending profile changes
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const { id: routeId } = useParams<{ id: string }>();
  const userId = propUserId || routeId;
  const loggedInUserId = getUserId();
  const isOwnProfile = !publicView || (userId && String(userId) === String(loggedInUserId));

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    if (publicView && userId) {
      fetchPublicProfile(userId);
    } else {
      fetchProfile();
      fetchProjects();
      fetchEvents();
      fetchAchievements();
      fetchActivities();
      fetchRecommendations();
      fetchNetworkingSuggestions();
      fetchUserStats();
    }
    return () => clearTimeout(timer);
  }, [publicView, userId]);

  // Update fetchProfile function
  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      if (response.data) {
        setProfile(response.data);
      } else {
        setProfile({
          user_id: parseInt(getUserId() || '0'),
          user_type: 'individual',
          name: '',
          organization: 'None',
          location: '',
          state: '',
          skills: [],
          experience: '',
          goals: '',
          impact_metrics: {
            participants_target: 0,
            skills_developed: 0,
            projects_created: 0,
            employment_generated: 0,
            revenue_generated: 0,
            events_hosted: 0,
            jobs_created: 0,
            social_impact_score: 0,
            sustainability_score: 0
          },
          achievements: [],
          recent_activities: [],
          recommendations: [],
          networking_suggestions: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setProjects([]);
        return;
      }
      
      const response = await userAPI.getUserProjects(parseInt(userId));
      if (response.data) {
        setProjects(response.data);
      } else {
        console.error('Error fetching user projects:', response.error);
        setProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    }
  };

  const fetchEvents = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setEvents([]);
        return;
      }
      
      const response = await userAPI.getUserEvents(parseInt(userId));
      if (response.data) {
        setEvents(response.data);
      } else {
        console.error('Error fetching user events:', response.error);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    }
  };

  const fetchAchievements = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setAchievements([]);
        return;
      }
      
      const response = await userAPI.getUserAchievements(parseInt(userId));
      if (response.data) {
        setAchievements(response.data);
      } else {
        console.error('Error fetching user achievements:', response.error);
        setAchievements([]);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setAchievements([]);
    }
  };

  const fetchActivities = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setActivities([]);
        return;
      }
      
      const response = await userAPI.getUserActivities(parseInt(userId), 10);
      if (response.data) {
        setActivities(response.data);
      } else {
        console.error('Error fetching user activities:', response.error);
        setActivities([]);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setRecommendations([]);
        return;
      }
      
      const response = await userAPI.getUserRecommendations(parseInt(userId));
      if (response.data) {
        setRecommendations(response.data);
      } else {
        console.error('Error fetching user recommendations:', response.error);
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    }
  };

  const fetchNetworkingSuggestions = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setNetworkingSuggestions([]);
        return;
      }
      
      const response = await userAPI.getUserNetworkingSuggestions(parseInt(userId));
      if (response.data) {
        setNetworkingSuggestions(response.data);
      } else {
        console.error('Error fetching networking suggestions:', response.error);
        setNetworkingSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching networking suggestions:', error);
      setNetworkingSuggestions([]);
    }
  };

  const fetchUserStats = async () => {
    try {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setUserStats(null);
        return;
      }
      
      const response = await userAPI.getUserStats(parseInt(userId));
      if (response.data) {
        setUserStats(response.data);
      } else {
        console.error('Error fetching user stats:', response.error);
        setUserStats(null);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setUserStats(null);
    }
  };

  const fetchPublicProfile = async (id: string | number) => {
    try {
      const response = await userAPI.getProfileById(id);
      if (response.data) {
        setProfile(response.data);
      } else {
        setProfile(null);
      }
    } catch (error) {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeIcon = (userType: string) => {
    const icons = {
      individual: User,
      company: Building2,
      ngo: Users,
      investor: Award
    };
    return icons[userType as keyof typeof icons] || User;
  };

  const getUserTypeColor = (userType: string) => {
    const colors = {
      individual: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      company: 'bg-green-500/20 text-green-300 border-green-500/50',
      ngo: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
      investor: 'bg-orange-500/20 text-orange-300 border-orange-500/50'
    };
    return colors[userType as keyof typeof colors] || 'bg-gray-500/20 text-gray-300 border-gray-500/50';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const handleEdit = () => {
    if (profile) {
      setEditForm({
        name: profile.name,
        organization: profile.organization || '',
        location: profile.location || '',
        state: profile.state || '',
        skills: profile.skills,
        experience: profile.experience || '',
        goals: profile.goals || ''
      });
    }
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await userAPI.updateProfile(editForm);
      
      if (response.data) {
        setProfile(response.data);
        setEditing(false);
        toast.success('Profile updated successfully!', {
          style: {
            background: 'rgba(30, 144, 255, 0.1)',
            border: '1px solid rgba(30, 144, 255, 0.3)',
            color: '#fff',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#3085d6',
          },
        });
      } else if (response.error) {
        toast.error('Failed to update profile: ' + response.error, {
          style: {
            background: 'rgba(139, 0, 0, 0.1)',
            border: '1px solid rgba(139, 0, 0, 0.3)',
            color: '#fff',
            boxShadow: '0 8px 32px 0 rgba(139, 0, 0, 0.37)',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#ff6b6b',
          },
        });
      }
    } catch (error) {
      toast.error('An unexpected error occurred while updating profile', {
        style: {
          background: 'rgba(139, 0, 0, 0.1)',
          border: '1px solid rgba(139, 0, 0, 0.3)',
          color: '#fff',
          boxShadow: '0 8px 32px 0 rgba(139, 0, 0, 0.37)',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#ff6b6b',
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const addSkill = (skill: string) => {
    setEditForm(prev => ({
      ...prev,
      skills: [...(prev.skills || []), skill]
    }));
  };

  const removeSkill = (skillToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      skills: (prev.skills || []).filter(skill => skill !== skillToRemove)
    }));
  };

  // Helper: Check microphone permission
  async function checkMicPermission() {
    if (!navigator.permissions) return true; // fallback for older browsers
    try {
      const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      if (status.state === 'granted') return true;
      if (status.state === 'prompt') {
        // Will prompt on getUserMedia
        return true;
      }
      return false;
    } catch {
      return true;
    }
  }

  // Helper: Get supported mime type
  function getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/wav',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  }

  const startVoiceRecording = async () => {
    try {
      const hasPermission = await checkMicPermission();
      if (!hasPermission) {
        console.log('Requesting microphone permission...');
      }
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone stream acquired:', stream);
      const mimeType = getSupportedMimeType();
      if (!mimeType) {
        toast.error('No supported audio format found.');
        setIsRecording(false);
        return;
      }
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      const startTime = Date.now();
      const dataReady = new Promise<void>((resolve) => {
        resolveDataAvailable = resolve;
      });
      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          resolveDataAvailable();
        }
      };
      mediaRecorder.onstop = async () => {
        await dataReady;
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const duration = (Date.now() - startTime) / 1000;
        console.log('Recording duration:', duration, 'seconds');
        if (audioBlob.size === 0 || duration < 1) {
          toast.error('Recording too short or no audio captured.');
          setIsRecording(false);
          return;
        }
        await processVoiceInput(audioBlob, 'profile');
      };
      await new Promise(resolve => setTimeout(resolve, 100));
      mediaRecorder.start();
      setIsRecording(true);
      setCurrentVoiceField('profile');
      console.log('MediaRecorder started, state:', mediaRecorder.state);
      toast.success('Recording started!');
    } catch (error) {
      console.error('Error starting voice recording:', error);
      toast.error('Failed to start recording. Please check microphone permissions.');
      setIsRecording(false);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('Stopping MediaRecorder, state:', mediaRecorderRef.current.state);
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      toast.success('Recording stopped.');
    } else {
      console.warn('MediaRecorder not recording or not initialized:', mediaRecorderRef.current?.state);
      setIsRecording(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob, field: string) => {
    console.log('Processing blob of size:', audioBlob.size, 'for field:', field);
    try {
      setIsProcessing(true);
      console.log('Set isProcessing to true');
      const language = i18n.language || 'en';
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);
      if (field === 'profile') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        console.log('Sending request to /api/transcribe');
        const transcribeResponse = await fetch(`${API_BASE_URL}/api/transcribe`, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log('Transcription response:', transcribeResponse.status, transcribeResponse.statusText);
        if (!transcribeResponse.ok) {
          const errorText = await transcribeResponse.text().catch(() => 'Unknown error');
          console.error('Transcription failed:', transcribeResponse.status, errorText);
          toast.error(`Failed to transcribe audio: ${errorText}`);
          setIsProcessing(false);
          return;
        }
        const transcribeData = await transcribeResponse.json();
        console.log('Transcription data:', transcribeData);
        const transcription = transcribeData.text?.trim() || '';
        if (!transcription) {
          console.warn('No transcription result received');
          toast.error('No transcription result');
          setIsProcessing(false);
          return;
        }
        try {
          console.log('Sending transcription to voiceUpdateProfile:', transcription);
          const llmData = await voiceUpdateProfile(transcription, profile);
          if (profile) {
            setPendingProfile({ ...profile, ...llmData });
            setShowVoiceOnboarding(false);
            setShowPreviewModal(true);
          }
          toast('Transcription: ' + transcription, { duration: 5000 });
        } catch (err) {
          console.error('Error in voiceUpdateProfile:', err);
          toast.error('Failed to enhance profile with LLM');
        } finally {
          setIsProcessing(false);
        }
      } else {
        if (field === 'experience' || field === 'goals') {
          setIsProcessing(false);
          return;
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        console.log('Sending request to /api/transcribe for field:', field);
        const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        console.log('Transcription response:', response.status, response.statusText);
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('Transcription failed:', response.status, errorText);
          toast.error(`Failed to transcribe audio: ${errorText}`);
          setIsProcessing(false);
          return;
        }
        const data = await response.json();
        console.log('Transcription data:', data);
        const transcription = data.text?.trim() || '';
        if (!transcription) {
          console.warn('No transcription result received');
          toast.error('No transcription result');
          setIsProcessing(false);
          return;
        }
        let processedValue = transcription;
        switch (field) {
          case 'name':
          case 'organization':
          case 'location':
          case 'state':
            processedValue = transcription.split(' ').map((word: string) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ');
            break;
          case 'skills':
            processedValue = transcription.split(',').map((skill: string) => skill.trim());
            break;
          default:
            processedValue = transcription;
        }
        const currentValue = editForm[field as keyof typeof editForm];
        if (!currentValue || (typeof currentValue === 'string' && currentValue.trim() === '')) {
          setEditForm(prev => ({
            ...prev,
            [field]: processedValue
          }));
        } else {
          toast((t) => (
            <span>
              Replace "{currentValue}" with "{processedValue}"?
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    setEditForm(prev => ({ ...prev, [field]: processedValue }));
                    toast.dismiss(t.id);
                  }}
                  className="bg-green-600 px-3 py-1 rounded text-white"
                >
                  Yes
                </button>
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="bg-red-600 px-3 py-1 rounded text-white"
                >
                  No
                </button>
              </div>
            </span>
          ), {
            duration: 6000,
            style: {
              background: 'rgba(50, 20, 50, 0.9)',
              color: '#fff',
              borderRadius: '10px',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            },
          });
        }
        setIsProcessing(false);
        return;
      }
    } catch (error: any) {
      console.error('Error processing voice input:', error);
      if (error.name === 'AbortError') {
        toast.error('Transcription request timed out. Please try again.');
      } else {
        toast.error('Error processing voice input: ' + error.message);
      }
    } finally {
      setIsProcessing(false);
      setCurrentVoiceField(null);
    }
  };

  const handleProfileUpdate = async (updatedProfile: UserProfile) => {
    try {
      const response = await userAPI.updateProfile({
        name: updatedProfile.name,
        organization: updatedProfile.organization,
        location: updatedProfile.location,
        state: updatedProfile.state,
        skills: updatedProfile.skills,
        experience: updatedProfile.experience,
        goals: updatedProfile.goals,
        impact_metrics: updatedProfile.impact_metrics,
        achievements: [],
        recent_activities: [],
        recommendations: [],
        networking_suggestions: [],
      });
      
      if (response.data) {
        setProfile(response.data);
        toast.success('Profile updated successfully!', {
          style: {
            background: 'rgba(30, 144, 255, 0.1)',
            border: '1px solid rgba(30, 144, 255, 0.3)',
            color: '#fff',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
          },
        });
      } else {
        toast.error('Failed to update profile: ' + (response.error || 'Unknown error'), {
          style: {
            background: 'rgba(139, 0, 0, 0.1)',
            border: '1px solid rgba(139, 0, 0, 0.3)',
            color: '#fff',
            boxShadow: '0 8px 32px 0 rgba(139, 0, 0, 0.37)',
          },
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An unexpected error occurred while updating profile', {
        style: {
          background: 'rgba(139, 0, 0, 0.1)',
          border: '1px solid rgba(139, 0, 0, 0.3)',
          color: '#fff',
          boxShadow: '0 8px 32px 0 rgba(139, 0, 0, 0.37)',
        },
      });
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <ParticleBackground />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20 z-10"></div>
        <div className="relative z-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
            <p className="mt-4 text-lg text-white">Loading Profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile && !loading && isOwnProfile) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <ParticleBackground />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20 z-10"></div>
        <div className="relative z-20 flex items-center justify-center min-h-screen">
          <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 max-w-md">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Profile Not Found</h2>
              <p className="text-gray-300 mb-6">You have not created a profile yet. Click below to get started!</p>
              <button
                onClick={() => navigate('/profile/create')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
              >
                Create Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <ParticleBackground />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20 z-10"></div>
        <div className="relative z-20 flex items-center justify-center min-h-screen">
          <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 max-w-md">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Profile Not Found</h2>
              <p className="text-gray-300 mb-6">Please complete your profile setup first.</p>
              <button
                onClick={() => navigate('/profile/create')}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
              >
                Create Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const UserTypeIcon = getUserTypeIcon(profile.user_type);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParticleBackground />
      
      <div className="absolute inset-0 z-0">
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(38,38,38,0.3)_1px,transparent_1px)] bg-[length:24px_24px]"></div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20 z-10"></div>

      <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600 rounded-full filter blur-[128px] opacity-20 z-0"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600 rounded-full filter blur-[128px] opacity-20 z-0"></div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 py-16">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#fff',
              boxShadow: '0 8px 32px 0 rgba(255, 255, 255, 0.37)',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#3085d6',
            },
          }}
        />
        <div className={`transform transition-all duration-1000 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 mb-8">
            {editing ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCancel}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Settings className="h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Name
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter your name"
                        required
                        className="w-full p-3 pr-12 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    {isRecording && currentVoiceField === 'name' && (
                      <div className="mt-2 text-xs text-purple-400 flex items-center">
                        <div className="animate-pulse mr-2">🔴</div>
                        Recording... Click to stop
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Organization
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editForm.organization || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, organization: e.target.value }))}
                        placeholder="Enter organization name"
                        className="w-full p-3 pr-12 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    {isRecording && currentVoiceField === 'organization' && (
                      <div className="mt-2 text-xs text-purple-400 flex items-center">
                        <div className="animate-pulse mr-2">🔴</div>
                        Recording... Click to stop
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Location
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editForm.location || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Enter your location"
                        required
                        className="w-full p-3 pr-12 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    {isRecording && currentVoiceField === 'location' && (
                      <div className="mt-2 text-xs text-purple-400 flex items-center">
                        <div className="animate-pulse mr-2">🔴</div>
                        Recording... Click to stop
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      State
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editForm.state || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="Enter your state"
                        required
                        className="w-full p-3 pr-12 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    {isRecording && currentVoiceField === 'state' && (
                      <div className="mt-2 text-xs text-purple-400 flex items-center">
                        <div className="animate-pulse mr-2">🔴</div>
                        Recording... Click to stop
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Skills</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(editForm.skills ?? []).map((skill, index) => (
                      <Badge key={index} className="bg-purple-600 text-white">
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="ml-2 text-white hover:text-red-300"
                        >
                          x
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Add a skill"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          addSkill(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      className="flex-1 p-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        addSkill(input.value);
                        input.value = '';
                      }}
                      className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200"
                    >
                      Add
                    </button>
                  </div>
                </div>
                
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                <div className="flex items-center space-x-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                    <UserTypeIcon className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">{profile.name}</h1>
                    {profile.organization && (
                      <p className="text-xl text-gray-300 mb-3">{profile.organization}</p>
                    )}
                    <div className="flex items-center space-x-4">
                      <Badge className={getUserTypeColor(profile.user_type)}>
                        {profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1)}
                      </Badge>
                      <div className="flex items-center space-x-2 text-gray-300">
                        <MapPin className="h-4 w-4 text-purple-400" />
                        <span>{profile.location}, {profile.state}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={() => setShowVoiceOnboarding(true)}
                    className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
                  >
                    <Mic className="h-4 w-4" />
                    <span>Voice Update</span>
                  </button>
                  {isOwnProfile && (
                    <button
                      onClick={handleEdit}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </button>
                  )}
                  <button
                    onClick={() => navigate('/events')}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Event</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-medium">Events Organized</p>
                  <p className="text-3xl font-bold text-white">{formatNumber(userStats?.events_organized || 0)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">Events Participated</p>
                  <p className="text-3xl font-bold text-white">{formatNumber(userStats?.events_participated || 0)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Projects Created</p>
                  <p className="text-3xl font-bold text-white">{formatNumber(userStats?.projects_created || 0)}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 backdrop-blur-sm border border-orange-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-300 text-sm font-medium">Total Activities</p>
                  <p className="text-3xl font-bold text-white">{userStats?.total_activities || 0}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
            <div className="flex flex-wrap gap-2 mb-6">
              {['overview', 'achievements', 'activities', 'recommendations'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-gray-800/30 border border-gray-600 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <Briefcase className="w-5 h-5 mr-2 text-purple-400" />
                      Skills & Experience
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-gray-300 font-medium mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {(profile.skills || []).map((skill, index) => (
                            <Badge key={index} className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-gray-300 font-medium mb-2">Experience</h4>
                        <p className="text-white">{profile.experience}</p>
                      </div>
                      <div>
                        <h4 className="text-gray-300 font-medium mb-2">Goals</h4>
                        <p className="text-white">{profile.goals}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-800/30 border border-gray-600 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
                      Additional Metrics
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Events Participated</span>
                        <span className="text-white font-semibold">{userStats?.events_participated || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Projects Created</span>
                        <span className="text-white font-semibold">{userStats?.projects_created || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Events Organized</span>
                        <span className="text-white font-semibold">{userStats?.events_organized || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Team Memberships</span>
                        <span className="text-white font-semibold">{userStats?.team_memberships || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Total Activities</span>
                        <span className="text-white font-semibold">{userStats?.total_activities || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Sustainability Score</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < Math.floor((profile.impact_metrics.sustainability_score || 0) / 20) ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800/30 border border-gray-600 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <Globe className="w-5 h-5 mr-2 text-purple-400" />
                      Networking Suggestions
                    </h3>
                    <div className="space-y-2">
                      {networkingSuggestions.slice(0, 3).map((suggestion, index) => (
                        <div key={index} className="flex items-center space-x-2 text-gray-300">
                          <ArrowRight className="w-4 h-4 text-purple-400" />
                          <span>{suggestion.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="bg-gray-800/30 border border-gray-600 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                        {achievement.type}
                      </Badge>
                    </div>
                    <h4 className="text-white font-semibold mb-2">{achievement.title}</h4>
                    <p className="text-gray-300 text-sm mb-3">{achievement.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{new Date(achievement.date).toLocaleDateString()}</span>
                      <span className="text-purple-400 font-medium">Impact: {achievement.impact_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'activities' && (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="bg-gray-800/30 border border-gray-600 rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <Activity className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold mb-1">{activity.title}</h4>
                          <p className="text-gray-300 text-sm mb-2">{activity.description}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-gray-400">{new Date(activity.date).toLocaleDateString()}</span>
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                              {activity.type.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <span className="text-purple-400 font-medium">+{activity.impact_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendations.map((recommendation) => (
                  <div key={recommendation.id} className="bg-gray-800/30 border border-gray-600 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <Lightbulb className="w-6 h-6 text-white" />
                      </div>
                      <Badge className={`${
                        recommendation.priority === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/50' :
                        recommendation.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' :
                        'bg-green-500/20 text-green-300 border-green-500/50'
                      }`}>
                        {recommendation.priority} priority
                      </Badge>
                    </div>
                    <h4 className="text-white font-semibold mb-2">{recommendation.title}</h4>
                    <p className="text-gray-300 text-sm mb-4">{recommendation.description}</p>
                    <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 text-sm">
                      Take Action
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {projects.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">My Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Card key={project.id} className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-white mb-2">{project.title}</CardTitle>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className="bg-blue-900/50 text-blue-300 border-blue-700">{project.category}</Badge>
                        <Badge className="bg-gray-900/50 text-gray-300 border-gray-700">{project.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 text-sm mb-2 line-clamp-2">{project.description}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Users2 className="h-4 w-4" />
                        <span>{project.team_members?.length || 1} members</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>{project.created_at ? new Date(project.created_at).toLocaleDateString() : ''}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {events.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Events Attended</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <Card key={event.id} className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 border border-gray-700/50">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-white mb-2">{event.title}</CardTitle>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className="bg-purple-900/50 text-purple-300 border-purple-700">{event.event_type}</Badge>
                        <Badge className="bg-gray-900/50 text-gray-300 border-gray-700">{event.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 text-sm mb-2 line-clamp-2">{event.description}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <MapPin className="h-4 w-4" />
                        <span>{event.location}, {event.state}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>{event.start_date ? new Date(event.start_date).toLocaleDateString() : ''}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showVoiceOnboarding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Mic className="w-6 h-6 text-orange-400" />
                <span>Voice Profile Update</span>
              </h2>
              <button
                onClick={() => setShowVoiceOnboarding(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="text-center mb-8">
              <p className="text-gray-300 text-lg">
                Update your profile using voice input. Speak naturally about your skills, experience, and goals.
              </p>
            </div>

            <div className="bg-gradient-to-br from-gray-700/30 to-gray-800/30 backdrop-blur-sm border border-gray-600/50 rounded-xl p-6">
              <div className="text-center">
                <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
                  isRecording 
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 animate-pulse' 
                    : 'bg-gradient-to-r from-orange-500 to-red-500'
                }`}>
                  {isRecording ? (
                    <Square className="w-16 h-16 text-white" />
                  ) : (
                    <Mic className="w-16 h-16 text-white" />
                  )}
                </div>
              </div>

              <div className="text-center mt-6">
  <button
    onClick={async () => {
      console.log('Voice button clicked, isRecording:', isRecording);
      if (isRecording) {
        stopVoiceRecording();
      } else {
        await startVoiceRecording();
      }
    }}
    disabled={isProcessing}
    className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
      isRecording
        ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700'
        : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700'
    } disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    {isProcessing ? (
      <span className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
        Processing...
      </span>
    ) : isRecording ? (
      'Stop Recording'
    ) : (
      'Start Voice Update'
    )}
  </button>
</div>

              <div className="text-gray-300 text-lg text-center mt-4">
                {isRecording && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-pulse w-3 h-3 bg-red-400 rounded-full"></div>
                    <span>Recording... Speak now!</span>
                  </div>
                )}
                {isProcessing && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    <span>Processing your voice...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Speak about: your name, location, skills, experience, goals, and whether you need a mentor
              </p>
            </div>
          </div>
        </div>
      )}

      {showPreviewModal && pendingProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Edit className="w-6 h-6 text-purple-400" />
                <span>Review Profile Changes</span>
              </h2>
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPendingProfile(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-800/30 border border-gray-600 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-gray-400" />
                  Current Profile
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-sm">Name</label>
                    <p className="text-white">{profile?.name || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Location</label>
                    <p className="text-white">{profile?.location || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">State</label>
                    <p className="text-white">{profile?.state || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Skills</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(profile?.skills || []).map((skill, index) => (
                        <Badge key={index} className="bg-gray-600 text-gray-300 text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Experience</label>
                    <p className="text-white text-sm">{profile?.experience || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Goals</label>
                    <p className="text-white text-sm">{profile?.goals || 'Not set'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Edit className="w-5 h-5 mr-2 text-purple-400" />
                  Updated Profile
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-sm">Name</label>
                    <p className={`${pendingProfile.name !== profile?.name ? 'text-green-400' : 'text-white'}`}>
                      {pendingProfile.name || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Location</label>
                    <p className={`${pendingProfile.location !== profile?.location ? 'text-green-400' : 'text-white'}`}>
                      {pendingProfile.location || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">State</label>
                    <p className={`${pendingProfile.state !== profile?.state ? 'text-green-400' : 'text-white'}`}>
                      {pendingProfile.state || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Skills</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {pendingProfile.skills.map((skill, index) => (
                        <Badge 
                          key={index} 
                          className={`text-xs ${
                            !profile?.skills?.includes(skill) 
                              ? 'bg-green-600 text-white' 
                              : 'bg-purple-600 text-white'
                          }`}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Experience</label>
                    <p className={`text-sm ${pendingProfile.experience !== profile?.experience ? 'text-green-400' : 'text-white'}`}>
                      {pendingProfile.experience || 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Goals</label>
                    <p className={`text-sm ${pendingProfile.goals !== profile?.goals ? 'text-green-400' : 'text-white'}`}>
                      {pendingProfile.goals || 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowPreviewModal(false);
                  setPendingProfile(null);
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200"
              >
                Reject Changes
              </button>
              <button
                onClick={async () => {
                  await handleProfileUpdate(pendingProfile);
                  setShowPreviewModal(false);
                  setPendingProfile(null);
                }}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
              >
                Accept Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedProfile;