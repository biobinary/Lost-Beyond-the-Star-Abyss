import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThreeSetup } from "../hooks/useThreeSetup copy";
import { InputManager } from "../systems/InputManager";
import { PlayerController } from "../systems/PlayerController";
import { WeaponManager } from "../systems/WeaponManager";
import { EffectsManager } from "../systems/EffectsManager";

// Spawn Managers
import { WeaponSpawnManager } from "@/systems/WeaponSpawnManager";
import { HealthItemSpawnManager } from "@/systems/HealthItemSpawnManager";
import { MonsterSpawnManager } from "@/systems/MonsterManager";

export const FPSScene = ({ isPaused, onTogglePause, isMusicEnabled }: { isPaused: boolean; onTogglePause: () => void; isMusicEnabled: boolean }) => {
  
  const containerRef = useRef<HTMLDivElement>(null);
  const threeObjects = useThreeSetup(containerRef);
  
  const isPausedRef = useRef(isPaused);
  const isMusicEnabledRef = useRef(isMusicEnabled);
  
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    isMusicEnabledRef.current = isMusicEnabled;
  }, [isMusicEnabled]);

  useEffect(() => {

    if (!threeObjects) return;

    const handleTogglePause = () => {
      onTogglePause();
    };

    window.addEventListener('togglePause', handleTogglePause);

    const { scene, camera, renderer, colliders, listener  } = threeObjects;

    const inputManager = new InputManager(renderer.domElement);
    const playerController = new PlayerController(camera, inputManager, colliders);
    const playerStatsInstance: IPlayer = (playerController as any).stats; 
    if (!playerStatsInstance) {
        console.error("PlayerStats instance is missing. Monster AI will be skipped.");
        // Logika game dapat berlanjut, tetapi monster AI tidak akan berfungsi
    }
    const effectsManager = new EffectsManager(scene);
    const weaponManager = new WeaponManager(camera, scene, effectsManager, inputManager);
    const monsterSpawnManager = new MonsterSpawnManager(scene, playerStatsInstance);
    const weaponSpawnManager = new WeaponSpawnManager(scene, weaponManager, playerController, effectsManager, listener);
    const healthItemSpawnManager = new HealthItemSpawnManager(scene, playerController, effectsManager, listener);
    
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
      healthItemSpawnManager.update(elapsedTime, delta);
      monsterSpawnManager.update(delta)

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