import * as THREE from "three";
import { InputManager } from "./InputManager";

export class PlayerMovement {
    private camera: THREE.PerspectiveCamera;
    private input: InputManager;
    private colliders: THREE.Mesh[];

    // Parameter pergerakan
    private speed = 6;
    private sprintMultiplier = 1.8;
    private airControl = 0.75;
    private gravity = 9.5;
    private jumpForce = 5;

    // Status pergerakan
    private velocity = new THREE.Vector3();
    private isGrounded = true;
    private yaw = 0;
    private pitch = 0;

    // Tabrakan
    private raycaster = new THREE.Raycaster();
    private readonly PLAYER_RADIUS = 0.8; // Jarak aman dari dinding

    // Konstanta
    private readonly PLAYER_HEIGHT = 1.8;
    private readonly MAX_FALL_SPEED = -20;

    constructor(camera: THREE.PerspectiveCamera, inputManager: InputManager, colliders: THREE.Mesh[]) {
        this.camera = camera;
        this.input = inputManager;
        this.colliders = colliders;

        // Atur posisi awal kamera
        this.camera.position.set(0, this.PLAYER_HEIGHT, 5);

        this.raycaster.near = 0;
        this.raycaster.far = this.PLAYER_RADIUS + 0.1;
    }

    public update(delta: number, elapsedTime: number, canSprint: boolean) {
        this.updateCameraRotation();
        this.updatePlayerMovement(delta, canSprint);
        this.updateCameraBob(elapsedTime, canSprint);
    }

    private updateCameraRotation() {

        if (!this.input.isPointerLocked) 
            return;

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

    private updatePlayerMovement(delta: number, canSprint: boolean) {
        const isSprinting = this.input.moveState.sprint && canSprint;
        const currentSpeed = isSprinting
            ? this.speed * this.sprintMultiplier
            : this.speed;

        const direction = new THREE.Vector3();
        const { forward, backward, left, right } = this.input.moveState;

        if (forward) direction.z -= 1;
        if (backward) direction.z += 1;
        if (left) direction.x -= 1;
        if (right) direction.x += 1;

        if (direction.lengthSq() > 0) {
            direction.normalize();
            const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
            direction.applyQuaternion(yawQuat);
            
            if (!this.checkCollision(direction)) {
                const speedMultiplier = this.isGrounded ? 1 : this.airControl;
                const moveAmount = direction.multiplyScalar(currentSpeed * speedMultiplier * delta);
                this.camera.position.add(moveAmount);
            }
        }

        if (this.input.justJumped && this.isGrounded) {
            this.velocity.y = this.jumpForce;
            this.isGrounded = false;
            this.input.justJumped = false;
        }

        if (!this.isGrounded) {
            this.velocity.y -= this.gravity * delta;
            this.velocity.y = Math.max(this.velocity.y, this.MAX_FALL_SPEED);
            this.camera.position.y += this.velocity.y * delta;

            if (this.camera.position.y <= this.PLAYER_HEIGHT && this.velocity.y <= 0) {
                this.camera.position.y = this.PLAYER_HEIGHT;
                this.velocity.y = 0;
                this.isGrounded = true;
            }
        } else {
            this.camera.position.y = this.PLAYER_HEIGHT;
        }
    }

    private checkCollision(direction: THREE.Vector3): boolean {
        if (this.colliders.length === 0) return false;
        const raycastOrigin = this.camera.position.clone();
        raycastOrigin.y -= this.PLAYER_HEIGHT / 2;
        this.raycaster.set(raycastOrigin, direction);
        const intersections = this.raycaster.intersectObjects(this.colliders);
        return intersections.length > 0;
    }

    private updateCameraBob(elapsedTime: number, canSprint: boolean) {
        if (this.isGrounded && this.isMoving()) {
            const isSprinting = this.input.moveState.sprint && canSprint;
            const bobFrequency = isSprinting ? 12 : 8;
            const bobAmount = isSprinting ? 0.05 : 0.03;
            const bobOffset = Math.sin(elapsedTime * bobFrequency) * bobAmount;
            this.camera.position.y = this.PLAYER_HEIGHT + bobOffset;
        }
    }

    public isMoving(): boolean {
        const { forward, backward, left, right } = this.input.moveState;
        return forward || backward || left || right;
    }
    
    public getPosition(): THREE.Vector3 {
        return this.camera.position.clone();
    }

}
