 // src/components/FPSScene.tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThreeSetup } from "../hooks/useThreeSetup";
import { InputManager } from "../systems/InputManager";
import { PlayerController } from "../systems/PlayerController";
import { WeaponManager } from "../systems/WeaponManager";
import { EffectsManager } from "../systems/EffectsManager";
import { Blaster } from "../weapons/Blaster";

export const FPSScene = () => {

  const containerRef = useRef<HTMLDivElement>(null);
  const threeObjects = useThreeSetup(containerRef);

  useEffect(() => {

    if (!threeObjects) return;

    const { scene, camera, renderer } = threeObjects;

    const inputManager = new InputManager(renderer.domElement);
    const playerController = new PlayerController(camera, inputManager);
    const effectsManager = new EffectsManager(scene);
    const weaponManager = new WeaponManager(camera, scene, effectsManager, inputManager);
    
    const initialWeapon = new Blaster();
    weaponManager.equip(initialWeapon);
    
    const clock = new THREE.Clock();
    const animate = () => {
      
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Update systems in order
      playerController.update(delta, elapsedTime);
      weaponManager.update(elapsedTime, delta);
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);

    };

    animate();

    // Cleanup
    return () => {
      inputManager.dispose();
    };

  }, [threeObjects]);

  return <div ref={containerRef} className="fixed inset-0" />;

};