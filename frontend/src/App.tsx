import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

import Hero from './components/sections/Hero';
import Features from './components/sections/Features';
import Stats from './components/sections/Stats';
import CTA from './components/sections/CTA';
import Footer from './components/sections/Footer';
import Navbar from './components/sections/Navbar';
import SchemeRecommendation from './components/sections/SchemeRecommendation';
import SkillBuilder from './components/sections/SkillBuilder';
import BusinessSuggestions from './components/sections/BusinessSuggestions';
import UserProfile from './components/sections/UserProfile';
import JobMentorDashboard from './components/sections/JobMentorDashboard';
import Community from './components/sections/Community';
import JobBoard from './components/sections/job_board';

// Wrapper component for the home page to handle scroll behavior
const HomePage = ({ loaded }: { loaded: boolean }) => {
  const location = useLocation();
  
  useEffect(() => {
    // Check if we need to scroll to features section
    if (location.state && location.state.scrollToFeatures) {
      setTimeout(() => {
        const featuresElement = document.getElementById('features');
        if (featuresElement) {
          featuresElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100); // Small delay to ensure the page has rendered
    }
  }, [location]);

  return (
    <>
      <Hero loaded={loaded} />
      <Features loaded={loaded} />
      <Stats loaded={loaded} />
      <CTA loaded={loaded} />
      <Footer />
    </>
  );
};
export default function App() {
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    document.title = "EmpowerUp | Unlock Your Business Potential";
    setLoaded(true);
  }, []);
  
  return (
    <div className="min-h-screen bg-black text-white pt-20">
      <Router>
        <Navbar />
        
        <Routes>
          {/* Home Page with scroll handling */}
          <Route path="/" element={<HomePage loaded={loaded} />} />
          
          {/* Other Pages */}
          <Route path="/job-board" element={<JobBoard />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/dashboard" element={<JobMentorDashboard />} />
          <Route path="/community" element={<Community />} />
          <Route path="/schemes" element={<SchemeRecommendation />} />
          <Route path="/skill-builder" element={<SkillBuilder />} />
          <Route path="/business-suggestions" element={<BusinessSuggestions />} />
        </Routes>
      </Router>
    </div>
  );
}