import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ParticleBackground from "../ui/ParticleBackground";
import { useTranslation } from 'react-i18next';
import { Mic, MicOff, CheckCircle, ArrowRight, ArrowLeft, User, MapPin, Languages, Briefcase, Users } from 'lucide-react';
import {userAPI, UserProfile} from '../../lib/api';
// Interface for our form data
interface UserProfileForm {
  name: string;
  organization?: string | null;
  location: string;
  district: string;
  state: string;
  language: string;
  customLanguage: string;
  skills: string[];
  jobTypes: string[];
  customJobTypes: string[];
  needMentor: boolean;
  userType: 'individual' | 'company' | 'ngo' | 'investor';
  experience?: string;
  goals?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default function VoiceBasedUserProfile() {
  const { t, i18n } = useTranslation('create_profile');
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'language-selection' | 'voice-input' | 'review' | 'completed'>('language-selection');
  const [errorMessage, setErrorMessage] = useState('');
  const [mediaRecorderSupported, setMediaRecorderSupported] = useState(true);

  // Form data
  const [form, setForm] = useState<UserProfileForm>({
    name: '',
    organization: '',
    location: '',
    district: '',
    state: '',
    language: '',
    customLanguage: '',
    skills: [],
    jobTypes: [],
    customJobTypes: [],
    needMentor: false,
    userType: 'individual',
    experience: '',
    goals: '',
  });

  // Media recorder reference
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Available options  
  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", 
    "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", 
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];

  const languages = [
    "Hindi", "Bengali", "Marathi", "Telugu", "Tamil", "Gujarati", "Urdu", "Kannada", 
    "Odia", "Malayalam", "Punjabi", "Assamese", "English", "Other"
  ];

  // Map language names to i18n codes
  const languageCodeMap: Record<string, string> = {
    "Hindi": "hi",
    "Bengali": "bn",
    "Marathi": "mr",
    "Telugu": "te",
    "Tamil": "ta",
    "Gujarati": "gu",
    "Urdu": "ur",
    "Kannada": "kn",
    "Odia": "or",
    "Malayalam": "ml",
    "Punjabi": "pa",
    "Assamese": "as",
    "English": "en"
  };

  const commonSkills = [
    "Weaving", "Tailoring", "Embroidery", "Pottery", "Wood Carving", "Carpentry",
    "Farming", "Cooking", "Jewelry Making", "Teaching", "Computer Skills", "Other"
  ];

  const jobTypeOptions = [
    "Remote", "On-site", "Hybrid", "Part-time", "Full-time", "Contract", 
    "Self-employment", "Village-based", "District-based", "State-based", "Other"
  ];

  // State for custom inputs
  const [newCustomSkill, setNewCustomSkill] = useState('');
  const [newCustomJobType, setNewCustomJobType] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    if (!window.MediaRecorder) {
      setMediaRecorderSupported(false);
      setErrorMessage(t('create_profile.voice_input.browser_not_supported'));
    }
    return () => clearTimeout(timer);
  }, [t]);

  // Handle language selection and change app language
  const selectLanguage = (language: string) => {
    setForm(prev => ({ ...prev, language }));
    // Change app language to match selected language (if supported)
    if (language !== 'Other' && languageCodeMap[language]) {
      i18n.changeLanguage(languageCodeMap[language]);
    }
    setCurrentStep('voice-input');
  };

  // Sync i18n language with form.language on mount (if supported)
  useEffect(() => {
    if (form.language && form.language !== 'Other' && languageCodeMap[form.language]) {
      i18n.changeLanguage(languageCodeMap[form.language]);
    }
    // eslint-disable-next-line
  }, [form.language]);

  // Start recording audio
  const startRecording = async () => {
    try {
      setErrorMessage('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        processAudioData();
      };
      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      setErrorMessage(t('create_profile.voice_input.mic_error'));
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsListening(false);
      setIsProcessing(true);
    }
  };

  // Process recorded audio
  const processAudioData = async () => {
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', form.language === 'Other' ? form.customLanguage : form.language);
      const response = await fetch(`${API_BASE_URL}/api/speech-to-profile`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error(t('create_profile.voice_input.audio_error'));
      const data = await response.json();
      setForm(prev => ({
        ...prev,
        name: data.name || prev.name,
        location: data.district || prev.district,
        state: data.state || prev.state,
        district: data.district || prev.district,
        skills: data.skills || prev.skills,
        jobTypes: data.jobTypes || prev.jobTypes,
        customJobTypes: data.customJobTypes || prev.customJobTypes,
        needMentor: data.needMentor !== undefined ? data.needMentor : prev.needMentor
      }));
      setCurrentStep('review');
    } catch (error: any) {
      setErrorMessage(error.message || t('create_profile.voice_input.audio_error'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Update form values manually
  const update = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Toggle skills
  const toggleSkill = (skill: string) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  // Toggle job types
  const toggleJobType = (jobType: string) => {
    setForm(prev => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(jobType)
        ? prev.jobTypes.filter(j => j !== jobType)
        : [...prev.jobTypes, jobType]
    }));
  };

  // Add custom skill
  const addCustomSkill = () => {
    if (newCustomSkill.trim()) {
      setForm(prev => ({
        ...prev,
        skills: [...prev.skills, newCustomSkill.trim()]
      }));
      setNewCustomSkill('');
    }
  };

  // Remove custom skill
  const removeCustomSkill = (skill: string) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  // Add custom job type
  const addCustomJobType = () => {
    if (newCustomJobType.trim()) {
      setForm(prev => ({
        ...prev,
        customJobTypes: [...prev.customJobTypes, newCustomJobType.trim()]
      }));
      setNewCustomJobType('');
    }
  };

  // Remove custom job type
  const removeCustomJobType = (jobType: string) => {
    setForm(prev => ({
      ...prev,
      customJobTypes: prev.customJobTypes.filter(j => j !== jobType)
    }));
  };

  // Validate form before saving
  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      setErrorMessage(t('create_profile.review.validation.name_required'));
      return false;
    }
    if (!form.state) {
      setErrorMessage(t('create_profile.review.validation.state_required'));
      return false;
    }
    if (!form.district.trim()) {
      setErrorMessage(t('create_profile.review.validation.district_required'));
      return false;
    }
    if (!form.language) {
      setErrorMessage(t('create_profile.review.validation.language_required'));
      return false;
    }
    if (form.language === 'Other' && !form.customLanguage.trim()) {
      setErrorMessage(t('create_profile.review.validation.custom_language_required'));
      return false;
    }
    if (form.skills.length === 0) {
      setErrorMessage(t('create_profile.review.validation.skills_required'));
      return false;
    }
    if (form.jobTypes.length === 0 && form.customJobTypes.length === 0) {
      setErrorMessage(t('create_profile.review.validation.job_types_required'));
      return false;
    }
    return true;
  };




