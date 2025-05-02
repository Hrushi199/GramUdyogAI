// import React from 'react';
// import { useTranslation } from 'react-i18next';
// import Button from '../ui/Button';

// interface CTAProps {
//   loaded: boolean;
// }

// const CTA: React.FC<CTAProps> = ({ loaded }) => {
//   const { t } = useTranslation('cta');

//   return (
//     <div className="relative py-24 overflow-hidden">
//       <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-black to-blue-900/20"></div>
//       <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
//         <div className={`transform transition-all duration-1000 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
//           <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('title')}</h2>
//           <p className="text-xl text-gray-300 mb-10">{t('description')}</p>
//           <Button size="lg">{t('button')}</Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CTA;

import React from 'react';
import { useTranslation } from 'react-i18next';

interface CTAProps {
  loaded: boolean;
}

const CTA: React.FC<CTAProps> = ({ loaded }) => {
  const { t } = useTranslation('cta');

  return (
    <div className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-black to-blue-900/20"></div>
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div className={`transform transition-all duration-1000 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('title')}</h2>
          <p className="text-xl text-gray-300">{t('description')}</p>
        </div>
      </div>
    </div>
  );
};

export default CTA;
