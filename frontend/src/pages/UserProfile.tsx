import { useState, useEffect } from 'react'

export default function UserProfile() {
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({
    name: '', 
    location: '', 
    district: '',
    state: '',
    language: '', 
    skills: '', 
    jobTypes: '', 
    needMentor: false
  })
  
  useEffect(() => {
    // Simulate loading delay for smooth animation
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", 
    "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", 
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
    "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ]
  
  const languages = [
    "Hindi", "Bengali", "Marathi", "Telugu", "Tamil", "Gujarati", "Urdu", "Kannada", 
    "Odia", "Malayalam", "Punjabi", "Assamese", "English", "Other"
  ]
  
  const commonSkills = [
    "Weaving", "Tailoring", "Embroidery", "Pottery", "Wood Carving", "Carpentry",
    "Farming", "Cooking", "Jewelry Making", "Teaching", "Computer Skills"
  ]
  
  const jobTypeOptions = [
    "Remote", "On-site", "Hybrid", "Part-time", "Full-time", "Contract", 
    "Self-employment", "Village-based", "District-based", "State-based"
  ]

  const update = (e: any) => setForm({ ...form, [e.target.name]: e.target.value })
  
  const saveProfile = async () => {
    try {
      await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      alert('Profile saved!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    }
  }
  
  return (
    <div className={`py-16 px-4 sm:px-6 lg:px-8 bg-black text-white min-h-screen transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-xl mx-auto bg-gray-900 rounded-lg shadow-lg p-6 border border-gray-800">
        <h2 
          className={`text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent transition-all duration-500 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          style={{ transitionDelay: '100ms' }}
        >
          Your Profile
        </h2>
        
        <div 
          className={`mb-4 transition-all duration-500 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          style={{ transitionDelay: '200ms' }}
        >
          <label className="block text-gray-300 text-sm mb-2">Full Name</label>
          <input 
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" 
            name="name" 
            placeholder="Enter your full name" 
            value={form.name}
            onChange={update} 
          />
        </div>
        
        <div 
          className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 transition-all duration-500 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          style={{ transitionDelay: '300ms' }}
        >
          <div>
            <label className="block text-gray-300 text-sm mb-2">State</label>
            <select 
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" 
              name="state"
              value={form.state}
              onChange={update}
            >
              <option value="">-- Select State --</option>
              {indianStates.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-300 text-sm mb-2">District / Village</label>
            <input 
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" 
              name="district" 
              placeholder="Enter your district or village" 
              value={form.district}
              onChange={update} 
            />
          </div>
        </div>
        
        <div 
          className={`mb-4 transition-all duration-500 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          style={{ transitionDelay: '400ms' }}
        >
          <label className="block text-gray-300 text-sm mb-2">Preferred Language</label>
          <select 
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" 
            name="language"
            value={form.language}
            onChange={update}
          >
            <option value="">-- Select Language --</option>
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
        
        <div 
          className={`mb-4 transition-all duration-500 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          style={{ transitionDelay: '500ms' }}
        >
          <label className="block text-gray-300 text-sm mb-2">Skills</label>
          <select 
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" 
            name="skills"
            value={form.skills}
            onChange={update}
          >
            <option value="">-- Select Primary Skill --</option>
            {commonSkills.map(skill => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
            <option value="Other">Other</option>
          </select>
          {form.skills === "Other" && (
            <div 
              className="mt-2 overflow-hidden transition-all duration-300"
              style={{ maxHeight: form.skills === "Other" ? '100px' : '0' }}
            >
              <input 
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                name="customSkill" 
                placeholder="Please specify your skill" 
                onChange={(e) => setForm({ ...form, skills: e.target.value })} 
              />
            </div>
          )}
        </div>
        
        <div 
          className={`mb-4 transition-all duration-500 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          style={{ transitionDelay: '600ms' }}
        >
          <label className="block text-gray-300 text-sm mb-2">Preferred Job Types</label>
          <select 
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300" 
            name="jobTypes"
            value={form.jobTypes}
            onChange={update}
          >
            <option value="">-- Select Job Type --</option>
            {jobTypeOptions.map(job => (
              <option key={job} value={job}>{job}</option>
            ))}
            <option value="Other">Other</option>
          </select>
          {form.jobTypes === "Other" && (
            <div 
              className="mt-2 overflow-hidden transition-all duration-300"
              style={{ maxHeight: form.jobTypes === "Other" ? '100px' : '0' }}
            >
              <input 
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                name="customJobType" 
                placeholder="Please specify preferred job type" 
                onChange={(e) => setForm({ ...form, jobTypes: e.target.value })} 
              />
            </div>
          )}
        </div>
        
        <div 
          className={`mb-6 transition-all duration-500 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          style={{ transitionDelay: '700ms' }}
        >
          <label className="flex items-center text-gray-300 hover:text-white transition-colors duration-300 cursor-pointer">
            <input 
              type="checkbox" 
              name="needMentor" 
              className="mr-2 w-5 h-5 bg-gray-800 border-gray-700 rounded text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900" 
              checked={form.needMentor}
              onChange={(e) => setForm({ ...form, needMentor: e.target.checked })} 
            />
            <span>Need Mentorship?</span>
          </label>
        </div>
        
        <div 
          className={`transition-all duration-500 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
          style={{ transitionDelay: '800ms' }}
        >
          <button 
            onClick={saveProfile} 
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  )
}