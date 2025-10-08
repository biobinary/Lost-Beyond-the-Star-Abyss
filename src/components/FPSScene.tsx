import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThreeSetup } from "../hooks/useThreeSetup copy";
import { InputManager } from "../systems/InputManager";
import { PlayerController } from "../systems/PlayerController";
import { WeaponManager } from "../systems/WeaponManager";
import { EffectsManager } from "../systems/EffectsManager";
import { WeaponSpawnManager } from "@/systems/WeaponSpawnManager";

export const FPSScene = ({ isPaused, onTogglePause }: { isPaused: boolean; onTogglePause: () => void }) => {
  
  const containerRef = useRef<HTMLDivElement>(null);
  const threeObjects = useThreeSetup(containerRef);
  
  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {

    if (!threeObjects) return;

    const handleTogglePause = () => {
      onTogglePause();
    };

    window.addEventListener('togglePause', handleTogglePause);

    const { scene, camera, renderer, colliders } = threeObjects;

    const inputManager = new InputManager(renderer.domElement);
    const playerController = new PlayerController(camera, inputManager, colliders);
    const effectsManager = new EffectsManager(scene);
    const weaponManager = new WeaponManager(camera, scene, effectsManager, inputManager);
    const weaponSpawnManager = new WeaponSpawnManager(scene, weaponManager, playerController, effectsManager);

    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {

      animationFrameId = requestAnimationFrame(animate);

      if (isPausedRef.current) {

        if (inputManager.isPointerLocked) {
          document.exitPointerLock();
        }

        return;

      }

      if (!inputManager.isPointerLocked) {
        renderer.domElement.requestPointerLock();
      }

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      playerController.update(delta, elapsedTime);
      weaponManager.update(elapsedTime, delta);
      weaponSpawnManager.update(elapsedTime, delta);
      
      renderer.render(scene, camera);
      
    };

    animate();

    return () => {
      window.removeEventListener('togglePause', handleTogglePause);
      cancelAnimationFrame(animationFrameId);
      inputManager.dispose();
    };

  }, [threeObjects, onTogglePause]);

  return <div ref={containerRef} className="fixed inset-0" />;

};