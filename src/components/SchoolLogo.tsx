import React from 'react';

interface SchoolLogoProps {
  className?: string;
  size?: number;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({ className = 'w-10 h-10', size }) => {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`} style={size ? { width: size, height: size } : undefined}>
      <img
        src="/mozac_logo.jpg"
        alt="SM SAINS MUZAFFAR SYAH Logo"
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain rounded-md"
      />
    </div>
  );
};
