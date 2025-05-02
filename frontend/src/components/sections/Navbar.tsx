import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
import { useState } from 'react';

const Navbar: React.FC = () => {
  const { i18n, t } = useTranslation('skillbuilder');
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleFeaturesClick = () => {
    if (location.pathname === '/') {
      // If on home page, just scroll to features section
      const element = document.getElementById('features');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If on another page, navigate to home page first, then scroll to features
      navigate('/', { state: { scrollToFeatures: true } });
    }
    
    // Close mobile menu if it's open
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

            <Button
              variant="primary"
              size="md"
              navigateTo="/profile"
            >
              {t('navbar.signUp') || 'Get Started'}
            </Button>

            <select
              className="p-2 border border-white/20 bg-black/50 text-white rounded focus:outline-none [&>option]:bg-gray-900"
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
            >
              <option value="en">{t('consumer.filters.languageEnglish')}</option>
              <option value="hi">{t('consumer.filters.languageHindi')}</option>
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
            </select>
            <button
              onClick={toggleMenu}
              className="text-gray-300 hover:text-white focus:outline-none"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                // X icon for closing
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Hamburger icon
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
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
            </Link>
            <Link 
              to="/dashboard" 
              className="text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
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
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;