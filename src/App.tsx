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

const queryClient = new QueryClient();

function App() {

  const [inGame, setInGame] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);

  const startGame = () => {
    setInGame(true);
    setIsPaused(false);
  };

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
    setShowSettings(false); // Close settings when unpausing
  }, []);

  const restartGame = () => {
    setInGame(false);
    setTimeout(() => setInGame(true), 100); // Brief delay to reset game state
  };

  const backToMainMenu = () => {
    setInGame(false);
    setIsPaused(false);
    setShowSettings(false);
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

  if (!inGame) {
    return <MainMenu onStartGame={startGame} />;
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