const saveProfile = async () => {
  const userId = localStorage.getItem('user_id');
  // Merge customSkills into skills
  const allSkills = form.skills;
  const profileData: UserProfile = {
    name: form.name,
    organization: form.organization || null,
    location: form.location,
    state: form.state,
    skills: allSkills,
    experience: form.experience || '',
    goals: form.goals || '',
    user_type: form.userType,
    // Add other required fields with defaults if needed
    impact_metrics: {
      participants_target: 0,
      skills_developed: 0,
      projects_created: 0,
      employment_generated: 0,
      revenue_generated: 0,
    },
    achievements: [],
    recent_activities: [],
    recommendations: [],
    networking_suggestions: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const response = await userAPI.createProfile(profileData);
  if (response.data) {
    setCurrentStep('completed');
    navigate('/profile');
  } else {
    setErrorMessage(response.error || 'Failed to create profile');
  }
};




  const renderLanguageSelection = () => (
    <div className={`max-w-4xl mx-auto transform transition-all duration-1000 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-6">
          <Languages className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-white mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Choose Your Language
          </span>
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Select your preferred language for voice interaction. We'll use this to better understand your profile.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {languages.map((language) => (
          <button
            key={language}
            onClick={() => selectLanguage(language)}
            className="group relative p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl hover:from-purple-600/20 hover:to-blue-600/20 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🌐</div>
              <div className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                {language}
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </button>
        ))}
      </div>

      {form.language === 'Other' && (
        <div className="mt-8 max-w-md mx-auto">
          <input
            type="text"
            name="customLanguage"
            value={form.customLanguage}
            onChange={update}
            placeholder="Enter your language"
            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      )}
    </div>
  );

  const renderVoiceInput = () => (
    <div className={`max-w-4xl mx-auto transform transition-all duration-1000 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-6">
          <Mic className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-white mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Voice Profile Creation
          </span>
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Tell us about yourself in your own words. Speak naturally about your skills, experience, and what you're looking for.
        </p>
      </div>

      <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8">
        <div className="text-center">
          {!mediaRecorderSupported ? (
            <div className="text-red-400 mb-4">
              {t('create_profile.voice_input.browser_not_supported')}
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
                  isListening 
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 animate-pulse' 
                    : 'bg-gradient-to-r from-purple-500 to-blue-500'
                }`}>
                  {isListening ? (
                    <MicOff className="w-16 h-16 text-white" />
                  ) : (
                    <Mic className="w-16 h-16 text-white" />
                  )}
                </div>
              </div>

              <div className="mb-6">
                <button
                  onClick={isListening ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                    isListening
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white hover:from-red-700 hover:to-pink-700'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isProcessing ? 'Processing...' : isListening ? 'Stop Recording' : 'Start Recording'}
                </button>
              </div>

              <div className="text-gray-300 text-lg">
                {isListening && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span>Recording... Speak now!</span>
                  </div>
                )}
                {isProcessing && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                    <span>Processing your voice...</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {errorMessage && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => setCurrentStep('language-selection')}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Language Selection</span>
        </button>
      </div>
      <div className="mt-8 flex flex-col items-center space-y-4">
        <button
          onClick={() => setCurrentStep('review')}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-700 border border-gray-500 rounded-lg text-gray-200 hover:bg-gray-600 transition-colors"
        >
          <span>Skip and Continue</span>
        </button>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className={`max-w-4xl mx-auto transform transition-all duration-1000 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-6">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-white mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            Review Your Profile
          </span>
        </h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Review and edit your profile information before saving. Make sure everything looks correct!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Information */}
        <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <User className="w-6 h-6 mr-3 text-purple-400" />
            Personal Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={update}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
              <select
                name="state"
                value={form.state}
                onChange={update}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select State</option>
                {indianStates.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">District</label>
              <input
                type="text"
                name="district"
                value={form.district}
                onChange={update}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
              <input
                type="text"
                value={form.language === 'Other' ? form.customLanguage : form.language}
                readOnly
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">User Type</label>
              <select
                name="userType"
                value={form.userType}
                onChange={update}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="individual">Individual</option>
                <option value="company">Company</option>
                <option value="ngo">NGO</option>
                <option value="investor">Investor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Skills and Job Preferences */}
        <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Briefcase className="w-6 h-6 mr-3 text-purple-400" />
            Skills & Preferences
          </h3>

          <div className="space-y-6">
            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Skills</label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {commonSkills.map((skill) => (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      form.skills.includes(skill)
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>

              {/* Custom Skills */}
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={newCustomSkill}
                  onChange={(e) => setNewCustomSkill(e.target.value)}
                  placeholder="Add custom skill"
                  className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={addCustomSkill}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                >
                  Add
                </button>
              </div>

              {form.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-sm text-purple-300"
                    >
                      {skill}
                      <button
                        onClick={() => removeCustomSkill(skill)}
                        className="ml-2 text-purple-400 hover:text-purple-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Job Types */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">Job Preferences</label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {jobTypeOptions.map((jobType) => (
                  <button
                    key={jobType}
                    onClick={() => toggleJobType(jobType)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      form.jobTypes.includes(jobType)
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                    }`}
                  >
                    {jobType}
                  </button>
                ))}
              </div>

              {/* Custom Job Types */}
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={newCustomJobType}
                  onChange={(e) => setNewCustomJobType(e.target.value)}
                  placeholder="Add custom job type"
                  className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={addCustomJobType}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                >
                  Add
                </button>
              </div>

              {form.customJobTypes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.customJobTypes.map((jobType) => (
                    <span
                      key={jobType}
                      className="inline-flex items-center px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-sm text-blue-300"
                    >
                      {jobType}
                      <button
                        onClick={() => removeCustomJobType(jobType)}
                        className="ml-2 text-blue-400 hover:text-blue-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Mentor Preference */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="needMentor"
                name="needMentor"
                checked={form.needMentor}
                onChange={(e) => setForm(prev => ({ ...prev, needMentor: e.target.checked }))}
                className="w-4 h-4 text-purple-600 bg-gray-800 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
              />
              <label htmlFor="needMentor" className="text-gray-300">
                I would like to be connected with a mentor
              </label>
            </div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-center">
          {errorMessage}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => setCurrentStep('voice-input')}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Voice Input</span>
        </button>

        <button
          onClick={saveProfile}
          disabled={saving}
          className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>Save Profile</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderCompleted = () => (
    <div className={`max-w-2xl mx-auto text-center transform transition-all duration-1000 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
      <div className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-12">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-8">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        
        <h2 className="text-4xl font-bold text-white mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
            Profile Created Successfully!
          </span>
        </h2>
        
        <p className="text-xl text-gray-300 mb-8">
          Your profile has been saved. We'll use this information to provide you with personalized recommendations and opportunities.
        </p>

        <div className="space-y-4">
          {/* Commented out automatic dashboard redirect - will be handled by new AI agent
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
          >
            Go to Dashboard
          </button>
          */}
          
          <button
            onClick={() => navigate('/')}
            className="w-full px-8 py-4 bg-gray-800/50 border border-gray-600 text-gray-300 rounded-lg font-semibold text-lg hover:bg-gray-700/50 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );

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
        {currentStep === 'language-selection' && renderLanguageSelection()}
        {currentStep === 'voice-input' && renderVoiceInput()}
        {currentStep === 'review' && renderReview()}
        {currentStep === 'completed' && renderCompleted()}
      </div>
    </div>
  );
}
