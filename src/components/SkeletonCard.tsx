import React from 'react';

export const SkeletonCard: React.FC = () => (
  <div className="bg-surface-container-low rounded-xl p-space-lg border border-outline-variant/40 studio-shadow flex flex-col gap-space-md animate-pulse">
    <div className="flex items-center justify-between">
      <div className="w-10 h-10 rounded-lg bg-surface-container-high" />
      <div className="w-16 h-4 rounded-full bg-surface-container-high" />
    </div>
    <div className="flex flex-col gap-2">
      <div className="w-2/3 h-5 rounded bg-surface-container-high" />
      <div className="w-full h-3.5 rounded bg-surface-container" />
      <div className="w-4/5 h-3.5 rounded bg-surface-container" />
    </div>
  </div>
);

export const SkeletonImageFrame: React.FC<{ className?: string }> = ({ className = 'h-80' }) => (
  <div
    className={`w-full rounded-xl bg-surface-container-low border border-outline-variant/40 overflow-hidden relative ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-surface-container-high/50 to-transparent animate-[shimmer_1.4s_infinite]" />
  </div>
);
