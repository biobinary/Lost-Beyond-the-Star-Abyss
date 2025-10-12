// src/pages/Index.tsx
import { FPSScene } from "@/components/FPSScene";
import { HUD } from "@/components/HUD";

const Index = ({ isPaused, onTogglePause, isMusicEnabled, onPlayerDied }: { isPaused: boolean; onTogglePause: () => void; isMusicEnabled: boolean, onPlayerDied: () => void; }) => {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-background">
      <FPSScene isPaused={isPaused} onTogglePause={onTogglePause} isMusicEnabled={isMusicEnabled} onPlayerDied={onPlayerDied} />
      <HUD />
    </main>
  );
};

export default Index;