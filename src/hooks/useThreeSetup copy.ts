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
    camera.position.set(0, 3, 10); // Mundur sedikit untuk view yang lebih luas
    scene.add(camera);

    const ambientLight = new THREE.AmbientLight(0x8899aa, 0.2);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(10, 15, 5);
    directionalLight.castShadow = true;

    directionalLight.shadow.mapSize.width = 512;
    directionalLight.shadow.mapSize.height = 512;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -25;
    directionalLight.shadow.camera.right = 25;
    directionalLight.shadow.camera.top = 25;
    directionalLight.shadow.camera.bottom = -25;
    scene.add(directionalLight);

    // Environment Setup
    async function loadObject(modelName: string, xPos, yPos, zPos, deg){
      const modelPath = '../../models/SciFiLike Asset/' + modelName
      let model

      try {
        const loader = new GLTFLoader();
        // const textureLoader = new THREE.TextureLoader();

        loader.load(modelPath, function(gltf){
          model = gltf.scene;
          
          model.traverse((child) => {
            if (child instanceof THREE.Mesh && (child.material instanceof THREE.MeshStandardMaterial || child.material instanceof THREE.MeshPhongMaterial)) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          model.scale.x = 1.5
          model.scale.y = 1.5
          model.scale.z = 1.5
          
          model.position.x = xPos
          model.position.z = zPos
          model.position.y = yPos

          model.rotation.y = deg * Math.PI / 180

          scene.add(model)
        })

        
      } catch (error) {
        console.error(`❌ Error loading FBX weapon ${modelName}:`, error);
        toast.error(`Failed to load FBX model for ${modelName}.`);
      
      }
    }

    loadObject('tiles/rooms/Room_MTN_Corner_5.glb', 0, -0.2, 0, 90);
    loadObject('tiles/rooms/Room_MTN_Corner_2.glb', 6, -0.2, 0, -90);
    loadObject('tiles/rooms/Room_MTN_Corner_2.glb', -6, -0.2, 0, 90);
    loadObject('tiles/rooms/Room_MTN_Corner_2.glb', 0, -0.2, 6, 180);
    loadObject('tiles/rooms/Room_MTN_Corner_1.glb', 6, -0.2, 6, 180);
    loadObject('tiles/rooms/Room_MTN_Corner_1.glb', -6, -0.2, 6, 90);
    loadObject('tiles/rooms/Room_MTN_Corner_1.glb', 6, -0.2, -6, -90);
    loadObject('tiles/rooms/Room_MTN_Corner_1.glb', -6, -0.2, -6, 0);
    loadObject('tiles/rooms/Room_MTN_Door_Corner_A_2.glb', 0, -0.2, -6, 0);

    let pointLight = new THREE.PointLight(0xffffff, 7);
    pointLight.position.set(3, 4.5, 3);
    pointLight.castShadow = true;
    pointLight.shadow.camera.near = 0.5;
    pointLight.shadow.camera.far = 20;
    scene.add(pointLight);

    pointLight = new THREE.PointLight(0xffffff, 7);
    pointLight.position.set(-3, 4.5, -3);
    pointLight.castShadow = true;
    pointLight.shadow.camera.near = 0.5;
    pointLight.shadow.camera.far = 20;
    scene.add(pointLight);

    pointLight = new THREE.PointLight(0xffffff, 7);
    pointLight.position.set(-3, 4.5, 3);
    pointLight.castShadow = true;
    pointLight.shadow.camera.near = 0.5;
    pointLight.shadow.camera.far = 20;
    scene.add(pointLight);

    pointLight = new THREE.PointLight(0xffffff, 7);
    pointLight.position.set(3, 4.5, -3);
    pointLight.castShadow = true;
    pointLight.shadow.camera.near = 0.5;
    pointLight.shadow.camera.far = 20;
    scene.add(pointLight);
    
    loadObject('tiles/walls/Wall_MTNDoor_End_2.glb', 0, -0.2, -13.5, 180);
    loadObject('tiles/walls/Wall_MTNDoor_End_2.glb', 0, -0.2, -22.5, 0);
    loadObject('tiles/rooms/Room_2.glb', 0, -0.2, -22.5, 90);
    loadObject('tiles/rooms/Room_2.glb', 0, -0.2, -13.5, 90);

    pointLight = new THREE.PointLight(0xffffff, 8);
    pointLight.position.set(0, 7, -13.5);
    pointLight.castShadow = true;
    pointLight.shadow.camera.near = 0.5;
    pointLight.shadow.camera.far = 20;
    scene.add(pointLight);

    pointLight = new THREE.PointLight(0xffffff, 8);
    pointLight.position.set(0, 7, -22.5);
    pointLight.castShadow = true;
    pointLight.shadow.camera.near = 0.5;
    pointLight.shadow.camera.far = 20;
    scene.add(pointLight);

    const boxGeometry = new THREE.BoxGeometry(3, 3, 3);
    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0x8888aa,
      roughness: 0.6,
      metalness: 0.7,
      envMap: skybox,
      envMapIntensity: 0.8
    });

    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.set(0, 1.5, 0);
    box.castShadow = true;
    box.receiveShadow = true;
    scene.add(box);
    colliders.push(box);

    // const floorGeometry = new THREE.PlaneGeometry(50, 50);
    // const floorMaterial = new THREE.MeshStandardMaterial({
    //   color: 0x555555,
    //   roughness: 0.4,
    //   metalness: 0.6,
    // });
    // const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    // floor.rotation.x = -Math.PI / 2;
    // floor.receiveShadow = true;
    // scene.add(floor);

    // const boxGeometry = new THREE.BoxGeometry(3, 3, 3);
    // const boxMaterial = new THREE.MeshStandardMaterial({
    //   color: 0x8888aa,
    //   roughness: 0.6,
    //   metalness: 0.7,
    //   envMap: skybox,
    //   envMapIntensity: 0.8
    // });

    // const box = new THREE.Mesh(boxGeometry, boxMaterial);
    // box.position.set(0, 1.5, 0);
    // box.castShadow = true;
    // box.receiveShadow = true;
    // scene.add(box);

    setThreeObjects({ scene, camera, renderer, colliders });

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
      if (currentContainer) {
        currentContainer.removeChild(renderer.domElement);
      }

      pmremGenerator.dispose();
      renderer.dispose();

    };
  }, [containerRef]);

  return threeObjects;

};