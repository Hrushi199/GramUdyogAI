import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { userAPI } from '../../lib/api';
import ParticleBackground from "../ui/ParticleBackground";
import { 
  User, Building2, Users, Award, Calendar, MapPin, 
  TrendingUp, DollarSign, Activity, Globe, Star,
  Edit, Share2, Eye, Plus, Target, Users2, Briefcase,
  GraduationCap, Heart, Zap, BarChart3, Lightbulb,
  ArrowRight, Settings, Bell, Crown, Trophy, Mic, Square, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {getUserId} from '../../lib/api.ts';

interface UserProfile {
  id: number;
  user_type: 'individual' | 'company' | 'ngo' | 'investor';
  name: string;
  organization?: string;
  location: string;
  state: string;
  skills: string[];
  experience: string;
  goals: string;
  impact_metrics: {
    events_hosted: number;
    events_participated: number;
    projects_created: number;
    people_impacted: number;
    revenue_generated: number;
    jobs_created: number;
    social_impact_score: number;
    sustainability_score: number;
  };
  achievements: Achievement[];
  recent_activities: Activity[];
  recommendations: Recommendation[];
  networking_suggestions: string[];
  created_at: string;
  updated_at: string;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  type: 'event' | 'project' | 'award' | 'certification';
  date: string;
  impact_score: number;
}

interface Activity {
  id: number;
  type: 'event_created' | 'event_participated' | 'project_completed' | 'skill_earned';
  title: string;
  description: string;
  date: string;
  impact_score: number;
}

interface Recommendation {
  id: number;
  type: 'skill' | 'event' | 'connection' | 'project';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  action_url?: string;
}

const UnifiedProfile: React.FC = () => {
  const { i18n } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    organization: '',
    location: '',
    state: '',
    skills: [] as string[],
    experience: '',
    goals: ''
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [loaded, setLoaded] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [showVoiceOnboarding, setShowVoiceOnboarding] = useState(false);

  // Voice input states
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentVoiceField, setCurrentVoiceField] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    fetchProfile();
    fetchProjects();
    fetchEvents();
    return () => clearTimeout(timer);
  }, []);

  // Update fetchProfile function
