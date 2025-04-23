import React from 'react';
import Logo from '../ui/Logo';

const Footer = () => {
  return (
    <footer className="relative py-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <Logo size="sm" />
          <div className="flex gap-6 mt-6 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
          </div>
        </div>
        <div className="mt-8 text-center md:text-left text-gray-500 text-sm">
          © 2025 EmpowerUp. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;