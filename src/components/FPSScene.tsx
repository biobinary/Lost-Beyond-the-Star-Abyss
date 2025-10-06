// src/components/FPSScene.tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThreeSetup } from "../hooks/useThreeSetup";
import { InputManager } from "../systems/InputManager";
import { PlayerController } from "../systems/PlayerController";
import { WeaponManager } from "../systems/WeaponManager";
import { EffectsManager } from "../systems/EffectsManager";
import { Shotgun } from "@/weapons/Shotgun";
import { WeaponSpawnManager } from "@/systems/WeaponSpawnManager"; // Tambahkan import ini

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
    const weaponSpawnManager = new WeaponSpawnManager(scene, weaponManager, playerController); // Inisialisasi spawn manager

    const initialWeapon = new Shotgun();
    weaponManager.equip(initialWeapon);
    
    const clock = new THREE.Clock();
    const animate = () => {
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      playerController.update(delta, elapsedTime);
      weaponManager.update(elapsedTime, delta);
      weaponSpawnManager.update(delta); // Panggil update untuk spawn manager
      
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      inputManager.dispose();
    };
  }, [threeObjects]);

  return <div ref={containerRef} className="fixed inset-0" />;
};