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
import CreditsMenu from "./components/CreditsMenu"; // Impor komponen CreditsMenu

const queryClient = new QueryClient();

function App() {
  const [inGame, setInGame] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [showStory, setShowStory] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

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
    setShowSettings(false); // Close settings when unpausing
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
      // Dispatch custom event to control music
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
            <Route path="/" element={<Index isPaused={isPaused} onTogglePause={togglePause} isMusicEnabled={isMusicEnabled} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;