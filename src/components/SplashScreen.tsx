import React, { useEffect, useState } from 'react';
import { JevalleneLogo } from './JevalleneLogo';

export const SplashScreen: React.FC = () => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 950);
    const hideTimer = setTimeout(() => setVisible(false), 1350);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-surface flex flex-col items-center justify-center gap-space-md transition-opacity duration-400 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="animate-fade-in-up flex flex-col items-center gap-space-md">
        <JevalleneLogo size={84} className="ring-2 ring-primary/30 studio-shadow-float" />
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="font-headline-lg text-headline-lg font-bold tracking-[0.22em] text-on-surface uppercase">
            JEVALLENE
          </span>
          <span className="font-code-stat text-code-stat tracking-widest text-primary uppercase">
            Photo Editor
          </span>
        </div>
        <div className="w-44 h-1 rounded-full bg-surface-container-high overflow-hidden mt-2">
          <div className="h-full bg-gradient-to-r from-[#E5142A] via-primary to-secondary animate-[splashBar_1s_ease-out_forwards]" />
        </div>
      </div>
    </div>
  );
};
