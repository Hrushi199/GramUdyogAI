import React, { useEffect } from 'react';
import { Cpu, Building2, Users, GraduationCap, Youtube } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface FeaturesProps {
  loaded: boolean;
}

const Features: React.FC<FeaturesProps> = ({ loaded }) => {
  const { t } = useTranslation('featuresname'); // Use 'features' namespace
  const navigate = useNavigate();

  // Debug translations
  useEffect(() => {
    console.log('Features translations:', {
      headerTitle: t('header.title'),
      feature0Title: t('features.0.title'),
      feature0Description: t('features.0.description'),
      feature1Title: t('features.1.title'),
    });
  }, [t]);

  // Define features with correct array key syntax, reordered to place YouTube Audio Summary in the middle
  const features = [
    {
      titleKey: 'features.0.title',
      descriptionKey: 'features.0.description',
      fallbackTitle: 'AI Business Suggestions',
      fallbackDescription: 'Get personalized business recommendations based on your skills, resources, and market conditions',
      icon: Cpu,
      onClick: () => navigate('/business-suggestions'),
    },
    {
      titleKey: 'features.1.title',
      descriptionKey: 'features.1.description',
      fallbackTitle: 'Government Schemes',
      fallbackDescription: 'Access a curated database of relevant government programs, subsidies, and support initiatives',
      icon: Building2,
      onClick: () => navigate('/schemes'),
    },
    {
      titleKey: 'features.4.title',
      descriptionKey: 'features.4.description',
      fallbackTitle: 'YouTube Audio Summary',
      fallbackDescription: 'Summarize any YouTube video into actionable audio insights in your language.',
      icon: Youtube,
      onClick: () => navigate('/youtube-audio-summary'),
    },
    {
      titleKey: 'features.2.title',
      descriptionKey: 'features.2.description',
      fallbackTitle: 'Networking Opportunities',
      fallbackDescription: 'Post and find job openings to connect with like-minded professionals.',
      icon: Users,
      onClick: () => navigate('/job-board'),
    },
    {
      titleKey: 'features.3.title',
      descriptionKey: 'features.3.description',
      fallbackTitle: 'Skills Development',
      fallbackDescription: 'Access targeted training resources to build the exact skills you need for your business',
      icon: GraduationCap,
      onClick: () => navigate('/skill-builder'),
    },
  ];

  return (
    <div id="features" className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-900/20 to-black"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div
          className={`text-center mb-16 transform transition-all duration-1000 ${
            loaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold">
            {t('header.title', 'Comprehensive Business Support')}
          </h2>
          <p className="mt-4 text-xl text-gray-400 max-w-3xl mx-auto">
            {t('header.description', 'Everything you need to succeed as an entrepreneur, all in one place')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              onClick={feature.onClick}
              className={`group bg-gradient-to-br from-white/5 to-white/0 p-8 rounded-2xl border border-white/10 backdrop-blur-sm hover:border-purple-500/50 transition-all duration-300 transform ${
                loaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
              } cursor-pointer`}
              style={{ transitionDelay: `${300 + index * 150}ms` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">
                {t(feature.titleKey, feature.fallbackTitle)}
              </h3>
              <p className="text-gray-400">
                {t(feature.descriptionKey, feature.fallbackDescription)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;