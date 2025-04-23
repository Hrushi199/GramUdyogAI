import React from 'react';
import { Layers3 } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const sizes = {
    sm: { container: 'w-8 h-8', icon: 'w-5 h-5', text: 'text-lg' },
    md: { container: 'w-10 h-10', icon: 'w-6 h-6', text: 'text-xl' },
    lg: { container: 'w-12 h-12', icon: 'w-7 h-7', text: 'text-2xl' }
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizes[size].container} bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center`}>
        <Layers3 className={`${sizes[size].icon} text-white`} />
      </div>
      {showText && <span className={`${sizes[size].text} font-bold`}>EmpowerUp</span>}
    </div>
  );
};

export default Logo;