import React, { useState, useCallback } from 'react';
import Scene from './components/Scene';
import UIOverlay from './components/UIOverlay';
import LoadingOverlay from './components/LoadingOverlay';

const App: React.FC = () => {
  const [isWarping, setIsWarping] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState(0.2);
  const [spectrumShift, setSpectrumShift] = useState(0);
  const [entropy, setEntropy] = useState(0);
  
  // New Controls
  const [twist, setTwist] = useState(0);
  const [starSize, setStarSize] = useState(1.0);
  const [bloomStrength, setBloomStrength] = useState(1.5);
  
  // Singularity Control
  const [singularityDepth, setSingularityDepth] = useState(0);

  // Loading state
  const [isLoaded, setIsLoaded] = useState(false);

  const resetDefaults = useCallback(() => {
    setRotationSpeed(0.2);
    setSpectrumShift(0);
    setEntropy(0);
    setTwist(0);
    setStarSize(1.0);
    setBloomStrength(1.5);
    setSingularityDepth(0);
  }, []);

  const applyPreset = useCallback((values: {
    rotationSpeed: number;
    spectrumShift: number;
    entropy: number;
    twist: number;
    starSize: number;
    bloomStrength: number;
    singularityDepth: number;
  }) => {
    setRotationSpeed(values.rotationSpeed);
    setSpectrumShift(values.spectrumShift);
    setEntropy(values.entropy);
    setTwist(values.twist);
    setStarSize(values.starSize);
    setBloomStrength(values.bloomStrength);
    setSingularityDepth(values.singularityDepth);
  }, []);

  const handleSceneReady = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">
      {/* Loading Overlay */}
      <LoadingOverlay isLoaded={isLoaded} />

      {/* 3D Scene Layer */}
      <div className="absolute inset-0 z-0">
        <Scene 
          isWarping={isWarping} 
          rotationSpeed={rotationSpeed} 
          spectrumShift={spectrumShift} 
          entropy={entropy}
          twist={twist}
          starSize={starSize}
          bloomStrength={bloomStrength}
          singularityDepth={singularityDepth}
          onReady={handleSceneReady}
        />
      </div>

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <UIOverlay 
          isWarping={isWarping}
          setIsWarping={setIsWarping}
          rotationSpeed={rotationSpeed}
          setRotationSpeed={setRotationSpeed}
          spectrumShift={spectrumShift}
          setSpectrumShift={setSpectrumShift}
          entropy={entropy}
          setEntropy={setEntropy}
          twist={twist}
          setTwist={setTwist}
          starSize={starSize}
          setStarSize={setStarSize}
          bloomStrength={bloomStrength}
          setBloomStrength={setBloomStrength}
          singularityDepth={singularityDepth}
          setSingularityDepth={setSingularityDepth}
          onReset={resetDefaults}
          onApplyPreset={applyPreset}
        />
      </div>
    </div>
  );
};

export default App;