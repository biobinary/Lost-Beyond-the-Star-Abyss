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
import {PodWindowOverlay} from "./components/PodWindowOverlay";

function FadeOverlay({ opacity }: { opacity: number }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "black",
        opacity,
        transition: "opacity 1s ease-in-out",
        pointerEvents: "none", // don't block input
        zIndex: 10000, // always on top
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

  const [fadeOpacity, setFadeOpacity] = useState(0);
  const [isFading, setIsFading] = useState(false);

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
  };

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
    setShowSettings(false);
  }, []);

  const backToMainMenu = () => {
    setInGame(false);
    setIsPaused(false);
    setShowSettings(false);
    setShowCredits(false);
  };

  const handleShowCredits = () => {
    setShowCredits(true);
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

  if (showCredits) {
    return <CreditsMenu onBack={() => setShowCredits(false)} />;
  }

  if (showStory) {
    return <StoryTutorial onStartGame={startGame} />;
  }

  if (!inGame) {
    return <MainMenu onStartGame={handleStartFromMenu} onShowCredits={handleShowCredits} />;
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
            />
          )}
          <FadeOverlay opacity={fadeOpacity} />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;