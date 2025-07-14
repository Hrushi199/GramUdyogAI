import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ParticleBackground from "../ui/ParticleBackground";
import { useTranslation } from 'react-i18next';
<<<<<<< HEAD
import { Mic, MicOff, CheckCircle, ArrowRight, ArrowLeft, User, MapPin, Languages, Briefcase, Users } from 'lucide-react';
import {userAPI, Profile} from '../../lib/api';
=======

>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
// Interface for our form data
interface UserProfileForm {
  name: string;
  location: string;
  district: string;
  state: string;
  language: string;
  customLanguage: string;
  skills: string[];
  customSkills: string[];
  jobTypes: string[];
  customJobTypes: string[];
  needMentor: boolean;
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
    location: '', 
    district: '',
    state: '',
    language: '', 
    customLanguage: '',
    skills: [], 
    customSkills: [],
    jobTypes: [], 
    customJobTypes: [],
    needMentor: false
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
    if (language !== 'Other') {
      const langCode = language === 'Hindi' ? 'hi' : 'en'; // Map to supported languages
      i18n.changeLanguage(langCode);
    }
    setCurrentStep('voice-input');
  };

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
        location: data.location || prev.location,
        state: data.state || prev.state,
        district: data.district || prev.district,
        skills: data.skills || prev.skills,
        customSkills: data.customSkills || prev.customSkills,
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
        customSkills: [...prev.customSkills, newCustomSkill.trim()]
      }));
      setNewCustomSkill('');
    }
  };

  // Remove custom skill
  const removeCustomSkill = (skill: string) => {
    setForm(prev => ({
      ...prev,
      customSkills: prev.customSkills.filter(s => s !== skill)
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
<<<<<<< HEAD
    if (form.skills.length === 0 && form.customSkills.length === 0) {
      setErrorMessage(t('create_profile.review.validation.skills_required'));
      return false;
    }
    if (form.jobTypes.length === 0 && form.customJobTypes.length === 0) {
      setErrorMessage(t('create_profile.review.validation.job_types_required'));
=======
    if (form.skills.includes('Other') && form.customSkills.length === 0) {
      setErrorMessage(t('create_profile.review.validation.custom_skills_required'));
      return false;
    }
    if (form.jobTypes.includes('Other') && form.customJobTypes.length === 0) {
      setErrorMessage(t('create_profile.review.validation.custom_job_types_required'));
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
      return false;
    }
    return true;
  };

<<<<<<< HEAD



const saveProfile = async () => {
  const userId = localStorage.getItem('user_id');
  
  const profileData: Profile = {
    name: form.name,
    organization: form.organization || null,
    location: form.location,
    state: form.state,
    skills: Array.isArray(form.skills) ? form.skills : form.skills.split(','),
    experience: form.experience || '',  // Ensure required fields have defaults
    goals: form.goals || '',
    user_type: form.userType || 'individual'
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
=======
  // Save profile to backend
  const saveProfile = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      setSaving(true);
      setErrorMessage('');
      const finalLanguage = form.language === 'Other' ? form.customLanguage : form.language;
      const { customLanguage, ...formWithoutCustomLanguage } = form;
      const profileData = {
        ...formWithoutCustomLanguage,
        language: finalLanguage,
        skills: [...form.skills.filter(s => s !== 'Other'), ...form.customSkills],
        jobTypes: [...form.jobTypes.filter(j => j !== 'Other'), ...form.customJobTypes],
      };
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.error || t('create_profile.review.validation.save_error'));
      }
      setCurrentStep('completed');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      setErrorMessage(error.message || t('create_profile.review.validation.save_error'));
    } finally {
      setSaving(false);
    }
  };

  // Render language selection step
  const renderLanguageSelection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-purple-300 mb-6">{t('create_profile.language_selection.header')}</h2>
      <p className="text-gray-300 mb-6">{t('create_profile.language_selection.description')}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">  
        {languages.map(lang => (
          <div
            key={lang}
            onClick={() => selectLanguage(lang)}
            className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-center cursor-pointer hover:bg-purple-900/30 hover:border-purple-500 transition-all duration-300"
          >
            <span className="text-white">{lang}</span>
          </div>
        ))}
      </div>
      {form.language === 'Other' && (
        <div className="mt-4">
          <label className="block text-purple-300 text-sm font-medium mb-2">{t('create_profile.language_selection.specify_language')}</label>
          <input 
            className="w-full p-4 bg-gray-900/80 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 placeholder-gray-400"
            name="customLanguage"
            value={form.customLanguage}
            onChange={update}
            placeholder={t('create_profile.language_selection.custom_language_placeholder')}
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setCurrentStep('voice-input')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700"
              disabled={!form.customLanguage.trim()}
            >
              {t('create_profile.language_selection.continue_button')}
            </button>
          </div>
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
        </div>
      )}
    </div>
  );

<<<<<<< HEAD
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

              {form.customSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.customSkills.map((skill) => (
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
=======
  // Render voice input step
  const renderVoiceInput = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-purple-300 mb-4">{t('create_profile.voice_input.header')}</h2>
      <p className="text-gray-300 mb-6">
        {t('create_profile.voice_input.description', { language: form.language === 'Other' ? form.customLanguage : form.language })}
      </p>
      <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 space-y-4">
        <p className="text-white">🗣️ <strong>{t('create_profile.voice_input.instructions.title')}</strong></p>
        <ul className="list-disc pl-6 text-gray-300 space-y-2">
          <li>{t('create_profile.voice_input.instructions.name')}</li>
          <li>{t('create_profile.voice_input.instructions.location')}</li>
          <li>{t('create_profile.voice_input.instructions.skills')}</li>
          <li>{t('create_profile.voice_input.instructions.job_types')}</li>
          <li>{t('create_profile.voice_input.instructions.mentor')}</li>
        </ul>
      </div>
      {!mediaRecorderSupported && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300">
          {errorMessage}
        </div>
      )}
      {errorMessage && mediaRecorderSupported && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300">
          {errorMessage}
        </div>
      )}
      <div className="flex flex-col items-center justify-center py-10">
        <button
          onClick={isListening ? stopRecording : startRecording}
          disabled={isProcessing || !mediaRecorderSupported}
          className={`w-24 h-24 rounded-full flex items-center justify-center focus:outline-none transition-all duration-300 ${
            isListening 
              ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
          } ${isProcessing || !mediaRecorderSupported ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isListening ? (
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path>
            </svg>
          ) : (
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
            </svg>
          )}
        </button>
        <p className="mt-4 text-white font-medium">
          {isListening 
            ? t('create_profile.voice_input.listening') 
            : isProcessing 
              ? t('create_profile.voice_input.processing') 
              : t('create_profile.voice_input.start_speaking')}
        </p>
      </div>
      {isProcessing && (
        <div className="flex justify-center">
          <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setCurrentStep('language-selection')}
          className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-all duration-300"
        >
          {t('create_profile.voice_input.back_button')}
        </button>
        <button
          onClick={() => setCurrentStep('review')}
          className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all duration-300"
        >
          {t('create_profile.voice_input.skip_button')}
        </button>
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
      </div>
    </div>
  );

<<<<<<< HEAD
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
=======
  // Render review step
  const renderReview = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-purple-300 mb-4">{t('create_profile.review.header')}</h2>
      <p className="text-gray-300 mb-6">{t('create_profile.review.description')}</p>
      {errorMessage && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300">
          {errorMessage}
        </div>
      )}
      <div className="space-y-6">
        {/* Name Input */}
        <div>
          <label className="block text-purple-300 text-sm font-medium mb-2">{t('create_profile.review.name_label')}</label>
          <input 
            className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 placeholder-gray-400"
            name="name"
            value={form.name}
            onChange={update}
            placeholder={t('create_profile.review.name_placeholder')}
          />
        </div>
        {/* State and District Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-purple-300 text-sm font-medium mb-2">{t('create_profile.review.state_label')}</label>
            <div className="relative">
              <select 
                className="w-full p-4 bg-gray-900/80 border border-purple-500/30 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                name="state"
                value={form.state}
                onChange={update}
              >
                <option value="">{t('create_profile.review.state_placeholder')}</option>
                {indianStates.map(state => (
                  <option 
                    key={state} 
                    value={state}
                    className="bg-gray-900 text-white"
                  >
                    {state}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-purple-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-purple-300 text-sm font-medium mb-2">{t('create_profile.review.district_label')}</label>
            <input 
              className="w-full p-4 bg-gray-900/80 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 placeholder-gray-400"
              name="district"
              value={form.district}
              onChange={update}
              placeholder={t('create_profile.review.district_placeholder')}
            />
          </div>
        </div>
        {/* Skills Selection */}
        <div>
          <label className="block text-purple-300 text-sm font-medium mb-2">{t('create_profile.review.skills_label')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {commonSkills.map(skill => (
              <div 
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 text-center text-sm ${
                  form.skills.includes(skill)
                    ? 'border-purple-500 bg-purple-900/30 text-purple-300 font-semibold'
                    : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
                }`}
              >
                {skill}
              </div>
            ))}
          </div>
          {/* Custom Skills Input */}
          {form.skills.includes("Other") && (
            <div className="mt-4 space-y-3">
              <label className="block text-purple-300 text-sm font-medium mb-2">{t('create_profile.review.custom_skills_label')}</label>
              <div className="flex gap-2">
                <input 
                  className="flex-1 p-3 bg-gray-900/80 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 placeholder-gray-400"
                  value={newCustomSkill}
                  onChange={(e) => setNewCustomSkill(e.target.value)}
                  placeholder={t('create_profile.review.custom_skill_placeholder')}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomSkill()}
                />
                <button 
                  onClick={addCustomSkill}
                  className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300"
                >
                  {t('create_profile.review.add_button')}
                </button>
              </div>
              {/* Display custom skills */}
              {form.customSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.customSkills.map(skill => (
                    <div 
                      key={skill}
                      className="px-3 py-2 rounded-lg bg-purple-900/30 border border-purple-500 text-purple-300 flex items-center gap-2 text-sm"
                    >
                      {skill}
                      <button 
                        onClick={() => removeCustomSkill(skill)}
                        className="text-purple-300 hover:text-white transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Job Types Selection */}
        <div>
          <label className="block text-purple-300 text-sm font-medium mb-2">{t('create_profile.review.job_types_label')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {jobTypeOptions.map(jobType => (
              <div 
                key={jobType}
                onClick={() => toggleJobType(jobType)}
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 text-center text-sm ${
                  form.jobTypes.includes(jobType)
                    ? 'border-purple-500 bg-purple-900/30 text-purple-300 font-semibold'
                    : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
                }`}
              >
                {jobType}
              </div>
            ))}
          </div>
          {/* Custom Job Types Input */}
          {form.jobTypes.includes("Other") && (
            <div className="mt-4 space-y-3">
              <label className="block text-purple-300 text-sm font-medium mb-2">{t('create_profile.review.custom_job_types_label')}</label>
              <div className="flex gap-2">
                <input 
                  className="flex-1 p-3 bg-gray-900/80 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 placeholder-gray-400"
                  value={newCustomJobType}
                  onChange={(e) => setNewCustomJobType(e.target.value)}
                  placeholder={t('create_profile.review.custom_job_type_placeholder')}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomJobType()}
                />
                <button 
                  onClick={addCustomJobType}
                  className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300"
                >
                  {t('create_profile.review.add_button')}
                </button>
              </div>
              {/* Display custom job types */}
              {form.customJobTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.customJobTypes.map(jobType => (
                    <div 
                      key={jobType}
                      className="px-3 py-2 rounded-lg bg-purple-900/30 border border-purple-500 text-purple-300 flex items-center gap-2 text-sm"
                    >
                      {jobType}
                      <button 
                        onClick={() => removeCustomJobType(jobType)}
                        className="text-purple-300 hover:text-white transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Mentor Toggle */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div 
              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                form.needMentor ? 'bg-purple-600' : 'bg-gray-700'
              }`}
              onClick={() => setForm(prev => ({ ...prev, needMentor: !prev.needMentor }))}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                form.needMentor ? 'translate-x-6' : 'translate-x-0'
              }`}></div>
            </div>
            <span className="text-gray-300 group-hover:text-white transition-colors duration-300">
              {t('create_profile.review.mentor_label')}
            </span>
          </label>
        </div>
      </div>
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setCurrentStep('voice-input')}
          className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-all duration-300"
        >
          {t('create_profile.review.back_button')}
        </button>
        <button
          onClick={saveProfile}
          disabled={saving}
          className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 ${
            saving ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {saving ? t('create_profile.review.saving') : t('create_profile.review.submit_button')}
        </button>
      </div>
    </div>
  );

  // Render completed step
  const renderCompleted = () => (
    <div className="space-y-6 text-center">
      <h2 className="text-2xl font-bold text-purple-300 mb-4">{t('create_profile.completed.header')}</h2>
      <p className="text-gray-300 mb-6">{t('create_profile.completed.description')}</p>
      <div className="flex justify-center">
        <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
      </div>
    </div>
  );

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
        {currentStep === 'language-selection' && renderLanguageSelection()}
        {currentStep === 'voice-input' && renderVoiceInput()}
        {currentStep === 'review' && renderReview()}
        {currentStep === 'completed' && renderCompleted()}
=======
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <ParticleBackground />
      <div className="absolute inset-0 z-0">
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(38,38,38,0.3)_1px,transparent_1px)] bg-[length:24px_24px]"></div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20 z-10"></div>
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-600 rounded-full filter blur-[128px] opacity-20 z-0"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600 rounded-full filter blur-[128px] opacity-20 z-0"></div>
      <div className="relative z-20 max-w-3xl mx-auto px-6 py-16">
        <div className={`transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          <h1 className="text-6xl font-bold mb-12 text-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-fuchsia-400 to-blue-400">
              {t('create_profile.title')}
            </span>
          </h1>
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden p-8 relative backdrop-blur-sm">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500 rounded-full filter blur-3xl opacity-10"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500 rounded-full filter blur-3xl opacity-10"></div>
            {currentStep === 'language-selection' && renderLanguageSelection()}
            {currentStep === 'voice-input' && renderVoiceInput()}
            {currentStep === 'review' && renderReview()}
            {currentStep === 'completed' && renderCompleted()}
          </div>
        </div>
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
      </div>
    </div>
  );
}

