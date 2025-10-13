import React from 'react';
import { Progress } from "@/components/ui/progress";

interface LoadingScreenProps {
  progress: number;
  assetName: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, assetName }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-black via-slate-950 to-cyan-950/20 flex justify-center items-center overflow-hidden z-30">
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black opacity-70" />
      <div className="relative z-10 text-center space-y-8 px-6 max-w-2xl mx-auto">
        <div className="relative mb-8">
          <h1
            className="text-5xl md:text-7xl font-bold text-cyan-50 tracking-wide filter drop-shadow-[0_0_20px_rgba(0,150,200,0.8)]"
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 40px rgba(0,100,139,0.6)',
              fontFamily: 'monospace',
            }}
          >
            LOADING ASSETS
          </h1>
        </div>
        <div className="relative bg-black/80 backdrop-blur-sm p-8 border-2 border-cyan-800/50 shadow-[0_0_30px_rgba(0,139,139,0.3)]">
          <div className="space-y-4 text-left">
            <Progress value={progress} max={100} className="h-4 [&>div]:bg-cyan-500" />
            <p className="text-center text-cyan-300 font-mono text-sm mt-2">
              Loading: {assetName} ({Math.round(progress)}%)
            </p>
          </div>
        </div>
        <p className="text-cyan-400/60 text-xs md:text-sm font-mono mt-4 animate-pulse italic">
          &gt; Preparing for descent into the abyss...
        </p>
      </div>
       <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-scan-slow" />
      </div>
       <style>{`
        .bg-gradient-radial { background: radial-gradient(circle, var(--tw-gradient-stops)); }
        @keyframes scan-slow { 0% { top: 0%; } 100% { top: 100%; } }
        .animate-scan-slow { animation: scan-slow 12s linear infinite; }
      `}</style>
    </div>
  );
};

export default LoadingScreen;