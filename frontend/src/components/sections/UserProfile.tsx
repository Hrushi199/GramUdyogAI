import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ParticleBackground from "../ui/ParticleBackground";

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
      setErrorMessage("Audio recording is not supported in this browser. Please try Chrome, Edge, or Safari.");
    }
    return () => clearTimeout(timer);
  }, []);

  // Handle language selection
  const selectLanguage = (language: string) => {
    setForm(prev => ({ ...prev, language }));
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
      setErrorMessage('Unable to access microphone. Please check your browser permissions.');
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
      if (!response.ok) throw new Error('Failed to process audio. Please try again.');
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
      setErrorMessage(error.message || 'An error occurred while processing your voice input.');
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
      setErrorMessage('Please enter your full name.');
      return false;
    }
    if (!form.state) {
      setErrorMessage('Please select your state.');
      return false;
    }
    if (!form.district.trim()) {
      setErrorMessage('Please enter your district.');
      return false;
    }
    if (!form.language) {
      setErrorMessage('Please select a language.');
      return false;
    }
    if (form.language === 'Other' && !form.customLanguage.trim()) {
      setErrorMessage('Please specify your custom language.');
      return false;
    }
    if (form.skills.includes('Other') && form.customSkills.length === 0) {
      setErrorMessage('Please add at least one custom skill or deselect "Other".');
      return false;
    }
    if (form.jobTypes.includes('Other') && form.customJobTypes.length === 0) {
      setErrorMessage('Please add at least one custom job type or deselect "Other".');
      return false;
    }
    return true;
  };

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
        throw new Error(data.detail || data.error || 'Failed to save profile');
      }
      setCurrentStep('completed');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Render language selection step
  const renderLanguageSelection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-purple-300 mb-6">Select Your Preferred Language</h2>
      <p className="text-gray-300 mb-6">
        Please select the language you're most comfortable with. We'll use this for voice input and communication.
      </p>
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
          <label className="block text-purple-300 text-sm font-medium mb-2">Specify Your Language</label>
          <input 
            className="w-full p-4 bg-gray-900/80 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 placeholder-gray-400"
            name="customLanguage"
            value={form.customLanguage}
            onChange={update}
            placeholder="Enter your preferred language"
          />
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setCurrentStep('voice-input')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700"
              disabled={!form.customLanguage.trim()}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Render voice input step
  const renderVoiceInput = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-purple-300 mb-4">Tell Us About Yourself</h2>
      <p className="text-gray-300 mb-6">
        Please speak naturally in {form.language === 'Other' ? form.customLanguage : form.language} about the following information:
      </p>
      <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 space-y-4">
        <p className="text-white">🗣️ <strong>Please mention:</strong></p>
        <ul className="list-disc pl-6 text-gray-300 space-y-2">
          <li>Your full name</li>
          <li>Your state and district</li>
          <li>Skills you have (e.g., weaving, cooking, teaching)</li>
          <li>Types of jobs you're looking for (e.g., remote, part-time)</li>
          <li>Whether you need a mentor</li>
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
            ? 'Listening... Click to stop' 
            : isProcessing 
              ? 'Processing your input...' 
              : 'Click to start speaking'}
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
          Back
        </button>
        <button
          onClick={() => setCurrentStep('review')}
          className="px-6 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-all duration-300"
        >
          Skip Voice Input
        </button>
      </div>
    </div>
  );

  // Render review step
  const renderReview = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-purple-300 mb-4">Review Your Information</h2>
      <p className="text-gray-300 mb-6">
        Please review and edit your information if needed before submitting your profile.
      </p>
      {errorMessage && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300">
          {errorMessage}
        </div>
      )}
      <div className="space-y-6">
        {/* Name Input */}
        <div>
          <label className="block text-purple-300 text-sm font-medium mb-2">Full Name</label>
          <input 
            className="w-full p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 placeholder-gray-400"
            name="name"
            value={form.name}
            onChange={update}
            placeholder="Enter your full name"
          />
        </div>
        {/* State and District Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-purple-300 text-sm font-medium mb-2">State</label>
            <div className="relative">
              <select 
                className="w-full p-4 bg-gray-900/80 border border-purple-500/30 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                name="state"
                value={form.state}
                onChange={update}
              >
                <option value="">Select State</option>
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
            <label className="block text-purple-300 text-sm font-medium mb-2">District</label>
            <input 
              className="w-full p-4 bg-gray-900/80 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 placeholder-gray-400"
              name="district"
              value={form.district}
              onChange={update}
              placeholder="Enter your district"
            />
          </div>
        </div>
        {/* Skills Selection */}
        <div>
          <label className="block text-purple-300 text-sm font-medium mb-2">Your Skills</label>
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
              <label className="block text-purple-300 text-sm font-medium mb-2">Add Custom Skills</label>
              <div className="flex gap-2">
                <input 
                  className="flex-1 p-3 bg-gray-900/80 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 placeholder-gray-400"
                  value={newCustomSkill}
                  onChange={(e) => setNewCustomSkill(e.target.value)}
                  placeholder="Enter a custom skill"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomSkill()}
                />
                <button 
                  onClick={addCustomSkill}
                  className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300"
                >
                  Add
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
          <label className="block text-purple-300 text-sm font-medium mb-2">Preferred Job Types</label>
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
              <label className="block text-purple-300 text-sm font-medium mb-2">Add Custom Job Types</label>
              <div className="flex gap-2">
                <input 
                  className="flex-1 p-3 bg-gray-900/80 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 placeholder-gray-400"
                  value={newCustomJobType}
                  onChange={(e) => setNewCustomJobType(e.target.value)}
                  placeholder="Enter a custom job type"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomJobType()}
                />
                <button 
                  onClick={addCustomJobType}
                  className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300"
                >
                  Add
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
              I'm looking for a mentor
            </span>
          </label>
        </div>
      </div>
      <div className="flex justify-between mt-8">
        <button
          onClick={() => setCurrentStep('voice-input')}
          className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-all duration-300"
        >
          Back
        </button>
        <button
          onClick={saveProfile}
          disabled={saving}
          className={`px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 ${
            saving ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {saving ? 'Saving...' : 'Submit Profile'}
        </button>
      </div>
    </div>
  );

  // Render completed step
  const renderCompleted = () => (
    <div className="space-y-6 text-center">
      <h2 className="text-2xl font-bold text-purple-300 mb-4">Profile Created Successfully!</h2>
      <p className="text-gray-300 mb-6">
        Your profile has been saved. You will be redirected to the dashboard shortly.
      </p>
      <div className="flex justify-center">
        <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    </div>
  );

  return (
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
              Create Your Profile
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
      </div>
    </div>
  );
}