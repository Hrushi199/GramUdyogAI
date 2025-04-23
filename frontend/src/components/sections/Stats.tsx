import React from 'react';

interface StatsProps {
  loaded: boolean;
}

const Stats: React.FC<StatsProps> = ({ loaded }) => {
  const stats = [
    { number: "10,000+", label: "Entrepreneurs Supported" },
    { number: "500+", label: "Government Schemes" },
    { number: "95%", label: "Success Rate" }
  ];

  return (
    <div className="relative py-20">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-black to-blue-900/20"></div>
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className={`text-center transform transition-all duration-700 hover:scale-105 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
              style={{ transitionDelay: `${600 + (index * 150)}ms` }}
            >
              <p className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                {stat.number}
              </p>
              <p className="mt-2 text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Stats;