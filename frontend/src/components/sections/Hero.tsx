import React, { useEffect, useRef } from 'react';
import { Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import ParticleBackground from '../ui/ParticleBackground';

interface HeroProps {
  loaded: boolean;
}

const Hero: React.FC<HeroProps> = ({ loaded }) => {
  const { t } = useTranslation('hero');
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const scrollPosition = window.scrollY;
        const parallaxElements = heroRef.current.querySelectorAll('.parallax');

        parallaxElements.forEach((element, index) => {
          const speed = index * 0.05 + 0.1;
          (element as HTMLElement).style.transform = `translateY(${scrollPosition * speed}px)`;
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div ref={heroRef} className="relative overflow-hidden min-h-screen">
      <ParticleBackground />

      <div className="absolute inset-0 z-0">
        <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(38,38,38,0.3)_1px,transparent_1px)] bg-[length:24px_24px]"></div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black/60 to-blue-900/20 z-10"></div>

      <div className="parallax absolute -top-24 -left-24 w-96 h-96 bg-purple-600 rounded-full filter blur-[128px] opacity-20 z-0"></div>
      <div className="parallax absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600 rounded-full filter blur-[128px] opacity-20 z-0"></div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 py-32">
        <div className="flex flex-col md:flex-row items-center gap-16 mt-16">
          <div className={`w-full md:w-1/2 transform transition-all duration-1000 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                {t('header.title.highlight')}
              </span>{' '}
              {t('header.title.rest')}
            </h1>
            <p className="mt-6 text-xl text-gray-300 max-w-xl">
              {t('description')}
            </p>
            <div className="flex flex-wrap gap-4 mt-8">
              <Button size="lg" navigateTo="/profile">
                {t('buttons.getStarted')}
              </Button>
              <Button variant="secondary" size="lg">
                {t('buttons.learnMore')}
              </Button>
            </div>
          </div>

          <div className={`w-full md:w-1/2 transform transition-all duration-1000 delay-300 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <div className="relative aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-64">
                  <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-r from-purple-500 to-blue-500 rounded-3xl transform rotate-12 animate-pulse"></div>
                  <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl transform -rotate-12 animate-pulse animation-delay-1000"></div>
                  <div className="absolute inset-0 m-auto w-40 h-40 bg-black rounded-2xl border border-white/20 flex items-center justify-center shadow-xl">
                    <Zap className="w-16 h-16 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
