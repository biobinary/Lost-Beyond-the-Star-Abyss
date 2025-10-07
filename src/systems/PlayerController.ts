// src/systems/PlayerController.ts
import * as THREE from "three";
import { InputManager } from "./InputManager";

export class PlayerController {
  private camera: THREE.PerspectiveCamera;
  private input: InputManager;
  private colliders: THREE.Mesh[];

  // Movement parameters
  private speed = 10;
  private sprintMultiplier = 1.8;
  private airControl = 0.75;
  private gravity = 9.5;
  private jumpForce = 5;

  private velocity = new THREE.Vector3();
  private isGrounded = true;
  private yaw = 0;
  private pitch = 0;

  private playerBox = new THREE.Box3();

  // Constants
  private readonly PLAYER_HEIGHT = 1.8;
  private readonly GROUND_OFFSET = 0.01;
  private readonly MAX_FALL_SPEED = -20;

  constructor(camera: THREE.PerspectiveCamera, inputManager: InputManager, colliders: THREE.Mesh[]) {
    this.camera = camera;
    this.input = inputManager;
    this.colliders = colliders;
    
    // Set initial camera position
    this.camera.position.set(0, this.PLAYER_HEIGHT, 5);
  }

  /** Dipanggil setiap frame */
  public update(delta: number, elapsedTime: number) {
    this.updateCameraRotation();
    this.updateMovement(delta);
    this.updateCameraBob(elapsedTime);
  }

  /** Rotasi kamera berdasarkan input mouse */
  private updateCameraRotation() {
    if (!this.input.isPointerLocked) return;

    const sensitivity = 0.002;
    this.yaw -= this.input.mouse.dx * sensitivity;
    this.pitch -= this.input.mouse.dy * sensitivity;

    // Batasi rotasi vertikal agar tidak terbalik
    this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));

    // Gunakan urutan rotasi YXZ agar pergerakan terasa alami
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // Reset delta mouse agar tidak terakumulasi
    this.input.clearMouseMovement();
  }

  /** Pergerakan horizontal, lompatan, dan gravitasi */
  private updateMovement(delta: number) {
    const currentSpeed = this.input.moveState.sprint
      ? this.speed * this.sprintMultiplier
      : this.speed;

    const direction = new THREE.Vector3();
    const { forward, backward, left, right } = this.input.moveState;

    // Tentukan arah pergerakan relatif terhadap input
    if (forward) direction.z -= 1;
    if (backward) direction.z += 1;
    if (left) direction.x -= 1;
    if (right) direction.x += 1;

    // Jika ada input pergerakan (horizontal movement)
    if (direction.lengthSq() > 0) {
      direction.normalize();

      // Gunakan hanya rotasi yaw agar gerak tetap di bidang XZ
      const yawQuat = new THREE.Quaternion();
      yawQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      direction.applyQuaternion(yawQuat);

      // Apply air control multiplier when in air
      const speedMultiplier = this.isGrounded ? 1 : this.airControl;
      const moveAmount = direction.multiplyScalar(currentSpeed * speedMultiplier * delta);
      
      this.checkCollisionsAndMove('x', moveAmount.x);
      this.checkCollisionsAndMove('z', moveAmount.z);

      // // Move camera horizontally
      // const horizontalMovement = direction.multiplyScalar(currentSpeed * speedMultiplier * delta);
      // this.camera.position.x += horizontalMovement.x;
      // this.camera.position.z += horizontalMovement.z;
    }

    // Handle jump input
    if (this.input.justJumped && this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      this.input.justJumped = false; // Reset immediately after consuming
    }

    // Apply gravity when not grounded
    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * delta;
      
      // Clamp fall speed
      if (this.velocity.y < this.MAX_FALL_SPEED) {
        this.velocity.y = this.MAX_FALL_SPEED;
      }
      
      // Apply vertical velocity to camera
      this.camera.position.y += this.velocity.y * delta;
      
      // Ground check - only when moving downward
      if (this.camera.position.y <= this.PLAYER_HEIGHT && this.velocity.y <= 0) {
        this.camera.position.y = this.PLAYER_HEIGHT;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    } else {
      // Make sure we stay at ground level when grounded
      this.camera.position.y = this.PLAYER_HEIGHT;
    }
  }

    private checkCollisionsAndMove(axis: 'x' | 'y' | 'z', moveAmount: number) {
    if (moveAmount === 0) return;

    // Simpan posisi asli
    const originalPosition = this.camera.position[axis];

    // Pindahkan pemain ke posisi potensial baru
    this.camera.position[axis] += moveAmount;
    
    // Perbarui bounding box pemain
    // Kita buat sedikit lebih kecil dari tinggi pemain agar tidak mudah tersangkut
    this.playerBox.setFromCenterAndSize(
        this.camera.position, 
        new THREE.Vector3(0.5, this.PLAYER_HEIGHT, 0.5)
    );

    let collisionDetected = false;
    for (const collider of this.colliders) {
        const colliderBox = new THREE.Box3().setFromObject(collider);
        if (this.playerBox.intersectsBox(colliderBox)) {
            collisionDetected = true;
            break; // Keluar dari loop jika sudah terdeteksi tabrakan
        }
    }

    if (collisionDetected) {
        // Jika terjadi tabrakan, kembalikan pemain ke posisi asli
        this.camera.position[axis] = originalPosition;
    }
  }

  /** Efek kamera bobbing saat berjalan */
  private updateCameraBob(elapsedTime: number) {
    const isMoving =
      this.input.moveState.forward ||
      this.input.moveState.backward ||
      this.input.moveState.left ||
      this.input.moveState.right;

    if (this.isGrounded && isMoving) {
      const bobFrequency = this.input.moveState.sprint ? 12 : 8;
      const bobAmount = this.input.moveState.sprint ? 0.05 : 0.03;
      const bobOffset = Math.sin(elapsedTime * bobFrequency) * bobAmount;
      
      // Add bob offset to the base height
      this.camera.position.y = this.PLAYER_HEIGHT + bobOffset;
    }
    // When not moving or in air, position is already set in updateMovement
  }

  public getPosition(): THREE.Vector3 {
    return this.camera.position.clone();
  }

}