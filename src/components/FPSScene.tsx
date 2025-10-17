// src/components/FPSScene.tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useThreeSetup } from "../hooks/useThreeSetup copy";
import { InputManager } from "../systems/InputManager";
import { PlayerController } from "../systems/PlayerController";

// Managers
import { WeaponManager } from "../systems/WeaponManager";
import { EffectsManager } from "../systems/EffectsManager";
import { AssetManager } from "../systems/AssetManager";

// Spawn Managers
import { WeaponSpawnManager } from "@/systems/WeaponSpawnManager";
import { HealthItemSpawnManager } from "@/systems/HealthItemSpawnManager";
import { MonsterSpawnManager } from "@/systems/MonsterManager";

export const FPSScene = ({ isPaused, onTogglePause, isMusicEnabled, onPlayerDied, onPlayerWin, assetManager }: { isPaused: boolean; onTogglePause: () => void; isMusicEnabled: boolean; onPlayerDied: () => void; onPlayerWin: () => void; assetManager: AssetManager; }) => {
  
  const containerRef = useRef<HTMLDivElement>(null);
  const threeObjects = useThreeSetup(containerRef, assetManager);
  
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

    const handlePlayerDied = () => {
        onPlayerDied();
    }

    window.addEventListener('togglePause', handleTogglePause);
    window.addEventListener('playerDied', handlePlayerDied);

    const { scene, camera, renderer, colliders, listener, detectionArea  } = threeObjects;

    const inputManager = new InputManager(renderer.domElement);
    const playerController = new PlayerController(camera, inputManager, colliders);
    const effectsManager = new EffectsManager(scene);
    const weaponManager = new WeaponManager(camera, scene, effectsManager, inputManager, assetManager);
    const monsterSpawnManager = new MonsterSpawnManager(scene, playerController, colliders, assetManager);
    const weaponSpawnManager = new WeaponSpawnManager(scene, weaponManager, playerController, effectsManager, listener, assetManager);
    const healthItemSpawnManager = new HealthItemSpawnManager(scene, playerController, effectsManager, listener, assetManager);
    
    const clock = new THREE.Clock();
    let animationFrameId: number;

    let cutsceneStarted = false;
    let cutsceneProgress = 0;

    let startPos = new THREE.Vector3();
    let startRot = new THREE.Euler();
    let escapePodModel;
    loadObject('EscapePod_Window.glb', 0, 5, 60, 0, 89, 1, true).then(model => {escapePodModel = model;});

    const animate = () => {

      animationFrameId = requestAnimationFrame(animate);

      if (isPausedRef.current) {

        if (inputManager.isPointerLocked) {
          document.exitPointerLock();
        }

        return;

      }

      if (!inputManager.isPointerLocked) {
        if (renderer.domElement && document.contains(renderer.domElement)) {
          renderer.domElement.requestPointerLock();
        }
      }

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      if(!cutsceneStarted){
        playerController.update(delta, elapsedTime);
        weaponManager.update(elapsedTime, delta);
        weaponSpawnManager.update(elapsedTime, delta);
        healthItemSpawnManager.update(elapsedTime, delta);
        monsterSpawnManager.update(delta)
      } else {
        cutsceneProgress += delta * 0.075; // adjust speed
        if (cutsceneProgress >= 1) {
          cutsceneProgress = 1;
          onPlayerWin();
        }

        // Interpolate position
        if(escapePodModel){
          escapePodModel.position.z = startPos.z + 1.5 - 35 * cutsceneProgress;
          escapePodModel.rotation.y = 0.25 * cutsceneProgress;
        }

        camera.position.z = startPos.z - 35 * cutsceneProgress;

        // Interpolate rotation
        camera.rotation.z = startRot.z - 0.25 * cutsceneProgress;
      }
      
      if (detectionArea.containsPoint(camera.position) && !cutsceneStarted) {
        startCutscene();
      }

      renderer.render(scene, camera);
    };

    animate();

    const startCutscene = () => {
      startRot.copy(camera.rotation);

      window.dispatchEvent(new CustomEvent("fadeScreen", { detail: { toBlack: true, duration: 1000 } }));

      // Wait a bit, then move camera or start cutscene
      setTimeout(() => {
        weaponManager.disposeAll();
        
        camera.position.set(0, 5, 60);
        startPos.copy(camera.position);

        camera.rotation.x = 0;
        camera.rotation.y = Math.PI;
        camera.rotation.z = 0;

        cutsceneStarted = true;
        
        // Fade back
        window.dispatchEvent(new CustomEvent("fadeScreen", { detail: { toBlack: false, duration: 1000 } }));
      }, 1500);
      
    }

    async function loadObject(modelName: string, xPos: number, yPos: number, zPos: number, ydeg: number, xdeg: number, scale: number, visible: boolean){
      
      try {

          const gltf = assetManager.get<any>('/models/' + modelName);
          const model = gltf.scene;
          
          model.traverse((child: any) => {
            if (child instanceof THREE.Mesh && (child.material instanceof THREE.MeshStandardMaterial || child.material instanceof THREE.MeshPhongMaterial)) {
              child.castShadow = true;
              child.receiveShadow = true;
              colliders.push(child);
            }
          });

          model.scale.set(scale, scale, scale);
          model.position.set(xPos, yPos, zPos);
          model.rotation.y = ydeg * Math.PI / 180;
          model.rotation.x = xdeg * Math.PI / 180;
          model.visible = visible;

          scene.add(model);
          return model;
      
      } catch (error) {
        console.error(`Error getting GLTF from cache ${modelName}:`, error);      
      }

    }

    return () => {
      window.removeEventListener('togglePause', handleTogglePause);
      window.removeEventListener('playerDied', handlePlayerDied);
      cancelAnimationFrame(animationFrameId);
      inputManager.dispose();
    };

  }, [threeObjects, onTogglePause, assetManager]);

  return <div ref={containerRef} className="fixed inset-0" />;

};