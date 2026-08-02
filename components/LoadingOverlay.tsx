import React, { useState, useEffect } from 'react';

interface LoadingOverlayProps {
  isLoaded: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoaded }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (isLoaded) {
      // Keep it around briefly for the fade-out animation, then unmount
      const timer = setTimeout(() => setVisible(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-1000 ${
        isLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Pulsing core */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 via-yellow-400 to-amber-600 animate-pulse opacity-80 blur-xl absolute inset-0" />
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 via-yellow-400 to-amber-600 opacity-60 relative flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-white/90 blur-sm" />
        </div>
      </div>

      {/* Title */}
      <h1 className="font-['Space_Grotesk'] text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-yellow-400 tracking-widest">
        HYPER-NOVA
      </h1>

      {/* Boot text */}
      <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-[0.3em] text-gray-500">
        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
        <span>Initializing Spectrum</span>
      </div>

      {/* Scanning line */}
      <div className="mt-12 w-48 h-px bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-[shimmer_1.5s_infinite]" />
      </div>
    </div>
  );
};

export default LoadingOverlay;
