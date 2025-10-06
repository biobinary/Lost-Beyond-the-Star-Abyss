export const HUD = () => {
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative w-8 h-8">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-primary opacity-70 -translate-y-1/2" />
          <div className="absolute left-1/2 top-0 w-0.5 h-full bg-primary opacity-70 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_hsl(var(--primary))]" />
        </div>
      </div>

      {/* Controls Info */}
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
            <span className="text-sm text-foreground/70">Look</span>
          </div>
          <div className="flex items-center gap-3">
            <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono text-primary border border-primary/30">R</kbd>
            <span className="text-sm text-foreground/70">Reload</span>
          </div>
        </div>
      </div>

      {/* FPS Counter placeholder */}
      <div className="absolute top-6 right-6">
        <div className="bg-card/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-accent/20">
          <span className="text-sm font-mono text-accent">FPS: 60</span>
        </div>
      </div>
    </div>
  );
};
