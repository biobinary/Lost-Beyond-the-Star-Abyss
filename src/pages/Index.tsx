// src/pages/Index.tsx
import { FPSScene } from "@/components/FPSScene";
import { HUD } from "@/components/HUD";
import { AssetManager } from "@/systems/AssetManager";

const Index = ({ isPaused, onTogglePause, isMusicEnabled, onPlayerDied, assetManager, showFPS }: { isPaused: boolean; onTogglePause: () => void; isMusicEnabled: boolean, onPlayerDied: () => void; assetManager: AssetManager; showFPS: boolean; }) => {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-background">
      <FPSScene isPaused={isPaused} onTogglePause={onTogglePause} isMusicEnabled={isMusicEnabled} onPlayerDied={onPlayerDied} assetManager={assetManager} />
      <HUD showFPS={showFPS} />
    </main>
  );
};

export default Index;