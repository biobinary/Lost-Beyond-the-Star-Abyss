import { useEffect, useRef } from "react";
import * as THREE from "three";
import { toast } from "sonner";
// CHANGE 1: Import GLTFLoader
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export const FPSScene = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const playerVelocity = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());
  const lastShotTime = useRef(0);
  const weaponModelRef = useRef<THREE.Group | null>(null);

  const moveState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
  });

  const isPointerLocked = useRef(false);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const isGrounded = useRef(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize renderer first
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace; 
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 20, 100);
    sceneRef.current = scene;

    // Skybox
    const skyboxLoader = new THREE.CubeTextureLoader();
    const skybox = skyboxLoader.load([
      '/skybox/right.png', // Right
      '/skybox/left.png', // Left
      '/skybox/top.png', // Top
      '/skybox/bottom.png', // Bottom
      '/skybox/front.png', // Front
      '/skybox/back.png'  // Back
    ]);
    scene.background = skybox;

    // Camera with better FOV
    const camera = new THREE.PerspectiveCamera(
      90, // Wider FOV for better visibility
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.8, 5);
    cameraRef.current = camera;
    scene.add(camera); // Add camera to the scene here

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

    // Improved floor
    const floorGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
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

    // Enhanced grid
    const gridHelper = new THREE.GridHelper(100, 100, 0x00ffff, 0xff00ff);
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Pointer lock
    const onPointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === renderer.domElement;
      if (isPointerLocked.current) {
        toast.success("Controls Active", {
          description: "WASD to move, Space to jump, Shift to sprint",
        });
      }
    };

    // Movement constants
    const moveSpeed = 12;
    const sprintMultiplier = 1.8;
    const airControl = 0.3;
    const gravity = 9.5;
    const jumpForce = 5;

    renderer.domElement.addEventListener("click", () => {
      renderer.domElement.requestPointerLock();
    });

    document.addEventListener("pointerlockchange", onPointerLockChange);

    // Mouse movement
    const onMouseMove = (event: MouseEvent) => {
      if (!isPointerLocked.current) return;

      const sensitivity = 0.002;
      yaw.current -= event.movementX * sensitivity;
      pitch.current -= event.movementY * sensitivity;
      pitch.current = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch.current));
    };

    document.addEventListener("mousemove", onMouseMove);

    // Keyboard controls
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW": moveState.current.forward = true; break;
        case "KeyS": moveState.current.backward = true; break;
        case "KeyA": moveState.current.left = true; break;
        case "KeyD": moveState.current.right = true; break;
        case "Space":
          if (isGrounded.current) {
            moveState.current.jump = true;
            playerVelocity.current.y = jumpForce;
            isGrounded.current = false;
          }
          break;
        case "ShiftLeft": moveState.current.sprint = true; break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW": moveState.current.forward = false; break;
        case "KeyS": moveState.current.backward = false; break;
        case "KeyA": moveState.current.left = false; break;
        case "KeyD": moveState.current.right = false; break;
        case "ShiftLeft": moveState.current.sprint = false; break;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);

    // CHANGE 3: Load the GLB model instead of creating a box
    const muzzleLight = new THREE.PointLight(0x00ffff, 0, 5);
    muzzleLight.position.set(0, 0, -0.5); // Adjust this based on your model's muzzle position

    const textureLoader = new THREE.TextureLoader();
    const colorTexture = textureLoader.load('/models/kenney_blaster-kit_2.1/Models/GLB format/Textures/colormap.png');

    colorTexture.colorSpace = THREE.SRGBColorSpace;
    colorTexture.flipY = false; // GLTF textures tidak perlu di-flip

    const loader = new GLTFLoader();
    loader.load(
      '/models/kenney_blaster-kit_2.1/Models/GLB format/blaster-j.glb', // IMPORTANT: Change this path to your model
      (gltf) => {
        const model = gltf.scene;
        weaponModelRef.current = model;

        model.traverse((child) => {
          // Cek apakah objek anak adalah sebuah Mesh
          if (child instanceof THREE.Mesh) {
            // Pastikan materialnya adalah MeshStandardMaterial untuk PBR
            if (child.material instanceof THREE.MeshStandardMaterial) {
              console.log("Applying textures to:", child.name);
              child.material.map = colorTexture;
              child.material.needsUpdate = true; 
            }
          }
        });


        // --- Adjust model properties ---
        model.scale.set(1.0, 1.0, 1.0); // Adjust scale to fit the view
        model.position.set(0.4, -0.3, -0.8); // Adjust position

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
          }
        });
        
        model.add(muzzleLight);
        camera.add(model);

      },
      undefined, // We can add a progress callback here if needed
      (error) => {
        console.error('An error happened while loading the weapon model:', error);
        toast.error("Failed to load weapon model.");
      }
    );

    // Animation loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.1); // Cap delta time

      // Camera rotation
      if (camera) {
        camera.rotation.order = "YXZ";
        camera.rotation.y = yaw.current;
        camera.rotation.x = pitch.current;
      }

      // Enhanced movement
      const currentSpeed = moveState.current.sprint ?
        moveSpeed * sprintMultiplier : moveSpeed;
      const direction = new THREE.Vector3();

      if (moveState.current.forward) direction.z -= 1;
      if (moveState.current.backward) direction.z += 1;
      if (moveState.current.left) direction.x -= 1;
      if (moveState.current.right) direction.x += 1;

      if (direction.length() > 0) {
        direction.normalize();
        direction.applyQuaternion(camera.quaternion);
        direction.y = 0; // Keep movement on the XZ plane

        const speedMultiplier = isGrounded.current ? 1 : airControl;
        camera.position.add(
          direction.multiplyScalar(currentSpeed * speedMultiplier * delta)
        );
      }

      // Enhanced gravity and jumping
      if (!isGrounded.current) {
        playerVelocity.current.y -= gravity * delta;
        camera.position.y += playerVelocity.current.y * delta;

        if (camera.position.y <= 1.8) {
          camera.position.y = 1.8;
          playerVelocity.current.y = 0;
          isGrounded.current = true;
        }
      }

      // Add slight camera bob when walking
      if (isGrounded.current && direction.length() > 0) {
        const bobFrequency = moveState.current.sprint ? 12 : 8;
        const bobAmount = moveState.current.sprint ? 0.15 : 0.1;
        camera.position.y += Math.sin(clock.elapsedTime * bobFrequency) * bobAmount * delta;
      }

      // Add subtle weapon sway
      // CHANGE 4: Apply sway to the loaded model
      if (weaponModelRef.current) {
        const weaponModel = weaponModelRef.current;
        const swayAmount = 0.003;
        const swaySpeed = 1.5;
        weaponModel.position.y = -0.3 + Math.sin(clock.elapsedTime * swaySpeed) * swayAmount;
        weaponModel.position.x = 0.4 + Math.cos(clock.elapsedTime * swaySpeed * 0.5) * swayAmount;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Shooting mechanics
    const createBulletTrail = (start: THREE.Vector3, end: THREE.Vector3) => {
      const material = new THREE.LineBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8,
      });
      const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
      const line = new THREE.Line(geometry, material);
      scene.add(line);

      setTimeout(() => {
        scene.remove(line);
        geometry.dispose();
        material.dispose();
      }, 100);
    };

    const createImpactEffect = (position: THREE.Vector3, normal: THREE.Vector3) => {
      const geometry = new THREE.CircleGeometry(0.1, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      });

      const impact = new THREE.Mesh(geometry, material);
      impact.position.copy(position);
      impact.lookAt(position.clone().add(normal));
      scene.add(impact);

      let opacity = 0.8;
      const fadeOut = setInterval(() => {
        opacity -= 0.1;
        material.opacity = opacity;
        if (opacity <= 0) {
          clearInterval(fadeOut);
          scene.remove(impact);
          geometry.dispose();
          material.dispose();
        }
      }, 50);
    };

    const shoot = () => {
      if (!isPointerLocked.current) return;
      
      // CHANGE 5: Check if the weapon model is loaded before shooting
      const weaponModel = weaponModelRef.current;
      if (!weaponModel) return;

      const now = performance.now();
      const shootCooldown = 100;
      if (now - lastShotTime.current < shootCooldown) return;
      lastShotTime.current = now;

      // Add recoil animation
      weaponModel.rotation.x = 0.1;
      setTimeout(() => {
        weaponModel.rotation.x = 0;
      }, 50);

      muzzleLight.intensity = 5;
      setTimeout(() => {
        muzzleLight.intensity = 0;
      }, 50);

      const camera = cameraRef.current;
      if (!camera) return;
      
      // Get world position of the muzzle
      const muzzlePosition = new THREE.Vector3();
      weaponModel.getWorldPosition(muzzlePosition); // Get the gun's position
      // This is a simplification; for better accuracy, you might add an empty Object3D 
      // to your model in Blender to mark the muzzle tip and get its world position.
      // For now, we'll start the ray from the gun's origin.

      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(camera.quaternion);

      raycaster.current.set(
        camera.position, // Start ray from camera for better aiming accuracy
        direction.normalize()
      );

      const intersects = raycaster.current.intersectObjects(
        scene.children.filter(obj => obj !== gridHelper),
        true
      );

      const shootRange = 100;
      // Start the bullet trail from the muzzle
      const bulletStart = muzzlePosition.clone();
      let bulletEnd;

      if (intersects.length > 0) {
        bulletEnd = intersects[0].point;

        const hitPoint = intersects[0].point.clone();
        const normal = intersects[0].face?.normal || new THREE.Vector3();
        hitPoint.addScaledVector(normal, 0.001);

        createImpactEffect(hitPoint, normal);
      } else {
        bulletEnd = camera.position.clone().add(
          direction.multiplyScalar(shootRange)
        );
      }

      createBulletTrail(bulletStart, bulletEnd);
    };

    const onMouseDown = (event: MouseEvent) => {
      if (event.button === 0) {
        shoot();
      }
    };

    document.addEventListener("mousedown", onMouseDown);

    // Cleanup
    return () => {
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      // CHANGE 6: Clean up is simpler now
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="fixed inset-0" />;
};