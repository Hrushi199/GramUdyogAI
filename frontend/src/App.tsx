import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Hero from './components/sections/Hero';
import Features from './components/sections/Features';
import Stats from './components/sections/Stats';
import CTA from './components/sections/CTA';
import Footer from './components/sections/Footer';
import Navbar from './components/sections/Navbar';
import SchemeRecommendation from './components/sections/SchemeRecommendation'; // Import the component
import SkillBuilder from './components/sections/SkillBuilder';
import BusinessSuggestions from './components/sections/BusinessSuggestions';
// NEW pages
import UserProfile from './components/sections/UserProfile';
import JobMentorDashboard from './components/sections/JobMentorDashboard';
import Community from './components/sections/Community';
import JobBoard from './components/sections/job_board'; // Import the JobBoard component

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
          {/* Home Page (your old content) */}
          <Route path="/" element={
            <>
              <Hero loaded={loaded} />
              <Features loaded={loaded} />
              <Stats loaded={loaded} />
              <CTA loaded={loaded} />
              <Footer />
            </>
          } />

          {/* NEW Pages */}
          <Route path="/job-board" element={<JobBoard />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/dashboard" element={<JobMentorDashboard />} />
          <Route path="/community" element={<Community />} />
          <Route path="/schemes" element={<SchemeRecommendation />} /> {/* Add this route */}
          <Route path="/skill-builder" element={<SkillBuilder />} />
          <Route path="/business-suggestions" element={<BusinessSuggestions />} />
          {/* 404 Page */}
        </Routes>
      </Router>
    </div>
  );
}
