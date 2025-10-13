import { FPSScene } from "@/components/FPSScene";
import { HUD } from "@/components/HUD";
import { AssetManager } from "@/systems/AssetManager"; // import

const Index = ({ isPaused, onTogglePause, isMusicEnabled, onPlayerDied, assetManager }: { isPaused: boolean; onTogglePause: () => void; isMusicEnabled: boolean, onPlayerDied: () => void; assetManager: AssetManager; }) => { // Terima props
  return (
    <main className="relative w-full h-screen overflow-hidden bg-background">
      <FPSScene isPaused={isPaused} onTogglePause={onTogglePause} isMusicEnabled={isMusicEnabled} onPlayerDied={onPlayerDied} assetManager={assetManager} /> // Oper props
      <HUD />
    </main>
  );
};

export default Index;