const fetchProfile = async () => {
  try {
    // const userId = getUserId();
    const response = await userAPI.getProfile();
    if (response.data) {
      setProfile(response.data);
    } else {
      // Set default profile data if AI enhancement fails
      setProfile({
        name: userData?.name || '',
        organization: null,
        location: '',
        state: '',
        skills: [],
        experience: '',
        goals: '',
        impact_metrics: {
          events_hosted: 0,
          events_participated: 0,
          projects_created: 0,
          people_impacted: 0,
          revenue_generated: 0,
          jobs_created: 0,
          social_impact_score: 0,
          sustainability_score: 0
        },
        recommendations: [
          {
            id: 1,
            type: 'skill',
            title: 'Complete Your Profile',
            description: 'Add more details to get personalized recommendations',
            priority: 'high'
          }
        ],
        networking_suggestions: [
          'Join relevant events in your area',
          'Connect with professionals in your field'
        ]
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
      
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/projects`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      } else {
        console.error('Error fetching user projects:', response.statusText);
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
      
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/events`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      } else {
        console.error('Error fetching user events:', response.statusText);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
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

  const handleEdit = () => {
    if (profile) {
      setEditForm({
        name: profile.name,
        organization: profile.organization || '',
        location: profile.location,
        state: profile.state,
        skills: profile.skills,
        experience: profile.experience,
        goals: profile.goals
      });
    }
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const userId = localStorage.getItem('user_id');
      const authToken = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_BASE_URL}/api/users/unified-profile?user_id=${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      
      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setEditing(false);
      } else {
        console.error('Error updating profile:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && !editForm.skills.includes(skill.trim())) {
      setEditForm(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setEditForm(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const startVoiceRecording = async (field: string) => {
    try {
      setCurrentVoiceField(field);
      setAudioChunks([]);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await processVoiceInput(audioBlob);
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    if (!currentVoiceField) return;
    
    try {
      setIsProcessing(true);
      
      // Get language from i18n
      const language = i18n.language || 'en';
      
      // Create form data
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);
      
      if (currentVoiceField === 'profile') {
        // Use the speech-to-profile endpoint for full profile updates
        const response = await fetch(`${API_BASE_URL}/api/speech-to-profile`, {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Update the profile with the extracted data
          if (profile) {
            const updatedProfile = {
              ...profile,
              name: data.name || profile.name,
              location: data.location || profile.location,
              state: data.state || profile.state,
              skills: data.skills || profile.skills,
              experience: data.experience || profile.experience,
              goals: data.goals || profile.goals
            };
            
            setProfile(updatedProfile);
            
            // Save the updated profile to backend
            const saveResponse = await fetch(`${API_BASE_URL}/api/profile`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
              },
              body: JSON.stringify({
                name: updatedProfile.name,
                location: updatedProfile.location,
                district: updatedProfile.location.split(',')[1]?.trim() || '',
                state: updatedProfile.state,
                language: language,
                skills: updatedProfile.skills,
                customSkills: [],
                jobTypes: [],
                customJobTypes: [],
                needMentor: false
              }),
            });
            
            if (saveResponse.ok) {
              setShowVoiceOnboarding(false);
              // Refresh the profile data
              fetchProfile();
            }
          }
        } else {
          console.error('Profile voice processing failed');
        }
      } else {
        // Handle individual field updates
        const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          const transcript = data.text.trim();
          
          // Process the transcript based on field type
          let processedValue = transcript;
          
          switch (currentVoiceField) {
            case 'name':
            case 'organization':
            case 'location':
            case 'state':
              // Capitalize first letter of each word
              processedValue = transcript.split(' ').map((word: string) => 
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join(' ');
              break;
            case 'skills':
              // Split by commas and clean up
              processedValue = transcript.split(',').map((skill: string) => skill.trim());
              break;
            case 'experience':
            case 'goals':
              processedValue = transcript;
              break;
            default:
              processedValue = transcript;
          }
          
          // Only update if the field is empty or if user explicitly wants to replace
          const currentValue = editForm[currentVoiceField as keyof typeof editForm];
          if (!currentValue || (typeof currentValue === 'string' && currentValue.trim() === '')) {
            setEditForm(prev => ({
              ...prev,
              [currentVoiceField]: processedValue
            }));
          } else {
            // Ask user if they want to replace existing content
            if (window.confirm(`Replace "${currentValue}" with "${processedValue}"?`)) {
              setEditForm(prev => ({
                ...prev,
                [currentVoiceField]: processedValue
              }));
            }
          }
          
        } else {
          console.error('Voice transcription failed');
        }
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
    } finally {
      setIsProcessing(false);
      setCurrentVoiceField(null);
    }
  };

  const VoiceInputButton = ({ field, label }: { field: string, label: string }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isTyping) {
          alert('Please finish typing before using voice input');
          return;
        }
        isRecording ? stopVoiceRecording() : startVoiceRecording(field);
      }}
      disabled={isProcessing || isTyping}
      className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-2 transition-colors disabled:opacity-50 pointer-events-auto ${
        isTyping ? 'text-gray-500 cursor-not-allowed' : 'text-gray-400 hover:text-purple-400'
      }`}
    >
      {isProcessing ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
      ) : isRecording && currentVoiceField === field ? (
        <Square className="w-4 h-4 text-red-400" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );

  const VoiceInputField = ({ 
    field, 
    label, 
    type = 'text', 
    placeholder, 
    value, 
    onChange, 
    required = false 
  }: {
    field: string;
    label: string;
    type?: string;
    placeholder: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
  }) => (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => {
            // Ensure manual typing works properly
            onChange(e.target.value);
            setIsTyping(true);
            // Stop recording if user starts typing
            if (isRecording && currentVoiceField === field) {
              stopVoiceRecording();
            }
          }}
          onKeyDown={(e) => {
            setIsTyping(true);
            // Stop recording if user starts typing
            if (isRecording && currentVoiceField === field) {
              stopVoiceRecording();
            }
          }}
          onBlur={() => {
            // Reset typing state after a short delay
            setTimeout(() => setIsTyping(false), 100);
          }}
          placeholder={placeholder}
          required={required}
          className="w-full p-3 pr-12 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <VoiceInputButton field={field} label={label} />
        </div>
      </div>
      {isRecording && currentVoiceField === field && (
        <div className="mt-2 text-xs text-purple-400 flex items-center">
          <div className="animate-pulse mr-2">🔴</div>
          Recording... Click to stop
        </div>
      )}
    </div>
  );

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
      
      {/* Background gradients */}
      <div className="absolute inset-0 z-0">
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(38,38,38,0.3)_1px,transparent_1px)] bg-[length:24px_24px]"></div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20 z-10"></div>

      <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600 rounded-full filter blur-[128px] opacity-20 z-0"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600 rounded-full filter blur-[128px] opacity-20 z-0"></div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 py-16">
        <div className={`transform transition-all duration-1000 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          {/* Profile Header */}
          <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 mb-8">
            {editing ? (
              // Edit Form
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
                      <VoiceInputButton field="name" label="Name" />
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
                        value={editForm.organization}
                        onChange={(e) => setEditForm(prev => ({ ...prev, organization: e.target.value }))}
                        placeholder="Enter organization name"
                        className="w-full p-3 pr-12 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                      />
                      <VoiceInputButton field="organization" label="Organization" />
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
                        value={editForm.location}
                        onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Enter your location"
                        required
                        className="w-full p-3 pr-12 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                      />
                      <VoiceInputButton field="location" label="Location" />
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
                        value={editForm.state}
                        onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="Enter your state"
                        required
                        className="w-full p-3 pr-12 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                      />
                      <VoiceInputButton field="state" label="State" />
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
                    {editForm.skills.map((skill, index) => (
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
                      onKeyPress={(e) => {
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
                
                <VoiceInputField
                  field="experience"
                  label="Experience"
                  placeholder="Enter your experience level"
                  value={editForm.experience}
                  onChange={(value) => setEditForm(prev => ({ ...prev, experience: value }))}
                  required
                />
                
                <VoiceInputField
                  field="goals"
                  label="Goals"
                  placeholder="Enter your goals"
                  value={editForm.goals}
                  onChange={(value) => setEditForm(prev => ({ ...prev, goals: value }))}
                  required
                />
              </div>
            ) : (
              // Display Profile
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
                  <button
                    onClick={handleEdit}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
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

          {/* Impact Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-300 text-sm font-medium">Events Hosted</p>
                  <p className="text-3xl font-bold text-white">{formatNumber(profile.impact_metrics.events_hosted)}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 text-sm font-medium">People Impacted</p>
                  <p className="text-3xl font-bold text-white">{formatNumber(profile.impact_metrics.people_impacted)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-300 text-sm font-medium">Revenue Generated</p>
                  <p className="text-3xl font-bold text-white">{formatCurrency(profile.impact_metrics.revenue_generated)}</p>
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
                  <p className="text-3xl font-bold text-white">{profile.impact_metrics.social_impact_score}/100</p>
                </div>
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
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

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Skills & Experience */}
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
                          {profile.skills.map((skill, index) => (
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

                {/* Additional Metrics */}
                <div className="space-y-6">
                  <div className="bg-gray-800/30 border border-gray-600 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-purple-400" />
                      Additional Metrics
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Events Participated</span>
                        <span className="text-white font-semibold">{profile.impact_metrics.events_participated}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Projects Created</span>
                        <span className="text-white font-semibold">{profile.impact_metrics.projects_created}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Jobs Created</span>
                        <span className="text-white font-semibold">{profile.impact_metrics.jobs_created}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Sustainability Score</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < Math.floor(profile.impact_metrics.sustainability_score / 20) ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Networking Suggestions */}
                  <div className="bg-gray-800/30 border border-gray-600 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                      <Globe className="w-5 h-5 mr-2 text-purple-400" />
                      Networking Suggestions
                    </h3>
                    <div className="space-y-2">
                      {profile.networking_suggestions.slice(0, 3).map((suggestion, index) => (
                        <div key={index} className="flex items-center space-x-2 text-gray-300">
                          <ArrowRight className="w-4 h-4 text-purple-400" />
                          <span>{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profile.achievements.map((achievement) => (
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
                {profile.recent_activities.map((activity) => (
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
                {profile.recommendations.map((recommendation) => (
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
                    {recommendation.action_url && (
                      <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 text-sm">
                        Take Action
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Projects Section */}
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

          {/* Events Attended Section */}
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

      {/* Voice Onboarding Modal */}
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
                  onClick={() => isRecording ? stopVoiceRecording() : startVoiceRecording('profile')}
                  disabled={isProcessing}
                  className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                    isRecording
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700'
                      : 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isProcessing ? 'Processing...' : isRecording ? 'Stop Recording' : 'Start Voice Update'}
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
    </div>
  );
};

export default UnifiedProfile; 