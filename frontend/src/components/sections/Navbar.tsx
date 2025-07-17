import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import { useState, useEffect, useRef } from 'react';
import NotificationBell from '../ui/NotificationBell';

interface NavbarProps {
  onOpenNotifications: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onOpenNotifications }) => {
  const { i18n, t } = useTranslation('skillbuilder');
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navbarRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    const name = localStorage.getItem('user_name');
    const userName = localStorage.getItem('userName'); // Check alternative key
    const fullName = localStorage.getItem('full_name'); // Check another alternative
    
    setIsLoggedIn(!!token);
    // Try multiple possible keys for the user name
    const finalName = name || userName || fullName || ''; // No default fallback
    setUserName(finalName);
  }, [location.pathname]); // Re-check when route changes

  useEffect(() => {
    const id = localStorage.getItem('user_id');
    setUserId(id ? parseInt(id) : null);
  }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_type');
    localStorage.removeItem('user_name');
    setIsLoggedIn(false);
    setUserName('');
    navigate('/');
  };

  const toggleDropdown = (dropdownName: string) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  // Dropdown component
  const Dropdown = ({ title, items, dropdownKey }: { 
    title: string; 
    items: { label: string; path: string }[]; 
    dropdownKey: string;
  }) => (
    <div className="relative">
      <button
        onClick={() => toggleDropdown(dropdownKey)}
        className="text-gray-300 hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap min-w-fit"
        title={title}
      >
        <span className="block">{title}</span>
        <svg
          className={`w-4 h-4 transition-transform flex-shrink-0 ${
            activeDropdown === dropdownKey ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {activeDropdown === dropdownKey && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-black/90 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl z-50">
          {items.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-white/10 transition-colors first:rounded-t-lg last:rounded-b-lg"
              onClick={() => setActiveDropdown(null)}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );

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
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-black/50 border-b border-white/10 h-20" ref={navbarRef}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center py-4">
            <Link to="/">
              <Logo />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6 ml-8 flex-1 justify-end">
              <NavLink to="/job-board" className="text-gray-300 hover:text-white transition-colors">
                {t('navbar.jobs')}
              </NavLink>
              <NavLink to="/schemes" className="text-gray-300 hover:text-white transition-colors">
                {t('navbar.schemes')}
              </NavLink>
              
              {/* Learning Dropdown */}
              <Dropdown 
                title={t('navbar.learning')}
                dropdownKey="learning"
                items={[
                  { label: t('navbar.skills'), path: "/skill-builder" },
                  { label: t('navbar.courseRecommender'), path: "/course-recommender" },
                ]}
              />
              
              {/* Business & Projects Dropdown */}
              <Dropdown 
                title={t('navbar.business')}
                dropdownKey="business"
                items={[
                  { label: t('navbar.businessIdeas'), path: "/business-suggestions" },
                  { label: t('navbar.projects'), path: "/projects" }
                ]}
              />
              
              <NavLink to="/events" className="text-gray-300 hover:text-white transition-colors">
                {t('navbar.events')}
              </NavLink>
              
              {isLoggedIn ? (
                <Dropdown 
                  title={userName ? `${t('navbar.welcome')}, ${userName}` : t('navbar.profile')}
                  dropdownKey="profile"
                  items={[
                    { label: t('navbar.profile'), path: "/profile" },
                    { label: t('navbar.dashboard'), path: "/dashboard" },
                  ]}
                />
              ) : (
                <NavLink to="/auth" className="text-gray-300 hover:text-white transition-colors">
                  {t('navbar.login')}
                </NavLink>
              )}
              
              {/* Logout button for logged in users */}
              {isLoggedIn && (
                <button
                  onClick={handleLogout}
                  className="text-gray-300 hover:text-white transition-colors px-3 py-1 border border-gray-600 rounded hover:border-gray-400"
                >
                  {t('navbar.logout')}
                </button>
              )}
              
              {userId && <NotificationBell userId={userId} onClick={onOpenNotifications} />}

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
              {userId && <NotificationBell userId={userId} onClick={onOpenNotifications} />}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-black/90 border-t border-white/10 py-4 px-6 max-h-[70vh] overflow-y-auto">
            <div className="flex flex-col space-y-4">
              <Link 
                to="/" 
                className="text-gray-300 hover:text-white transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navbar.home')}
              </Link>
              <Link 
                to="/job-board" 
                className="text-gray-300 hover:text-white transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navbar.jobs')}
              </Link>
              <Link 
                to="/schemes" 
                className="text-gray-300 hover:text-white transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navbar.schemes')}
              </Link>
              <Link 
                to="/skill-builder" 
                className="text-gray-300 hover:text-white transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navbar.skills')}
              </Link>
              <Link 
                to="/business-suggestions" 
                className="text-gray-300 hover:text-white transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navbar.businessIdeas')}
              </Link>
              <Link 
                to="/events" 
                className="text-gray-300 hover:text-white transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navbar.events')}
              </Link>
              <Link 
                to="/projects" 
                className="text-gray-300 hover:text-white transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navbar.projects')}
              </Link>
              <Link 
                to="/community" 
                className="text-gray-300 hover:text-white transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navbar.community')}
              </Link>
              <Link 
                to="/dashboard" 
                className="text-gray-300 hover:text-white transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navbar.dashboard')}
              </Link>
              {isLoggedIn ? (
                <>
                  <Link 
                    to="/profile" 
                    className="text-gray-300 hover:text-white transition-colors py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('navbar.profile')}
                  </Link>
                  <div className="pt-2 border-t border-gray-700">
                    <div className="text-gray-300 text-sm mb-2">{t('navbar.welcome')}, {userName}</div>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left text-gray-300 hover:text-white transition-colors py-2"
                    >
                      {t('navbar.logout')}
                    </button>
                  </div>
                </>
              ) : (
                <Link 
                  to="/auth" 
                  className="text-gray-300 hover:text-white transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('navbar.login')}
                </Link>
              )}
              <Link 
                to="/course-recommender" 
                className="text-gray-300 hover:text-white transition-colors py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('navbar.courseRecommender')}
              </Link>
              {isLoggedIn && (
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="md"
                    navigateTo="/profile/create"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('navbar.createProfile')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;