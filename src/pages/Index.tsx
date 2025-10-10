import { FPSScene } from "@/components/FPSScene";
import { HUD } from "@/components/HUD";

const Index = ({ isPaused, onTogglePause, isMusicEnabled }: { isPaused: boolean; onTogglePause: () => void; isMusicEnabled: boolean }) => {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-background">
      <FPSScene isPaused={isPaused} onTogglePause={onTogglePause} isMusicEnabled={isMusicEnabled} />
      <HUD />
    </main>
  );
};

export default Index;