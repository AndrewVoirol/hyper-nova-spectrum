import React, { useState } from 'react';
import { Settings, Activity, Radio, Waves, Wind, Zap, Maximize, RotateCcw, MousePointer2, CircleDot, Eye, EyeOff, Sparkles } from 'lucide-react';

interface Preset {
  name: string;
  icon: string;
  values: {
    rotationSpeed: number;
    spectrumShift: number;
    entropy: number;
    twist: number;
    starSize: number;
    bloomStrength: number;
    singularityDepth: number;
  };
}

const PRESETS: Preset[] = [
  {
    name: 'Nebula',
    icon: '🌌',
    values: {
      rotationSpeed: 0.3,
      spectrumShift: 0.65,
      entropy: 0.7,
      twist: 0.3,
      starSize: 1.8,
      bloomStrength: 2.2,
      singularityDepth: 0,
    },
  },
  {
    name: 'Singularity',
    icon: '🕳️',
    values: {
      rotationSpeed: 1.5,
      spectrumShift: 0.1,
      entropy: 0.15,
      twist: -0.8,
      starSize: 0.6,
      bloomStrength: 2.8,
      singularityDepth: 0.85,
    },
  },
  {
    name: 'Calm',
    icon: '✨',
    values: {
      rotationSpeed: 0.1,
      spectrumShift: 0.0,
      entropy: 0,
      twist: 0,
      starSize: 0.8,
      bloomStrength: 1.0,
      singularityDepth: 0,
    },
  },
];

