import { useEffect, useState } from 'react';

interface WeaponInfo {
  name: string;
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;
  weaponIndex: number;
  totalWeapons: number;
}

export const HUD = () => {
  
  const [weaponInfo, setWeaponInfo] = useState<WeaponInfo | null>(null);
  const [fps, setFps] = useState(60);

  useEffect(() => {
    // Listen for weapon updates from the game
    const handleWeaponUpdate = (event: CustomEvent<WeaponInfo>) => {
      setWeaponInfo(event.detail);
    };

    window.addEventListener('weaponUpdate' as any, handleWeaponUpdate);

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
    };

  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none select-none">
      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-8 h-8">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-primary opacity-70 -translate-y-1/2" />
          <div className="absolute left-1/2 top-0 w-0.5 h-full bg-primary opacity-70 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_hsl(var(--primary))]" />
        </div>
      </div>

      {/* Weapon Info - Bottom Right */}
      {weaponInfo && (
        <div className="absolute bottom-6 right-6">
          <div className="bg-card/90 backdrop-blur-sm px-6 py-4 rounded-lg border border-primary/30 shadow-lg">
            {/* Weapon Name */}
            <div className="text-right mb-2">
              <span className="text-lg font-bold text-primary tracking-wide">
                {weaponInfo.name}
              </span>
            </div>
            
            {/* Ammo Counter */}
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
            
            {/* Magazine Indicator */}
            <div className="mt-2 flex justify-end gap-1">
              {[...Array(weaponInfo.maxAmmo)].map((_, i) => (
                <div
                  key={i}
                  className={`w-1 h-3 rounded-full ${
                    i < weaponInfo.ammo 
                      ? 'bg-primary' 
                      : 'bg-muted/30'
                  }`}
                />
              ))}
            </div>

            {/* Weapon Selector */}
            <div className="mt-3 pt-3 border-t border-primary/20">
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-foreground/50">Weapon</span>
                <div className="flex gap-1">
                  {[...Array(weaponInfo.totalWeapons)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i === weaponInfo.weaponIndex
                          ? 'bg-primary shadow-[0_0_8px_hsl(var(--primary))]'
                          : 'bg-muted/40'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-foreground/70 font-mono tabular-nums">
                  {weaponInfo.weaponIndex + 1}/{weaponInfo.totalWeapons}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls Info - Bottom Left */}
      <div className="absolute bottom-6 left-6">
        <div className="bg-card/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-primary/20 space-y-1">
          <div className="flex items-center gap-3">
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono text-primary border border-primary/30">W A S D</kbd>
            <span className="text-sm text-foreground/70">Move</span>
          </div>
          <div className="flex items-center gap-3">
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono text-primary border border-primary/30">SPACE</kbd>
            <span className="text-sm text-foreground/70">Jump</span>
          </div>
          <div className="flex items-center gap-3">
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono text-primary border border-primary/30">SHIFT</kbd>
            <span className="text-sm text-foreground/70">Sprint</span>
          </div>
          <div className="flex items-center gap-3">
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono text-primary border border-primary/30">MOUSE</kbd>
            <span className="text-sm text-foreground/70">Look / Shoot</span>
          </div>
          <div className="flex items-center gap-3">
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono text-primary border border-primary/30">SCROLL</kbd>
            <span className="text-sm text-foreground/70">Switch Weapon</span>
          </div>
          <div className="flex items-center gap-3">
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono text-primary border border-primary/30">R</kbd>
            <span className="text-sm text-foreground/70">Reload</span>
          </div>
        </div>
      </div>

      {/* FPS Counter - Top Right */}
      <div className="absolute top-6 right-6">
        <div className="bg-card/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-accent/20">
          <span className={`text-sm font-mono ${
            fps >= 55 ? 'text-green-500' : fps >= 30 ? 'text-yellow-500' : 'text-red-500'
          }`}>
            FPS: {fps}
          </span>
        </div>
      </div>

      {/* Low Ammo Warning */}
      {weaponInfo && weaponInfo.ammo === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-16">
          <div className="bg-red-500/20 backdrop-blur-sm px-6 py-3 rounded-lg border border-red-500/50 animate-pulse">
            <span className="text-red-500 font-bold text-lg">OUT OF AMMO - RELOAD!</span>
          </div>
        </div>
      )}
    </div>
  );
};