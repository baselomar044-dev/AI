import React from 'react';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ size = 'md', className = '' }) => {
  // Size mappings
  const containerSizes = {
    sm: 'w-10 h-7 rounded-lg',
    md: 'w-16 h-10 rounded-xl',
    lg: 'w-24 h-14 rounded-2xl',
    xl: 'w-32 h-20 rounded-3xl',
    '2xl': 'w-48 h-28 rounded-[2.5rem]',
  };

  const dotSizes = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2.5 h-2.5',
    xl: 'w-3 h-3',
    '2xl': 'w-4 h-4',
  };

  return (
    <div className={`relative flex items-center justify-center bg-[#002266] ${containerSizes[size]} ${className} rounded-bl-none`}>
      {/* Animated Dots */}
      <div className="flex items-center gap-[0.3em]">
        <div className={`${dotSizes[size]} bg-white rounded-full animate-[bounce_1.4s_infinite_0ms]`} />
        <div className={`${dotSizes[size]} bg-white rounded-full animate-[bounce_1.4s_infinite_200ms]`} />
      </div>
    </div>
  );
};
