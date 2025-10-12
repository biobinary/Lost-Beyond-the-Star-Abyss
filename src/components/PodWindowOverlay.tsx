import { useEffect, useState } from "react";

export const PodWindowOverlay = () => {
  const [visible, setVisible] = useState(false);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const handleShow = (e: CustomEvent<{ show: boolean }>) => {
      if (e.detail.show) {
        setVisible(true);
        requestAnimationFrame(() => setFade(true)); // trigger fade-in
      } else {
        setFade(false);
        setTimeout(() => setVisible(false), 1000); // fade-out then hide
      }
    };

    window.addEventListener("showPodWindow", handleShow as EventListener);
    return () => window.removeEventListener("showPodWindow", handleShow as EventListener);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center pointer-events-none z-50 transition-opacity duration-1000 ${
        fade ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* === Outer Pod Frame === */}
      <div className="relative w-[100vmin] h-[100vmin] rounded-full border-[4vmin] border-gray-500 shadow-[0_0_60px_rgba(0,0,0,0.8),inset_0_0_60px_rgba(255,255,255,0.1)] overflow-hidden">
        
        {/* --- Metallic texture simulation --- */}
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.15),rgba(0,0,0,0.4))]" />

        {/* --- Inner glowing rim --- */}
        <div className="absolute inset-[1vmin] rounded-full border-[0.8vmin] border-[#44aaff80] shadow-[0_0_40px_rgba(68,170,255,0.3),inset_0_0_20px_rgba(68,170,255,0.4)]" />

        <div className="absolute top-0 left-0 w-full h-full rounded-full bg-gradient-to-b from-white/10 to-transparent mix-blend-overlay" />

        {/* --- Outer vignette shadow --- */}
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_100px_rgba(0,0,0,0.9)] pointer-events-none" />

      </div>
      {/* === Outer Pod Frame === */}
      <div className="absolute w-[240vmin] h-[240vmin] rounded-full border-[70vmin] border-gray-900 shadow-[0_0_60px_rgba(0,0,0,0.8),inset_0_0_60px_rgba(255,255,255,0.1)]" />
    </div>
  );
};
