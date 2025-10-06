// src/hooks/useThreeSetup.ts
import { useEffect, useState } from "react";
import * as THREE from "three";

export const useThreeSetup = (containerRef: React.RefObject<HTMLDivElement>) => {
  const [threeObjects, setThreeObjects] = useState<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    containerRef.current.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 20, 100);

    // Skybox
    const skyboxLoader = new THREE.CubeTextureLoader();
    const skybox = skyboxLoader.load([
      '/skybox/right.png', '/skybox/left.png', '/skybox/top.png',
      '/skybox/bottom.png', '/skybox/front.png', '/skybox/back.png'
    ]);
    scene.background = skybox;

    // Camera
    const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.8, 5);
    scene.add(camera);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x4444ff, 0.6);
    scene.add(ambientLight);
    const pointLight1 = new THREE.PointLight(0x00ffff, 1.5, 30);
    pointLight1.position.set(5, 5, 5);
    pointLight1.castShadow = true;
    scene.add(pointLight1);
    const pointLight2 = new THREE.PointLight(0xff00ff, 1.5, 30);
    pointLight2.position.set(-5, 5, -5);
    pointLight2.castShadow = true;
    scene.add(pointLight2);

    // Floor & Grid
    const floorGeometry = new THREE.PlaneGeometry(50, 50, 150, 150);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a4e,
      roughness: 0.7,
      metalness: 0.3,
      envMap: skybox,
      envMapIntensity: 0.5
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const boxGeometry = new THREE.BoxGeometry(5, 5);
    const boxMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.7,
      envMap: skybox,
      envMapIntensity: 0.5
    });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.rotation.x = -Math.PI / 2;
    box.receiveShadow = true;
    scene.add(box);

    // const gridHelper = new THREE.GridHelper(100, 100, 0x00ffff, 0xff00ff);
    // gridHelper.material.opacity = 0.3;
    // gridHelper.material.transparent = true;
    // scene.add(gridHelper);

    setThreeObjects({ scene, camera, renderer });

    // Handle Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [containerRef]);

  return threeObjects;
};