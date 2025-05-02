import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ParticleBackground from "../ui/ParticleBackground";

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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function UserProfile() {
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCustomSkill, setNewCustomSkill] = useState('');
  const [newCustomJobType, setNewCustomJobType] = useState('');
  const [skillError, setSkillError] = useState('');
  const [jobTypeError, setJobTypeError] = useState('');
  const [languageError, setLanguageError] = useState('');
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

  useEffect(() => {
    console.log('API_BASE_URL:', API_BASE_URL);
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const update = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => 
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  
  const toggleSkill = (skill: string) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleJobType = (jobType: string) => {
    setForm(prev => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(jobType)
        ? prev.jobTypes.filter(j => j !== jobType)
        : [...prev.jobTypes, jobType]
    }));
  };

  const addCustomSkill = () => {
    if (!newCustomSkill.trim()) {
      setSkillError('Please enter a skill');
      return;
    }
    
    setSkillError('');
    setForm(prev => ({
      ...prev,
      customSkills: [...prev.customSkills, newCustomSkill.trim()]
    }));
    setNewCustomSkill('');
  };

  const removeCustomSkill = (skill: string) => {
    setForm(prev => ({
      ...prev,
      customSkills: prev.customSkills.filter(s => s !== skill)
    }));
  };

  const addCustomJobType = () => {
    if (!newCustomJobType.trim()) {
      setJobTypeError('Please enter a job type');
      return;
    }
    
    setJobTypeError('');
    setForm(prev => ({
      ...prev,
      customJobTypes: [...prev.customJobTypes, newCustomJobType.trim()]
    }));
    setNewCustomJobType('');
  };

  const removeCustomJobType = (jobType: string) => {
    setForm(prev => ({
      ...prev,
      customJobTypes: prev.customJobTypes.filter(j => j !== jobType)
    }));
  };

  // const saveProfile = async () => {
  //   if (form.skills.includes("Other") && form.customSkills.length === 0) {
  //     setSkillError('Please add at least one custom skill or deselect "Other"');
  //     return;
  //   }
    
  //   if (form.jobTypes.includes("Other") && form.customJobTypes.length === 0) {
  //     setJobTypeError('Please add at least one custom job type or deselect "Other"');
  //     return;
  //   }
    
  //   if (form.language === "Other" && !form.customLanguage.trim()) {
  //     setLanguageError('Please enter your preferred language');
  //     return;
  //   }
    
  //   try {
  //     setSaving(true);
      
  //     const finalLanguage = form.language === "Other" ? form.customLanguage : form.language;
      
  //     const { customLanguage, ...formWithoutCustomLanguage } = form;
  //     const profileData = {
  //       ...formWithoutCustomLanguage,
  //       language: finalLanguage,
  //       skills: [...form.skills.filter(s => s !== "Other"), ...form.customSkills],
  //       jobTypes: [...form.jobTypes.filter(j => j !== "Other"), ...form.customJobTypes]
  //     };
      
  //     console.log('Sending profile data:', profileData);
  //     const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(profileData),
  //     });

  //     const data = await response.json();
  //     console.log('Response data:', data);
      
  //     if (!response.ok) {
  //       throw new Error(data.detail || data.error || 'Failed to save profile');
  //     }

  //     setTimeout(() => {
  //       setSaving(false);
  //       alert('Profile saved successfully!');
  //     }, 1000);
  //   } catch (error: unknown) {
  //     console.error('Error saving profile:', error);
  //     setSaving(false);
  //     alert(error instanceof Error ? error.message : 'Failed to save profile. Please try again.');
  //   }
  // };

  const navigate = useNavigate();
  const saveProfile = async () => {
    if (form.skills.includes("Other") && form.customSkills.length === 0) {
      setSkillError('Please add at least one custom skill or deselect "Other"');
      return;
    }
  
    if (form.jobTypes.includes("Other") && form.customJobTypes.length === 0) {
      setJobTypeError('Please add at least one custom job type or deselect "Other"');
      return;
    }
  
    if (form.language === "Other" && !form.customLanguage.trim()) {
      setLanguageError('Please enter your preferred language');
      return;
    }
  
    try {
      setSaving(true);
  
      const finalLanguage = form.language === "Other" ? form.customLanguage : form.language;
  
      const { customLanguage, ...formWithoutCustomLanguage } = form;
      const profileData = {
        ...formWithoutCustomLanguage,
        language: finalLanguage,
        skills: [...form.skills.filter(s => s !== "Other"), ...form.customSkills],
        jobTypes: [...form.jobTypes.filter(j => j !== "Other"), ...form.customJobTypes],
      };
  
      console.log('Sending profile data:', profileData);
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
  
      const data = await response.json();
      console.log('Response data:', data);
  
      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Failed to save profile');
      }
  
      alert('Profile saved successfully!');
      navigate('/dashboard'); // ✅ Redirect to dashboard
    } catch (error: unknown) {
      console.error('Error saving profile:', error);
      alert(error instanceof Error ? error.message : 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  

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
              Your Profile
            </span>
          </h1>
          
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden p-8 relative backdrop-blur-sm">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-500 rounded-full filter blur-3xl opacity-10"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500 rounded-full filter blur-3xl opacity-10"></div>
            
            <div className="space-y-6">
              {/* Name Input */}
              <div className={`transition-all duration-500 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
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
                    className="w-full p-4 bg-gray-900/80 flag border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 placeholder-gray-400"
                    name="district"
                    value={form.district}
                    onChange={update}
                    placeholder="Enter your district"
                  />
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">Preferred Language</label>
                <div className="relative">
                  <select 
                    className="w-full p-4 bg-gray-900/80 border border-purple-500/30 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300"
                    name="language"
                    value={form.language}
                    onChange={update}
                  >
                    <option value="">Select Language</option>
                    {languages.map(lang => (
                      <option 
                        key={lang} 
                        value={lang}
                        className="bg-gray-900 text-white"
                      >
                        {lang}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-purple-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
                
                {/* Custom Language Input - shown when "Other" is selected */}
                {form.language === "Other" && (
                  <div className="mt-4">
                    <label className="block text-purple-300 text-sm font-medium mb-2">Specify Your Language</label>
                    <input 
                      className="w-full p-4 bg-gray-900/80 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 placeholder-gray-400"
                      name="customLanguage"
                      value={form.customLanguage}
                      onChange={(e) => {
                        update(e);
                        if (e.target.value.trim()) setLanguageError('');
                      }}
                      placeholder="Enter your preferred language"
                    />
                    {languageError && (
                      <p className="text-red-400 text-sm mt-1">{languageError}</p>
                    )}
                  </div>
                )}
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
                
                {/* Custom Skills Input - shown when "Other" is selected */}
                {form.skills.includes("Other") && (
                  <div className="mt-4 space-y-3">
                    <label className="block text-purple-300 text-sm font-medium mb-2">Add Custom Skills</label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input 
                          className="flex-1 p-3 bg-gray-900/80 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 placeholder-gray-400"
                          value={newCustomSkill}
                          onChange={(e) => {
                            setNewCustomSkill(e.target.value);
                            if (e.target.value.trim()) setSkillError('');
                          }}
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
                      {skillError && (
                        <p className="text-red-400 text-sm mt-1">{skillError}</p>
                      )}
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
                
                {/* Custom Job Types Input - shown when "Other" is selected */}
                {form.jobTypes.includes("Other") && (
                  <div className="mt-4 space-y-3">
                    <label className="block text-purple-300 text-sm font-medium mb-2">Add Custom Job Types</label>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input 
                          className="flex-1 p-3 bg-gray-900/80 border border-purple-500/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 placeholder-gray-400"
                          value={newCustomJobType}
                          onChange={(e) => {
                            setNewCustomJobType(e.target.value);
                            if (e.target.value.trim()) setJobTypeError('');
                          }}
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
                      {jobTypeError && (
                        <p className="text-red-400 text-sm mt-1">{jobTypeError}</p>
                      )}
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

              {/* Submit Button */}
              <button 
                type="button"
                onClick={saveProfile}
                disabled={saving}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg shadow-purple-900/20 relative overflow-hidden"
              >
                <span className={`flex items-center justify-center gap-2 transition-all duration-300 ${saving ? 'opacity-0' : 'opacity-100'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Save Profile
                </span>
                
                {saving && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}