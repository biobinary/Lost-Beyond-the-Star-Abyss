// src/App.tsx
import { useState, useEffect, useCallback } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MainMenu from "./components/MainMenu";
import PauseMenu from "./components/PauseMenu";
import SettingsMenu from "./components/SettingsMenu";
import StoryTutorial from "./components/StoryTutorial";
import CreditsMenu from "./components/CreditsMenu";
import GameOver from "./components/GameOver";
import LoadingScreen from "./components/LoadingScreen";
import { PodWindowOverlay } from "./components/PodWindowOverlay";
import { AssetManager } from './systems/AssetManager';

function FadeOverlay({ opacity }: { opacity: number }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "black",
        opacity,
        transition: "opacity 1s ease-in-out",
        pointerEvents: "none",
        zIndex: 10000,
      }}
    />
  );
}

const queryClient = new QueryClient();

function App() {
  const [inGame, setInGame] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [showStory, setShowStory] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingAssetName, setLoadingAssetName] = useState('');
  const [assetManager, setAssetManager] = useState<AssetManager | null>(null);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [fadeOpacity, setFadeOpacity] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [showFPS, setShowFPS] = useState(true);

  const initializeAssetManager = useCallback(() => {
    const manager = new AssetManager(
      (progress, assetName) => {
        setLoadingProgress(progress);
        setLoadingAssetName(assetName);
        if (assetName.includes('Error')) {
          setLoadingError(assetName);
        }
      },
      () => {
        setAssetsLoaded(true);
      }
    );
    manager.loadAssets();
    setAssetManager(manager);
    return manager;
  }, []);

  useEffect(() => {
    const manager = initializeAssetManager();
    return () => {
      manager.dispose();
    };
  }, [initializeAssetManager]);

  useEffect(() => {
    const handleFadeEvent = (e: CustomEvent<{ toBlack: boolean; duration?: number }>) => {
      const { toBlack, duration = 1000 } = e.detail;
      setIsFading(true);
      setFadeOpacity(toBlack ? 1 : 0);
      setTimeout(() => setIsFading(false), duration);
    };
    window.addEventListener("fadeScreen", handleFadeEvent as EventListener);
    return () => window.removeEventListener("fadeScreen", handleFadeEvent as EventListener);
  }, []);

  const handleStartFromMenu = () => {
    setShowStory(true);
  };

  const startGame = () => {
    setShowStory(false);
    setInGame(true);
    setIsPaused(false);
    setIsGameOver(false);
  };

  const togglePause = useCallback(() => {
    if (isGameOver) return;
    setIsPaused(prev => !prev);
    setShowSettings(false);
  }, [isGameOver]);

  const backToMainMenu = () => {
    setInGame(false);
    setIsPaused(false);
    setShowSettings(false);
    setShowCredits(false);
    setIsGameOver(false);
  };

  const handleShowCredits = () => {
    setShowCredits(true);
  };
  
  const handlePlayerDied = () => {
    setIsGameOver(true);
    setIsPaused(true);
  };
  
  const handleRestart = () => {
    setIsGameOver(false);
    setInGame(false);
    if (assetManager) {
      assetManager.dispose();
    }
    initializeAssetManager();
    setTimeout(() => {
      setInGame(true);
      setIsPaused(false);
    }, 100);
  };

  const openSettings = () => {
    setShowSettings(true);
  };

  const closeSettings = () => {
    setShowSettings(false);
  };

  const toggleMusic = () => {
    setIsMusicEnabled(prev => {
      const newValue = !prev;
      window.dispatchEvent(new CustomEvent('toggleMusic', { detail: { enabled: newValue } }));
      return newValue;
    });
  };

  const toggleFPS = () => {
    setShowFPS(prev => !prev);
  };

  if (!assetsLoaded || !assetManager) {
    return <LoadingScreen progress={loadingProgress} assetName={loadingError || loadingAssetName} />;
  }

  if (loadingError) {
    return (
      <div className="absolute top-0 left-0 w-full h-full bg-black flex justify-center items-center">
        <div className="text-white text-center">
          <h1 className="text-2xl">Error Loading Assets</h1>
          <p>{loadingError}</p>
          <button
            className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded"
            onClick={initializeAssetManager}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (showCredits) {
    return <CreditsMenu onBack={() => setShowCredits(false)} />;
  }

  if (showStory) {
    return <StoryTutorial onStartGame={startGame} />;
  }

  if (!inGame) {
    return <MainMenu onStartGame={handleStartFromMenu} onShowCredits={handleShowCredits} />;
  }
  
  if (isGameOver) {
    return <GameOver onRestart={handleRestart} onMainMenu={backToMainMenu} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <Index
                  isPaused={isPaused}
                  onTogglePause={togglePause}
                  isMusicEnabled={isMusicEnabled}
                  onPlayerDied={handlePlayerDied}
                  assetManager={assetManager}
                  showFPS={showFPS}
                />
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <PodWindowOverlay />
          {isPaused && !showSettings && (
            <PauseMenu
              onResume={togglePause}
              onMainMenu={backToMainMenu}
              onSettings={openSettings}
            />
          )}
          {isPaused && showSettings && (
            <SettingsMenu
              onBack={closeSettings}
              isMusicEnabled={isMusicEnabled}
              onToggleMusic={toggleMusic}
              showFPS={showFPS}
              onToggleFPS={toggleFPS}
            />
          )}
          <FadeOverlay opacity={fadeOpacity} />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;