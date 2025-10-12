// src/hooks/useThreeSetup.ts
import { useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { toast } from "sonner";

export const useThreeSetup = (containerRef: React.RefObject<HTMLDivElement>) => {
  const [threeObjects, setThreeObjects] = useState<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    colliders: THREE.Mesh[];
    listener: THREE.AudioListener;
    detectionArea: THREE.Box3;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const currentContainer = containerRef.current;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    currentContainer.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const colliders: THREE.Mesh[] = [];

    const skyboxLoader = new THREE.CubeTextureLoader();
    const skybox = skyboxLoader.load([
      '/skybox/right.png', '/skybox/left.png', '/skybox/top.png',
      '/skybox/bottom.png', '/skybox/front.png', '/skybox/back.png'
    ]);
    scene.background = skybox;
    
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envMap = pmremGenerator.fromCubemap(skybox).texture;
    scene.environment = envMap;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 10);
    scene.add(camera);

    const listener = new THREE.AudioListener();
    camera.add(listener);

    const musicAudio = new THREE.Audio(listener);
    const audioLoader = new THREE.AudioLoader();
    
    // Load music
    audioLoader.load('/Audio/Music/mystery-in-space-178544.mp3', function(buffer) {
      musicAudio.setBuffer(buffer);
      musicAudio.setLoop(true);
      musicAudio.setVolume(0.5);
      musicAudio.play();
    });

    // Listen for music toggle events
    const handleToggleMusic = (event: CustomEvent) => {
      if (event.detail.enabled) {
        if (!musicAudio.isPlaying) {
          musicAudio.play();
        }
      } else {
        if (musicAudio.isPlaying) {
          musicAudio.pause();
        }
      }
    };

    window.addEventListener('toggleMusic', handleToggleMusic as EventListener);

    const ambientLight = new THREE.AmbientLight(0x8899aa, 0.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;

    directionalLight.shadow.mapSize.width = 512;
    directionalLight.shadow.mapSize.height = 512;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -65;
    directionalLight.shadow.camera.right = 65;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    scene.add(directionalLight);

    // Environment Setup
    async function loadObject(modelName: string, xPos: number, yPos: number, zPos: number, ydeg: number, visible: boolean){
      const modelPath = '../../models/' + modelName;

      try {
        const loader = new GLTFLoader();

        loader.load(modelPath, function(gltf){
          const model = gltf.scene;
          
          model.traverse((child) => {
            if (child instanceof THREE.Mesh && (child.material instanceof THREE.MeshStandardMaterial || child.material instanceof THREE.MeshPhongMaterial)) {
              child.castShadow = true;
              child.receiveShadow = true;
              colliders.push(child);
            }
          });

          model.scale.set(1.5, 1.5, 1.5);
          model.position.set(xPos, yPos, zPos);
          model.rotation.y = ydeg * Math.PI / 180;
          model.visible = visible;

          scene.add(model);
        });

      } catch (error) {
        console.error(`Error loading GLTF weapon ${modelName}:`, error);
        toast.error(`Failed to load GLTF model for ${modelName}.`);
      }
    }

    loadObject('Map.glb', 0, 0, 5, -90, true);
    loadObject('NavMesh.glb', 0, 0, 5, 90, false);

    // Create a visible debug box (optional)
    const boxGeometry = new THREE.BoxGeometry(5, 5, 5);
    const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    const detectionBox = new THREE.Mesh(boxGeometry, boxMaterial);
    detectionBox.position.set(0, 2.5, -10);
    scene.add(detectionBox);

    // Create a bounding box for collision detection
    const detectionArea = new THREE.Box3().setFromObject(detectionBox);

    setThreeObjects({ scene, camera, renderer, colliders, listener, detectionArea });

    // --- Handlers & Cleanup ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener('toggleMusic', handleToggleMusic as EventListener);
      
      if (musicAudio.isPlaying) {
        musicAudio.stop();
      }
      
      if (currentContainer && currentContainer.contains(renderer.domElement)) {
        currentContainer.removeChild(renderer.domElement);
      }

      pmremGenerator.dispose();
      renderer.dispose();
    };
  }, [containerRef]);
  return threeObjects;
};