import { FPSScene } from "@/components/FPSScene";
import { HUD } from "@/components/HUD";

const Index = () => {
  return (
    <main className="relative w-full h-screen overflow-hidden bg-background">
      <FPSScene />
      <HUD />
    </main>
  );
};

export default Index;
