import React from 'react';

export const JevalleneLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 36,
  className = '',
}) => {
  return (
    <div
      className={`relative flex items-center justify-center rounded-full overflow-hidden shrink-0 studio-shadow transition-transform duration-300 hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/jevallene-logo.svg"
        alt="Jevallene Logo"
        width={size}
        height={size}
        className="w-full h-full object-contain block"
      />
    </div>
  );
};
