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
import YoutubeAudioSummary from './components/sections/YoutubeAudioSummary';
import CSRDashboard from './components/sections/CSRDashboard';
import CourseRecommender from './components/sections/CourseRecommender';
<<<<<<< HEAD
import EventManagement from './components/sections/EventManagement';
import PublicProjects from './components/sections/PublicProjects';
import MyProjects from './components/sections/MyProjects';
import Auth from './components/sections/Auth';
import UnifiedProfile from './components/sections/UnifiedProfile';
import ProtectedRoute from './components/ProtectedRoute';
import EventDetails from './components/sections/EventDetails';
=======
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48

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
<<<<<<< HEAD
          <Route path="/auth" element={<Auth />} />
          
          {/* Profile Routes - Clear separation */}
          <Route path="/profile" element={<ProtectedRoute><UnifiedProfile /></ProtectedRoute>} />
          <Route path="/profile/create" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          
          <Route path="/dashboard" element={<ProtectedRoute><JobMentorDashboard /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="/schemes" element={<ProtectedRoute><SchemeRecommendation /></ProtectedRoute>} />
          <Route path="/skill-builder" element={<ProtectedRoute><SkillBuilder /></ProtectedRoute>} />
          <Route path="/business-suggestions" element={<ProtectedRoute><BusinessSuggestions /></ProtectedRoute>} />
          <Route path="/youtube-audio-summary" element={<ProtectedRoute><YoutubeAudioSummary /></ProtectedRoute>} />
          <Route path="/csr-dashboard" element={<ProtectedRoute><CSRDashboard /></ProtectedRoute>} />
          <Route path="/course-recommender" element={<ProtectedRoute><CourseRecommender /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><EventManagement /></ProtectedRoute>} />
          <Route path="/events/:eventId" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><PublicProjects /></ProtectedRoute>} />
          <Route path="/my-projects" element={<ProtectedRoute><MyProjects /></ProtectedRoute>} />
=======
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/dashboard" element={<JobMentorDashboard />} />
          <Route path="/community" element={<Community />} />
          <Route path="/schemes" element={<SchemeRecommendation />} />
          <Route path="/skill-builder" element={<SkillBuilder />} />
          <Route path="/business-suggestions" element={<BusinessSuggestions />} />
          <Route path="/youtube-audio-summary" element={<YoutubeAudioSummary />} />
          <Route path="/csr-dashboard" element={<CSRDashboard />} />
          <Route path="/course-recommender" element={<CourseRecommender />} />
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
        </Routes>
      </Router>
    </div>
  );
}