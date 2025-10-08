import { FPSScene } from "@/components/FPSScene";
import { HUD } from "@/components/HUD";

const Index = ({ isPaused, onTogglePause }: { isPaused: boolean; onTogglePause: () => void }) => {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-background">
      <FPSScene isPaused={isPaused} onTogglePause={onTogglePause} />
      <HUD />
    </main>
  );
};

export default Index;