interface UIOverlayProps {
  isWarping: boolean;
  setIsWarping: (val: boolean) => void;
  rotationSpeed: number;
  setRotationSpeed: (val: number) => void;
  spectrumShift: number;
  setSpectrumShift: (val: number) => void;
  entropy: number;
  setEntropy: (val: number) => void;
  twist: number;
  setTwist: (val: number) => void;
  starSize: number;
  setStarSize: (val: number) => void;
  bloomStrength: number;
  setBloomStrength: (val: number) => void;
  singularityDepth: number;
  setSingularityDepth: (val: number) => void;
  onReset: () => void;
  onApplyPreset: (preset: Preset['values']) => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  isWarping,
  setIsWarping,
  rotationSpeed,
  setRotationSpeed,
  spectrumShift,
  setSpectrumShift,
  entropy,
  setEntropy,
  twist,
  setTwist,
  starSize,
  setStarSize,
  bloomStrength,
  setBloomStrength,
  singularityDepth,
  setSingularityDepth,
  onReset,
  onApplyPreset,
}) => {
  const [uiHidden, setUiHidden] = useState(false);

  return (
    <div className="flex flex-col justify-between h-full w-full p-6 md:p-8">
      
      {/* Header Panel */}
      <div className={`pointer-events-auto w-full max-w-xs transition-all duration-500 ${uiHidden ? 'opacity-0 -translate-x-8 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-2xl">
          <div className="flex justify-between items-start">
            <h1 className="font-['Space_Grotesk'] text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-yellow-400 tracking-wide">
              HYPER-NOVA
            </h1>
            <button 
              onClick={onReset}
              className="text-gray-500 hover:text-white transition-colors p-1"
              title="Reset Defaults"
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-widest opacity-80">
            <Activity size={14} className={isWarping ? "text-red-500 animate-pulse" : "text-green-500"} />
            <span className="text-gray-400">System Status:</span>
            <span className={isWarping ? "text-red-400 font-bold animate-pulse" : "text-green-400 font-bold"}>
              {isWarping ? "TRAJECTORY LOCKED" : "STABLE"}
            </span>
          </div>
        </div>
      </div>

      {/* Warp Steering Indicator */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-1000 ${isWarping ? 'opacity-100' : 'opacity-0'}`}>
         <div className="flex flex-col items-center text-white/50">
            <div className="border border-white/30 w-12 h-12 rounded-full flex items-center justify-center animate-ping absolute" />
            <MousePointer2 size={24} className="mb-2 opacity-50" />
            <span className="text-[10px] font-mono tracking-[0.3em] uppercase text-center bg-black/20 backdrop-blur px-2 py-1 rounded">
                Manual Guidance Active
            </span>
         </div>
      </div>

      {/* Controls Panel */}
      <div className={`pointer-events-auto self-start w-full max-w-xs mt-auto mb-0 md:mb-auto md:mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2 transition-all duration-500 ${uiHidden ? 'opacity-0 -translate-x-8 pointer-events-none' : isWarping ? 'opacity-20 hover:opacity-100' : 'opacity-100'}`}>
        
        {/* Presets */}
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-2xl">
          <div className="flex items-center mb-4 text-gray-300 border-b border-white/10 pb-2">
            <Sparkles size={16} className="mr-2 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest">Presets</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onApplyPreset(preset.values)}
                className="group flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/10 hover:border-white/20 transition-all duration-200"
              >
                <span className="text-lg group-hover:scale-110 transition-transform">{preset.icon}</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 group-hover:text-gray-300 transition-colors">{preset.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-2xl">
          <div className="flex items-center mb-4 text-gray-300 border-b border-white/10 pb-2">
            <Settings size={16} className="mr-2 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-widest">Navigation</span>
          </div>

          {/* Speed Slider */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-gray-400 mb-1 font-mono">
              <label>ROTATION</label>
              <span>{rotationSpeed.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={rotationSpeed}
              onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400 transition-all"
            />
          </div>

          {/* Entropy Slider */}
          <div className="mb-1">
            <div className="flex justify-between text-xs text-gray-400 mb-1 font-mono">
              <label>ENTROPY</label>
              <div className="flex items-center text-purple-400">
                <Waves size={12} className="mr-1" />
                <span>{Math.round(entropy * 100)}%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={entropy}
              onChange={(e) => setEntropy(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
            />
          </div>
        </div>

        {/* Physics Controls */}
        <div className="bg-black/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-2xl">
          <div className="flex items-center mb-4 text-gray-300 border-b border-white/10 pb-2">
            <Zap size={16} className="mr-2 text-yellow-400" />
            <span className="text-xs font-bold uppercase tracking-widest">Cosmic Physics</span>
          </div>

          {/* Spectrum Slider */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-gray-400 mb-1 font-mono">
              <label>SPECTRUM</label>
              <div className="flex items-center text-blue-400">
                <Radio size={12} className="mr-1" />
                <span>{Math.round(spectrumShift * 100)}%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={spectrumShift}
              onChange={(e) => setSpectrumShift(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
            />
          </div>

          {/* Twist Slider */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-gray-400 mb-1 font-mono">
              <label>SPIRAL TWIST</label>
              <div className="flex items-center text-green-400">
                <Wind size={12} className="mr-1" />
                <span>{twist.toFixed(1)}</span>
              </div>
            </div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              value={twist}
              onChange={(e) => setTwist(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500 hover:accent-green-400 transition-all"
            />
          </div>

           {/* Star Size */}
           <div className="mb-5">
            <div className="flex justify-between text-xs text-gray-400 mb-1 font-mono">
              <label>STAR MASS</label>
              <div className="flex items-center text-pink-400">
                <Maximize size={12} className="mr-1" />
                <span>{starSize.toFixed(1)}x</span>
              </div>
            </div>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={starSize}
              onChange={(e) => setStarSize(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all"
            />
          </div>

           {/* Bloom Strength */}
           <div className="mb-5">
            <div className="flex justify-between text-xs text-gray-400 mb-1 font-mono">
              <label>GLOW INTENSITY</label>
              <div className="flex items-center text-yellow-400">
                <Zap size={12} className="mr-1" />
                <span>{bloomStrength.toFixed(1)}</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="3.0"
              step="0.1"
              value={bloomStrength}
              onChange={(e) => setBloomStrength(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400 transition-all"
            />
          </div>

          {/* Singularity Depth */}
          <div className="mb-1">
            <div className="flex justify-between text-xs text-gray-400 mb-1 font-mono">
              <label>SINGULARITY DEPTH</label>
              <div className="flex items-center text-cyan-400">
                <CircleDot size={12} className="mr-1" />
                <span>{Math.round(singularityDepth * 100)}%</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={singularityDepth}
              onChange={(e) => setSingularityDepth(parseFloat(e.target.value))}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all"
            />
          </div>

        </div>
      </div>

      {/* Hide/Show UI Toggle — always visible, bottom-left */}
      <div className="absolute bottom-10 left-8 pointer-events-auto">
        <button
          onClick={() => setUiHidden(!uiHidden)}
          className={`
            flex items-center gap-2 px-4 py-2.5 rounded-full
            text-xs font-mono uppercase tracking-widest
            border transition-all duration-300
            ${uiHidden 
              ? 'bg-white/10 border-white/20 text-white hover:bg-white/15' 
              : 'bg-black/40 backdrop-blur-md border-white/10 text-gray-400 hover:text-white hover:border-white/20'
            }
          `}
          title={uiHidden ? 'Show Controls' : 'Hide Controls'}
        >
          {uiHidden ? <Eye size={14} /> : <EyeOff size={14} />}
          <span>{uiHidden ? 'Show UI' : 'Hide UI'}</span>
        </button>
      </div>

      {/* Warp Button (Centered Bottom) */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <button
          onClick={() => setIsWarping(!isWarping)}
          className={`
            relative overflow-hidden group
            px-10 py-4 rounded-full
            font-bold text-lg tracking-[0.2em] uppercase
            transition-all duration-300 transform
            border border-white/20
            ${isWarping 
              ? 'bg-red-500/20 text-red-100 shadow-[0_0_50px_rgba(220,38,38,0.6)] border-red-500 scale-105' 
              : 'bg-white/5 text-white shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:bg-white/10 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,100,0,0.4)] hover:border-orange-500/50'
            }
          `}
        >
          <span className="relative z-10">{isWarping ? "Disengage" : "Engage Warp"}</span>
          <div className={`absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]`} />
        </button>
      </div>
      
    </div>
  );
};

export default UIOverlay;