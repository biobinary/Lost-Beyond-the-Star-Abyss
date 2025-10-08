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

const queryClient = new QueryClient();

function App() {

  const [inGame, setInGame] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const startGame = () => {
    setInGame(true);
    setIsPaused(false);
  };

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const restartGame = () => {
    setInGame(false);
    setTimeout(() => setInGame(true), 100); // Brief delay to reset game state
  };

  const backToMainMenu = () => {
    setInGame(false);
    setIsPaused(false);
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
            <Route path="/" element={<Index isPaused={isPaused} onTogglePause={togglePause} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          {isPaused && (
            <PauseMenu
              onResume={togglePause}
              onMainMenu={backToMainMenu}
            />
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;