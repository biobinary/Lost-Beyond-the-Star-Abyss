import React, { useEffect, useState } from 'react';

interface WinProps {
  onRestart: () => void;
  onMainMenu: () => void;
}

const Win: React.FC<WinProps> = ({ onRestart, onMainMenu }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [flicker, setFlicker] = useState(false);
  const [stars, setStars] = useState<Array<{ x: number; y: number; size: number; speed: number; opacity: number }>>([]);

  useEffect(() => {
    setIsLoaded(true);

    // Generate dim, dying stars
    const newStars = Array.from({ length: 60 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 3 + 2,
      opacity: Math.random() * 0.3 + 0.1,
    }));
    setStars(newStars);

    // Random flicker effect
    const flickerInterval = setInterval(() => {
      setFlicker(true);
      setTimeout(() => setFlicker(false), 100);
    }, Math.random() * 8000 + 4000);

    return () => clearInterval(flickerInterval);
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-black via-slate-950 to-green-950/20 flex justify-center items-center overflow-hidden">
      {/* Dying Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-green-100 animate-pulse"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDuration: `${star.speed}s`,
              opacity: star.opacity,
              boxShadow: '0 0 3px rgba(255, 100, 100, 0.4)',
            }}
          />
        ))}
      </div>

      {/* Ominous green Fog */}
      <div
        className="absolute inset-0 bg-gradient-radial from-transparent via-green-950/10 to-green-900/30 animate-pulse"
        style={{ animationDuration: '8s' }}
      />

      {/* Dark Vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black opacity-70" />

      {/* Energy Drip Effect */}
      <div className="absolute top-0 left-1/4 w-1 h-32 bg-gradient-to-b from-green-900/60 to-transparent animate-drip" />
      <div
        className="absolute top-0 right-1/3 w-1 h-24 bg-gradient-to-b from-green-900/40 to-transparent animate-drip"
        style={{ animationDelay: '2s' }}
      />

      {/* Flickering Static */}
      {flicker && <div className="absolute inset-0 bg-white opacity-5 pointer-events-none" />}

      {/* Static Noise Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5 mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
        }}
      />

      {/* Main Content */}
      <div
        className={`relative z-10 text-center space-y-6 p-8 transition-all duration-1000 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Distress Signal Icon */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <svg className="w-16 h-16 text-green-500 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="absolute inset-0 w-16 h-16 border-2 border-green-500/50 animate-ping" />
          </div>
        </div>

        {/* Title with Corrupted Glitch Effect */}
        <div className="relative mb-8">
          <h1
            className={`text-5xl md:text-7xl font-bold text-green-50 tracking-wide filter drop-shadow-[0_0_20px_rgba(50,200,50,0.8)] ${
              flicker ? 'opacity-70' : ''
            }`}
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 40px rgba(0, 170, 30, 0.6)',
              fontFamily: 'monospace',
            }}
          >
            ESCAPED
          </h1>
          <div
            className="absolute top-0 left-0 w-full opacity-30 animate-glitch-horror"
            style={{ color: '#00aa00ff' }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-wide" style={{ fontFamily: 'monospace' }}>
              ESCAPED
            </h1>
          </div>
        </div>

        {/* Warning Message */}
        <div className="h-8 flex items-center justify-center my-6">
          <p className="text-base md:text-lg text-green-400/80 font-mono tracking-[0.3em] animate-pulse border-y border-green-900/50 py-2 px-6">
            [ FITAL SIGNS NORMAL ]
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center space-y-4 pt-6">
          {/* Restart Button */}
          <div className="relative group">
            <div className="absolute inset-0 bg-green-900/30 rounded blur-xl opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
            <button
              className={`relative bg-black border-2 border-green-800 text-green-200 font-mono font-bold text-lg md:text-xl py-4 px-16 hover:bg-green-950 hover:border-green-600 hover:text-green-50 transition-all duration-300 shadow-[0_0_30px_rgba(139,0,0,0.4)] hover:shadow-[0_0_50px_rgba(139,0,0,0.8)] backdrop-blur-sm ${
                flicker ? 'animate-pulse' : ''
              }`}
              onClick={onRestart}
              style={{
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 85%, 95% 100%, 0% 100%)',
              }}
            >
              <span className="relative z-10 flex items-center gap-3 tracking-widest">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                RESTART MISSION
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </span>
            </button>
          </div>

          {/* Main Menu Button */}
          <div className="relative group">
            <button
              className={`relative bg-transparent border-2 border-green-900 text-green-400 font-mono text-base py-2 px-8 hover:bg-green-950/50 hover:border-green-700 hover:text-green-200 transition-all duration-300`}
              onClick={onMainMenu}
            >
              <span className="relative z-10 tracking-widest">RETURN TO BASE</span>
            </button>
          </div>
        </div>

        {/* Warning Text */}
        <p className="text-green-400/60 text-xs md:text-sm font-mono mt-4 animate-pulse italic">
          &gt; All systems operational. Contacting HQ.
        </p>
      </div>

      {/* Scanning Lines */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-scan-slow" />
      </div>

      <style>{`
        @keyframes glitch-horror {
          0%, 100% { transform: translate(0); opacity: 0.3; }
          10% { transform: translate(-3px, 3px); opacity: 0.5; }
          20% { transform: translate(3px, -3px); opacity: 0.2; }
          30% { transform: translate(-3px, -3px); opacity: 0.4; }
          40% { transform: translate(3px, 3px); opacity: 0.3; }
          50% { transform: translate(0); opacity: 0.5; }
        }

        @keyframes scan-slow {
          0% { top: 0%; }
          100% { top: 100%; }
        }

        @keyframes drip {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateY(100vh); opacity: 0; }
        }

        .animate-glitch-horror {
          animation: glitch-horror 4s infinite;
        }

        .animate-scan-slow {
          animation: scan-slow 12s linear infinite;
        }

        .animate-drip {
          animation: drip 8s ease-in infinite;
        }

        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
};

export default Win;