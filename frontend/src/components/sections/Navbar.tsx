// 1st version
// import { Link, useNavigate } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';
// import Logo from '../ui/Logo';
// import Button from '../ui/Button';

// const Navbar: React.FC = () => {
//   const { i18n, t } = useTranslation('skillbuilder');
//   const navigate = useNavigate();

//   return (
//     <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-black/50 border-b border-white/10 h-20">
//       <div className="max-w-7xl mx-auto px-6">
//         <div className="flex justify-between items-center py-4">
//           <Link to="/">
//             <Logo />
//           </Link>

//           <div className="hidden md:flex items-center gap-8">
//             <a href="#features" className="text-gray-300 hover:text-white transition-colors">
//               {t('navbar.features')}
//             </a>
//             <a href="#about" className="text-gray-300 hover:text-white transition-colors">
//               {t('navbar.about')}
//             </a>
//             <a href="#contact" className="text-gray-300 hover:text-white transition-colors">
//               {t('navbar.contact')}
//             </a>
//             <Link to="/profile" className="text-gray-300 hover:text-white transition-colors">
//               {t('navbar.profile')}
//             </Link>
//             <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">
//               {t('navbar.dashboard')}
//             </Link>
//             <Link to="/community" className="text-gray-300 hover:text-white transition-colors">
//               {t('navbar.community')}
//             </Link>
//             <Link to="/skill-builder" className="text-gray-300 hover:text-white transition-colors">
//               {t('navbar.skills')}
//             </Link>

//             {/* ✅ Working Button with navigateTo */}
//             <Button
//               variant="primary"
//               size="md"
//               navigateTo="/profile"
//             >
//               {t('navbar.signUp') || 'Get Started'}
//             </Button>

//             <select
//               className="p-2 border border-white/20 bg-black/50 text-white rounded focus:outline-none [&>option]:bg-gray-900"
//               value={i18n.language}
//               onChange={(e) => i18n.changeLanguage(e.target.value)}
//             >
//               <option value="en">{t('consumer.filters.languageEnglish')}</option>
//               <option value="hi">{t('consumer.filters.languageHindi')}</option>
//             </select>
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;

import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from '../ui/Logo';
import Button from '../ui/Button';

const Navbar: React.FC = () => {
  const { i18n, t } = useTranslation('skillbuilder');
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-black/50 border-b border-white/10 h-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center py-4">
          <Link to="/">
            <Logo />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <div
              onClick={() => {
                // Scroll to the "features" section
                const element = document.getElementById('features');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-gray-300 hover:text-white transition-colors cursor-pointer"
            >
              {t('navbar.features')}
            </div>
            {/* Removed About and Contact */}
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

            {/* Working Button with navigateTo */}
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
