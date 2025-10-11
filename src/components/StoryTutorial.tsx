import React, { useEffect, useState } from "react";

interface StoryTutorialProps {
  onStartGame: () => void;
}

const StoryTutorial: React.FC<StoryTutorialProps> = ({ onStartGame }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [stars, setStars] = useState<
    Array<{ x: number; y: number; size: number; speed: number; opacity: number }>
  >([]);

  useEffect(() => {
    setIsLoaded(true);
    const newStars = Array.from({ length: 100 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.3,
      speed: Math.random() * 6 + 1,
      opacity: Math.random() * 0.7 + 0.3,
    }));
    setStars(newStars);
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-black via-indigo-950/40 to-cyan-950/60 flex justify-center items-center overflow-hidden z-20">
      {/* 🌌 Starfield Background */}
      <div className="absolute inset-0 overflow-hidden">
        {stars.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-cyan-200 animate-twinkle"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDuration: `${star.speed}s`,
              opacity: star.opacity,
              boxShadow: "0 0 6px rgba(100,200,255,0.8)",
              transform: `translateY(${Math.sin(star.x) * 5}px)`,
            }}
          />
        ))}
      </div>

      {/* 🔮 Subtle Moving Nebula */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(60,0,100,0.2)_0%,_transparent_70%)] animate-nebula opacity-70" />

      {/* 🎥 Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/90 opacity-80" />

      {/* 📜 Main Content */}
      <div
        className={`relative z-10 text-center space-y-8 px-6 max-w-2xl mx-auto transition-all duration-1000 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        }`}
      >
        {/* ✨ Title */}
        <div className="relative mb-8">
          <h1
            className="text-3xl sm:text-5xl font-extrabold text-cyan-100 tracking-tight"
            style={{
              fontFamily: "'Orbitron', monospace",
              textShadow:
                "0 0 10px rgba(0,255,255,0.7), 0 0 25px rgba(0,150,255,0.5), 0 0 50px rgba(0,80,255,0.3)",
            }}
          >
            STORY & TUTORIAL
          </h1>
          <div className="h-0.5 w-40 bg-gradient-to-r from-transparent via-cyan-400 to-transparent mx-auto mt-4 animate-pulse" />
        </div>

        {/* 📖 Content Card */}
        <div className="relative bg-black/70 border border-cyan-800/40 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.15)] hover:shadow-[0_0_40px_rgba(0,255,255,0.25)] transition-shadow duration-500">
          <div className="space-y-8 text-left">
            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-2">STORY</h2>
              <p className="text-gray-200 text-sm leading-relaxed">
                A mysterious distress signal leads you to an abandoned space
                station. Secret experiments have opened a rift to an alien
                dimension, releasing horrors that corrupt the crew. You must
                survive the whispers from the void — and face what remains
                beyond the rift.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-cyan-400 mb-2">CONTROLS</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-100 text-sm">
                {[
                  ["W A S D", "Move"],
                  ["SPACE", "Jump"],
                  ["SHIFT", "Sprint"],
                  ["MOUSE", "Aim & Fire"],
                  ["SCROLL", "Switch Weapons"],
                  ["R", "Reload"],
                ].map(([key, action], i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 p-2 bg-cyan-950/30 rounded border border-cyan-800/30 hover:bg-cyan-900/40 transition"
                  >
                    <kbd className="px-2 py-0.5 bg-cyan-800/40 rounded text-xs font-mono text-cyan-300 border border-cyan-600/30 min-w-12 text-center">
                      {key}
                    </kbd>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* 🚀 Start Button */}
        <div className="relative group mt-8">
          <div className="absolute inset-0 rounded-full blur-md bg-cyan-500/40 group-hover:opacity-100 opacity-50 animate-pulse transition-all" />
          <button
            className="relative z-10 bg-black/80 border border-cyan-600 text-cyan-100 font-mono text-base sm:text-lg py-3 px-10 rounded-lg hover:bg-cyan-950/70 hover:border-cyan-400 transition-all duration-300 shadow-[0_0_25px_rgba(0,255,255,0.3)]"
            onClick={onStartGame}
          >
            <span className="flex items-center gap-3 tracking-wide">
              <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              ENTER THE ABYSS
              <span className="inline-block w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            </span>
          </button>
        </div>
      </div>

      <style>{`
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.9; }
        }
        .animate-twinkle {
          animation: twinkle 3s infinite alternate;
        }
        @keyframes nebula {
          0% { transform: scale(1) rotate(0deg); opacity: 0.6; }
          50% { transform: scale(1.2) rotate(20deg); opacity: 0.8; }
          100% { transform: scale(1) rotate(0deg); opacity: 0.6; }
        }
        .animate-nebula {
          animation: nebula 20s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default StoryTutorial;
