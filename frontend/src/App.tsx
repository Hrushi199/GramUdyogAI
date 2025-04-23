import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Hero from './components/sections/Hero';
import Features from './components/sections/Features';
import Stats from './components/sections/Stats';
import CTA from './components/sections/CTA';
import Footer from './components/sections/Footer';
import Navbar from './components/sections/Navbar';
import SchemeRecommendation from './components/sections/SchemeRecommendation'; // Import the component

// NEW pages
import UserProfile from './pages/UserProfile';
import JobMentorDashboard from './pages/JobMentorDashboard';
import Community from './pages/Community';

export default function App() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    document.title = "EmpowerUp | Unlock Your Business Potential";
    setLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
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
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/dashboard" element={<JobMentorDashboard />} />
          <Route path="/community" element={<Community />} />
          <Route path="/schemes" element={<SchemeRecommendation />} /> {/* Add this route */}
        </Routes>
      </Router>
    </div>
  );
}
