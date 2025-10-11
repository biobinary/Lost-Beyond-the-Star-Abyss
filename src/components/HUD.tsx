import { useEffect, useState } from 'react';
import { Progress } from "@/components/ui/progress"; // Import Progress component

interface WeaponInfo {
  name: string;
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;
  weaponIndex: number;
  totalWeapons: number;
}

interface PlayerStats {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
}

interface PlayerMovementState {
  isMoving: boolean;
  isSprinting: boolean;
}

export const HUD = () => {
  const [weaponInfo, setWeaponInfo] = useState<WeaponInfo | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats>({ health: 100, maxHealth: 100, stamina: 100, maxStamina: 100 });
  const [fps, setFps] = useState(60);
  const [crosshairSpread, setCrosshairSpread] = useState(4);
  const [showHealEffect, setShowHealEffect] = useState(false);

  useEffect(() => {
    
    const handleWeaponUpdate = (event: CustomEvent<WeaponInfo>) => {
      setWeaponInfo(event.detail);
    };

    const handlePlayerStatsUpdate = (event: CustomEvent<PlayerStats>) => {
      setPlayerStats(event.detail);
    };

    const handlePlayerMovementUpdate = (event: CustomEvent<PlayerMovementState>) => {
      const { isMoving, isSprinting } = event.detail;
      if (isSprinting) {
        setCrosshairSpread(12);
      } else if (isMoving) {
        setCrosshairSpread(8);
      } else {
        setCrosshairSpread(4);
      }
    };

    const handleMedkitPickup = () => {
      setShowHealEffect(true);
      setTimeout(() => {
        setShowHealEffect(false);
      }, 500);
    };

    window.addEventListener('weaponUpdate' as any, handleWeaponUpdate);
    window.addEventListener('playerStatsUpdate' as any, handlePlayerStatsUpdate);
    window.addEventListener('playerMovementUpdate' as any, handlePlayerMovementUpdate);
    window.addEventListener('medkitPickup', handleMedkitPickup);

    // FPS counter
    let frameCount = 0;
    let lastTime = performance.now();
    
    const updateFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(updateFPS);
    };
    
    updateFPS();

    return () => {
      window.removeEventListener('weaponUpdate' as any, handleWeaponUpdate);
      window.removeEventListener('playerStatsUpdate' as any, handlePlayerStatsUpdate);
      window.removeEventListener('playerMovementUpdate' as any, handlePlayerMovementUpdate);
      window.removeEventListener('medkitPickup', handleMedkitPickup);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none select-none font-mono">
      {/* Heal Effect Overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          showHealEffect ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(0, 255, 150, 0) 0%, rgba(0, 255, 150, 0.25) 80%, rgba(0, 255, 150, 0.4) 100%)',
        }}
      />
      
      {/* Dynamic Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-1 h-1">
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_hsl(var(--primary))]" />
          <div className="w-0.5 h-2 bg-primary opacity-70 transition-all duration-200 absolute left-1/2 -translate-x-1/2" style={{ bottom: `${crosshairSpread}px` }} />
          <div className="w-0.5 h-2 bg-primary opacity-70 transition-all duration-200 absolute left-1/2 -translate-x-1/2" style={{ top: `${crosshairSpread}px` }} />
          <div className="w-2 h-0.5 bg-primary opacity-70 transition-all duration-200 absolute top-1/2 -translate-y-1/2" style={{ right: `${crosshairSpread}px` }} />
          <div className="w-2 h-0.5 bg-primary opacity-70 transition-all duration-200 absolute top-1/2 -translate-y-1/2" style={{ left: `${crosshairSpread}px` }} />
        </div>
      </div>


      {/* Player Stats - Bottom Left */}
      <div className="absolute bottom-6 left-6 space-y-4">
        <div 
          className="bg-black/80 backdrop-blur-sm p-4 border-2 border-cyan-800/50 w-56"
          style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 85%, 95% 100%, 0% 100%)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold text-red-500">HP</span>
            <Progress value={playerStats.health} max={playerStats.maxHealth} className="h-3 [&>div]:bg-red-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-green-500">SP</span>
            <Progress value={playerStats.stamina} max={playerStats.maxStamina} className="h-3 [&>div]:bg-green-500" />
          </div>
        </div>
      </div>

      {/* Weapon Info - Bottom Right */}
      {weaponInfo && (
        <div className="absolute bottom-6 right-6">
          <div 
            className="bg-black/80 backdrop-blur-sm px-6 py-4 border-2 border-cyan-800/50 shadow-lg"
            style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 5% 100%, 0% 85%)' }}
          >
            <div className="text-right mb-2">
              <span className="text-lg font-bold text-primary tracking-widest">
                {weaponInfo.name}
              </span>
            </div>
            
            <div className="flex items-baseline justify-end gap-2">
              <span className={`text-4xl font-bold tabular-nums ${
                weaponInfo.ammo === 0 
                  ? 'text-red-500' 
                  : weaponInfo.ammo <= weaponInfo.maxAmmo * 0.3 
                  ? 'text-yellow-500' 
                  : 'text-foreground'
              }`}>
                {weaponInfo.ammo}
              </span>
              <span className="text-xl text-foreground/50 font-medium">/</span>
              <span className="text-2xl text-foreground/70 font-medium tabular-nums">
                {weaponInfo.reserveAmmo}
              </span>
            </div>
            
            <div className="mt-2 flex justify-end gap-1">
              {[...Array(weaponInfo.maxAmmo)].map((_, i) => (
                <div key={i} className={`w-1 h-3 rounded-sm ${i < weaponInfo.ammo ? 'bg-primary' : 'bg-muted/30'}`} />
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-primary/20">
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-foreground/50">WEAPON</span>
                <div className="flex gap-1">
                  {[...Array(weaponInfo.totalWeapons)].map((_, i) => (
                    <div key={i} className={`w-2 h-2 ${i === weaponInfo.weaponIndex ? 'bg-primary shadow-[0_0_8px_hsl(var(--primary))]' : 'bg-muted/40'}`} style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }} />
                  ))}
                </div>
                <span className="text-xs text-foreground/70 tabular-nums">
                  {weaponInfo.weaponIndex + 1}/{weaponInfo.totalWeapons}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FPS Counter - Top Right */}
      <div className="absolute top-6 right-6">
        <div 
          className="bg-black/80 backdrop-blur-sm px-4 py-2 border-2 border-cyan-800/50"
          style={{ clipPath: 'polygon(0% 20%, 5% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
        >
          <span className={`text-sm ${
            fps >= 55 ? 'text-green-500' : fps >= 30 ? 'text-yellow-500' : 'text-red-500'
          }`}>
            FPS: {fps}
          </span>
        </div>
      </div>

      {/* Low Ammo Warning */}
      {weaponInfo && weaponInfo.ammo === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-20">
          <div 
            className="bg-red-900/40 backdrop-blur-sm px-6 py-3 border-2 border-red-500/80 animate-pulse"
            style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 80%, 95% 100%, 5% 100%, 0% 80%)' }}
          >
            <span className="text-red-400 font-bold text-lg tracking-widest">[ RELOAD REQUIRED ]</span>
          </div>
        </div>
      )}
    </div>
  );
};