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
import CourseRecommender from './components/sections/CourseRecommender';
import EventManagement from './components/sections/EventManagement';
import PublicProjects from './components/sections/PublicProjects';
import Auth from './components/sections/Auth';
import UnifiedProfile from './components/sections/UnifiedProfile';
import ProtectedRoute from './components/ProtectedRoute';
import EventDetails from './components/sections/EventDetails';
import NotificationCenter from './components/ui/NotificationCenter';

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
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    document.title = "EmpowerUp | Unlock Your Business Potential";
    setLoaded(true);
    // Set userId from localStorage
    const id = localStorage.getItem('user_id');
    setUserId(id ? parseInt(id) : null);
  }, []);
  
  return (
    <div className="min-h-screen bg-black text-white pt-20">
      <Router>
        <Navbar onOpenNotifications={() => setNotificationOpen(true)} />
        <NotificationCenter
          userId={userId || 0}
          isOpen={notificationOpen}
          onClose={() => setNotificationOpen(false)}
        />
        
        <Routes>
          {/* Home Page with scroll handling */}
          <Route path="/" element={<HomePage loaded={loaded} />} />
          
          {/* Other Pages */}
          <Route path="/job-board" element={<JobBoard />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Profile Routes - Clear separation */}
          <Route path="/profile/create" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<UnifiedProfile publicView={true} />} />
          <Route path="/profile" element={<ProtectedRoute><UnifiedProfile /></ProtectedRoute>} />
          
          <Route path="/dashboard" element={<ProtectedRoute><JobMentorDashboard /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="/schemes" element={<ProtectedRoute><SchemeRecommendation /></ProtectedRoute>} />
          <Route path="/skill-builder" element={<ProtectedRoute><SkillBuilder /></ProtectedRoute>} />
          <Route path="/business-suggestions" element={<ProtectedRoute><BusinessSuggestions /></ProtectedRoute>} />
          <Route path="/youtube-audio-summary" element={<ProtectedRoute><YoutubeAudioSummary /></ProtectedRoute>} />
          <Route path="/course-recommender" element={<ProtectedRoute><CourseRecommender /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><EventManagement /></ProtectedRoute>} />
          <Route path="/events/:eventId" element={<EventDetails />} />
          <Route path="/projects" element={<ProtectedRoute><PublicProjects /></ProtectedRoute>} />
        </Routes>
      </Router>
    </div>
  );
}