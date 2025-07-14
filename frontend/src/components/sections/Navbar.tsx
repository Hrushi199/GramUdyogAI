<<<<<<< HEAD
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import { useState, useEffect } from 'react';
=======
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import { useState } from 'react';
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48

const Navbar: React.FC = () => {
  const { i18n, t } = useTranslation('skillbuilder');
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
<<<<<<< HEAD
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    const name = localStorage.getItem('user_name');
    setIsLoggedIn(!!token);
    setUserName(name || '');
  }, [location.pathname]); // Re-check when route changes
=======
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

<<<<<<< HEAD
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_type');
    localStorage.removeItem('user_name');
    setIsLoggedIn(false);
    setUserName('');
    navigate('/');
  };

=======
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
  const handleFeaturesClick = () => {
    if (location.pathname === '/') {
      const element = document.getElementById('features');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/', { state: { scrollToFeatures: true } });
    }
    
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-black/50 border-b border-white/10 h-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center py-4">
          <Link to="/">
            <Logo />
          </Link>

          {/* Desktop Menu */}
<<<<<<< HEAD
          <div className="hidden md:flex items-center space-x-8 ml-12">
            <NavLink to="/job-board" className="text-gray-300 hover:text-white transition-colors">
              Jobs
            </NavLink>
            <NavLink to="/schemes" className="text-gray-300 hover:text-white transition-colors">
              Schemes
            </NavLink>
            <NavLink to="/skill-builder" className="text-gray-300 hover:text-white transition-colors">
              Skills
            </NavLink>
            <NavLink to="/business-suggestions" className="text-gray-300 hover:text-white transition-colors">
              Business
            </NavLink>
            <NavLink to="/events" className="text-gray-300 hover:text-white transition-colors">
              Events
            </NavLink>
            <NavLink to="/projects" className="text-gray-300 hover:text-white transition-colors">
              Projects
            </NavLink>
            {isLoggedIn && (
              <NavLink to="/my-projects" className="text-gray-300 hover:text-white transition-colors">
                My Projects
              </NavLink>
            )}
            <NavLink to="/csr-dashboard" className="text-gray-300 hover:text-white transition-colors">
              CSR
            </NavLink>
            {isLoggedIn ? (
              <>
                <NavLink to="/profile" className="text-gray-300 hover:text-white transition-colors">
                  Profile
                </NavLink>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-300 text-sm">Welcome, {userName}</span>
                  <button
                    onClick={handleLogout}
                    className="text-gray-300 hover:text-white transition-colors px-3 py-1 border border-gray-600 rounded hover:border-gray-400"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <NavLink to="/auth" className="text-gray-300 hover:text-white transition-colors">
                Login
              </NavLink>
            )}
=======
          <div className="hidden md:flex items-center gap-8">
            <div
              onClick={handleFeaturesClick}
              className="text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              {t('navbar.features')}
            </div>
            <Link to="/profile" className="text-gray-300 hover:text-white transition-colors">
              {t('navbar.profile')}
            </Link>
            <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">
              {t('navbar.dashboard')}
            </Link>
            <Link to="/community" className="text-gray-300 hover:text-white transition-colors">
              {t('navbar.community')}
            </Link>
            <Link to="/skill-builder" className="text-gray-300 hover:text-white transition-colors">
              {t('navbar.skills')}
            </Link>
            {/* --- ADDED THIS LINK --- */}
            <Link to="/course-recommender" className="text-gray-300 hover:text-white transition-colors">
              {t('navbar.courseRecommender')}
            </Link>

            <Button
              variant="primary"
              size="md"
              navigateTo="/profile"
            >
              {t('navbar.signUp') || 'Get Started'}
            </Button>

>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
            <select
              className="p-2 border border-white/20 bg-black/50 text-white rounded focus:outline-none [&>option]:bg-gray-900"
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
            >
              <option value="en">{t('consumer.filters.languageEnglish')}</option>
              <option value="hi">{t('consumer.filters.languageHindi')}</option>
              <option value="bn">{t('consumer.filters.languageBengali')}</option>
              <option value="mr">{t('consumer.filters.languageMarathi')}</option>
              <option value="te">{t('consumer.filters.languageTelugu')}</option>
              <option value="ta">{t('consumer.filters.languageTamil')}</option>
              <option value="gu">{t('consumer.filters.languageGujarati')}</option>
              <option value="ur">{t('consumer.filters.languageUrdu')}</option>
              <option value="kn">{t('consumer.filters.languageKannada')}</option>
              <option value="or">{t('consumer.filters.languageOdia')}</option>
              <option value="ml">{t('consumer.filters.languageMalayalam')}</option>
              <option value="pa">{t('consumer.filters.languagePunjabi')}</option>
              <option value="as">{t('consumer.filters.languageAssamese')}</option>
            </select>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center">
            <select
              className="mr-4 p-2 border border-white/20 bg-black/50 text-white rounded focus:outline-none [&>option]:bg-gray-900"
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
            >
              <option value="en">{t('consumer.filters.languageEnglish')}</option>
              <option value="hi">{t('consumer.filters.languageHindi')}</option>
              <option value="bn">{t('consumer.filters.languageBengali')}</option>
              <option value="mr">{t('consumer.filters.languageMarathi')}</option>
              <option value="te">{t('consumer.filters.languageTelugu')}</option>
              <option value="ta">{t('consumer.filters.languageTamil')}</option>
              <option value="gu">{t('consumer.filters.languageGujarati')}</option>
              <option value="ur">{t('consumer.filters.languageUrdu')}</option>
              <option value="kn">{t('consumer.filters.languageKannada')}</option>
              <option value="or">{t('consumer.filters.languageOdia')}</option>
              <option value="ml">{t('consumer.filters.languageMalayalam')}</option>
              <option value="pa">{t('consumer.filters.languagePunjabi')}</option>
              <option value="as">{t('consumer.filters.languageAssamese')}</option>
            </select>
            <button
              onClick={toggleMenu}
              className="text-gray-300 hover:text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
<<<<<<< HEAD
        <div className="md:hidden bg-black/90 border-t border-white/10 py-4 px-6 max-h-[70vh] overflow-y-auto">
          <div className="flex flex-col space-y-4">
            <Link 
              to="/" 
              className="text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/job-board" 
              className="text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Jobs
            </Link>
            <Link 
              to="/schemes" 
              className="text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Schemes
            </Link>
            <Link 
              to="/skill-builder" 
              className="text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Skills
            </Link>
            <Link 
              to="/business-suggestions" 
              className="text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Business
            </Link>
            <Link 
              to="/events" 
              className="text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Events
            </Link>
            <Link 
              to="/projects" 
              className="text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Projects
            </Link>
            {isLoggedIn && (
              <Link 
                to="/my-projects" 
                className="text-gray-300 hover:text-white transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                My Projects
              </Link>
            )}
            <Link 
              to="/community" 
              className="text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Community
=======
        <div className="md:hidden bg-black/90 border-t border-white/10 py-4 px-6">
          <div className="flex flex-col space-y-4">
            <div
              onClick={handleFeaturesClick}
              className="text-gray-300 hover:text-white transition-colors cursor-pointer py-2"
            >
              {t('navbar.features')}
            </div>
            <Link 
              to="/profile" 
              className="text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('navbar.profile')}
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
            </Link>
            <Link 
              to="/dashboard" 
              className="text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
<<<<<<< HEAD
              Dashboard
            </Link>
            {isLoggedIn ? (
              <>
                <Link 
                  to="/profile" 
                  className="text-gray-300 hover:text-white transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <div className="pt-2 border-t border-gray-700">
                  <div className="text-gray-300 text-sm mb-2">Welcome, {userName}</div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left text-gray-300 hover:text-white transition-colors py-2"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <Link 
                to="/auth" 
                className="text-gray-300 hover:text-white transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            )}
=======
              {t('navbar.dashboard')}
            </Link>
            <Link 
              to="/community" 
              className="text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('navbar.community')}
            </Link>
            <Link 
              to="/skill-builder" 
              className="text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              {t('navbar.skills')}
            </Link>
            {/* --- ADDED THIS LINK --- */}
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
            <Link 
              to="/course-recommender" 
              className="text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Course Recommender
            </Link>
<<<<<<< HEAD
            {isLoggedIn && (
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  navigateTo="/profile/create"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Create Profile
                </Button>
              </div>
            )}
=======
            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                navigateTo="/profile"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navbar.signUp') || 'Get Started'}
              </Button>
            </div>
>>>>>>> 67bc1d18df77eb37d08a63ea39f59d52a7dc4b48
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
