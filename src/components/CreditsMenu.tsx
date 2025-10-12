import React, { useEffect, useState } from "react";

interface CreditsMenuProps {
  onBack: () => void;
}

const CreditsMenu: React.FC<CreditsMenuProps> = ({ onBack }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [flicker, setFlicker] = useState(false);
  const [stars, setStars] = useState<
    Array<{ x: number; y: number; size: number; speed: number; opacity: number }>
  >([]);

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

  const developers = [
    {
      name: "Muhammad Ammar Ghifari",
      nim: "5025231109",
      avatar: "/pictures/Ammar.png",
      github: "https://github.com/biobinary",
    },
    {
      name: "Carolus Nathanell",
      nim: "5025231136",
      avatar: "/pictures/Nell.png",
      github: "https://github.com/CarolusNathanell",
    },
    {
      name: "Muhammad Shafa Narariya",
      nim: "5025231016",
      avatar: "/pictures/Shafa.png",
      github: "https://github.com/ItsPong",
    },
  ];

  return (
    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-black via-slate-950 to-cyan-950/20 flex justify-center items-center overflow-hidden z-20">
      {/* Dying Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-blue-100 animate-pulse"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDuration: `${star.speed}s`,
              opacity: star.opacity,
              boxShadow: "0 0 3px rgba(100, 150, 255, 0.4)",
            }}
          />
        ))}
      </div>

      {/* Ominous Blue Fog */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-blue-950/10 to-blue-900/30 animate-pulse" style={{ animationDuration: "8s" }} />
      
      {/* Dark Vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black opacity-70" />
      
      {/* Energy Drip Effect */}
      <div className="absolute top-0 left-1/4 w-1 h-32 bg-gradient-to-b from-blue-900/60 to-transparent animate-drip" />
      <div className="absolute top-0 right-1/3 w-1 h-24 bg-gradient-to-b from-cyan-900/40 to-transparent animate-drip" style={{ animationDelay: '2s' }} />
      
      {/* Flickering Static */}
      {flicker && (
        <div className="absolute inset-0 bg-white opacity-5 pointer-events-none" />
      )}

      {/* Static Noise Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5 mix-blend-overlay"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
        }}
      />

      {/* Konten utama */}
      <div
        className={`relative z-10 text-center space-y-10 p-10 transition-all duration-1000 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        {/* Judul */}
        <div className="relative mb-8">
          <h1
            className={`text-5xl md:text-7xl font-bold text-cyan-50 tracking-wide filter alienate-shadow-[0_0_20px_rgba(0,150,200,0.8)] ${flicker ? 'opacity-70' : ''}`}
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 40px rgba(0,100,139,0.6)',
              fontFamily: 'monospace',
            }}
          >
            CREDITS
          </h1>
          {/* Glitch layers */}
          <div className="absolute top-0 left-0 w-full opacity-30 animate-glitch-horror" style={{ color: '#0088AA' }}>
            <h1 className="text-5xl md:text-7xl font-bold tracking-wide" style={{ fontFamily: 'monospace' }}>
              CREDITS
            </h1>
          </div>
        </div>

        {/* Daftar Pengembang */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 justify-items-center pt-4">
          {developers.map((dev, index) => (
            <div
              key={index}
              className="relative bg-gradient-to-b from-cyan-900/40 via-slate-900/60 to-black/70 border border-cyan-700/40 p-6 shadow-[0_0_25px_rgba(0,150,255,0.4)] hover:shadow-[0_0_50px_rgba(0,180,255,0.8)] transition-all duration-500 backdrop-blur-md hover:-translate-y-2 w-72"
              style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 95%, 95% 100%, 0% 100%)' }}
            >
              <div className="relative w-full h-64 flex justify-center items-end mb-4">
                <img
                  src={dev.avatar}
                  alt={dev.name}
                  className="object-contain h-full drop-shadow-[0_0_20px_rgba(0,180,255,0.3)]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
              </div>
              <h2 className="text-xl font-bold text-cyan-100 uppercase tracking-wider">
                {dev.name}
              </h2>
              <p className="text-sm text-cyan-400/80 font-mono mt-1">
                {dev.nim}
              </p>
              <a
                href={dev.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-cyan-300 font-mono mt-2 inline-block hover:text-cyan-100 transition-colors duration-300"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.66-.22.66-.49v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.12-1.47-1.12-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.64-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85 0 1.71.11 2.51.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.56 4.94.36.31.68.92.68 1.85v2.74c0 .27.16.59.66.49A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z" />
                  </svg>
                  GitHub
                </span>
              </a>
            </div>
          ))}
        </div>

        {/* Tombol Kembali */}
        <div className="pt-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-cyan-900/30 rounded blur-xl opacity-60 group-hover:opacity-90 transition-opacity duration-500" />
            <button
              className={`relative bg-black border-2 border-cyan-800 text-cyan-200 font-mono font-bold text-lg md:text-xl py-3 px-12 hover:bg-cyan-950 hover:border-cyan-600 hover:text-cyan-50 transition-all duration-300 shadow-[0_0_30px_rgba(0,139,139,0.4)] hover:shadow-[0_0_50px_rgba(0,139,139,0.8)] backdrop-blur-sm ${flicker ? 'animate-pulse' : ''}`}
              onClick={onBack}
              style={{
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 85%, 95% 100%, 0% 100%)',
              }}
            >
              <span className="relative z-10 flex items-center gap-3 tracking-widest">
                <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                BACK
                <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Corrupted Corner Decorations */}
      <div className="absolute top-0 left-0 w-24 h-24 border-l-2 border-t-2 border-cyan-800/40" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 15%, 95% 20%, 0 20%, 0 100%)' }} />
      <div className="absolute top-0 right-0 w-24 h-24 border-r-2 border-t-2 border-cyan-800/40" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 100% 20%, 5% 20%, 0 15%)' }} />
      <div className="absolute bottom-0 left-0 w-24 h-24 border-l-2 border-b-2 border-cyan-800/40" style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%, 100% 85%, 5% 80%, 0 80%)' }} />
      <div className="absolute bottom-0 right-0 w-24 h-24 border-r-2 border-b-2 border-cyan-800/40" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 0 85%, 95% 80%, 100% 80%)' }} />

      {/* Scanning Lines */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-scan-slow" />
      </div>

      <style>{`
        .bg-gradient-radial { background: radial-gradient(circle, var(--tw-gradient-stops)); }
        @keyframes glitch-horror { 0%, 100% { transform: translate(0); opacity: 0.3; } 10% { transform: translate(-3px, 3px); opacity: 0.5; } 20% { transform: translate(3px, -3px); opacity: 0.2; } 30% { transform: translate(-3px, -3px); opacity: 0.4; } 40% { transform: translate(3px, 3px); opacity: 0.3; } 50% { transform: translate(0); opacity: 0.5; } }
        @keyframes scan-slow { 0% { top: 0%; } 100% { top: 100%; } }
        @keyframes drip { 0% { transform: translateY(-100%); opacity: 0; } 50% { opacity: 0.6; } 100% { transform: translateY(100vh); opacity: 0; } }
        .animate-glitch-horror { animation: glitch-horror 4s infinite; }
        .animate-scan-slow { animation: scan-slow 12s linear infinite; }
        .animate-drip { animation: drip 8s ease-in infinite; }
      `}</style>
    </div>
  );
};

export default CreditsMenu;