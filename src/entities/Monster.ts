import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { toast } from "sonner";

export interface MonsterConfig {
    modelPath: string;
    scale: THREE.Vector3;
    health: number;
    rotation: THREE.Euler;
    speed: number;
    patrolRadius: number;
}

export enum MonsterState {
    PATROL = 'PATROL',
    DEAD = 'DEAD',
}

export class Monster {
    public model: THREE.Group | null = null;
    public health: number;
    public config: MonsterConfig;
    private mixer: THREE.AnimationMixer | null = null;
    private scene: THREE.Scene;
    private raycaster = new THREE.Raycaster();
    private colliders: any[];

    public state: MonsterState = MonsterState.PATROL;
    private initialPosition: THREE.Vector3 = new THREE.Vector3();
    private currentPatrolTarget: THREE.Vector3 = new THREE.Vector3();

    private avoidDirection: THREE.Vector3 | null = null;
    private stuckTimer: number = 0;

    private defaultRotationY: number;

    constructor(scene: THREE.Scene, config: MonsterConfig, colliders: any[], rotationY: number = 0) {
        this.scene = scene;
        this.config = config;
        this.health = config.health;
        this.colliders = colliders;
        this.defaultRotationY = rotationY;
    }

    // 🧭 Buat target acak di sekitar posisi awal
    private setNewPatrolTarget() {
        if (!this.model) return;
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * this.config.patrolRadius;

        this.currentPatrolTarget.set(
            this.initialPosition.x + Math.cos(angle) * radius,
            this.initialPosition.y,
            this.initialPosition.z + Math.sin(angle) * radius
        );

        console.log(`🎯 New patrol target: (${this.currentPatrolTarget.x.toFixed(1)}, ${this.currentPatrolTarget.z.toFixed(1)})`);
    }

    // 📦 Load model monster
    public async load(position: THREE.Vector3) {
        if (this.model) return;

        const fbxLoader = new FBXLoader();
        try {
            const fbx = await fbxLoader.loadAsync(this.config.modelPath);
            this.model = fbx;

            this.model.position.copy(position);
            this.model.scale.copy(this.config.scale);
            this.model.rotation.copy(this.config.rotation);
            this.model.rotation.y = this.defaultRotationY;

            this.model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // 🔹 Animasi
            if (fbx.animations && fbx.animations.length > 0) {
                const root = fbx.children[0] || fbx;
                this.mixer = new THREE.AnimationMixer(root);
                const action = this.mixer.clipAction(fbx.animations[0]);
                action.play();
                console.log("🎬 Monster animation playing:", fbx.animations[0].name);
            } else {
                console.warn("⚠️ Monster has no animations:", this.config.modelPath);
            }

            this.scene.add(this.model);

            // Set posisi awal & target patrol
            this.initialPosition.copy(this.model.position);
            this.setNewPatrolTarget();

        } catch (error) {
            console.error("❌ Gagal memuat model monster:", error);
            toast.error(`Gagal memuat monster: ${this.config.modelPath}`);
        }
    }

    // 🔄 Update tiap frame
    public update(deltaTime: number) {
        if (!this.model || this.state === MonsterState.DEAD) return;
        if (this.mixer) this.mixer.update(deltaTime);

        if (this.state === MonsterState.PATROL) {
            this.handlePatrol(deltaTime);
        }
    }

    // 🚶‍♂️ Logika patroli
    private handlePatrol(deltaTime: number) {
        if (!this.model) return;

        const distToTarget = this.model.position.distanceTo(this.currentPatrolTarget);
        if (distToTarget < 0.5 || this.currentPatrolTarget.lengthSq() === 0) {
            this.setNewPatrolTarget();
            return;
        }

        this.moveTowards(this.currentPatrolTarget, this.config.speed, deltaTime);
    }

    // 🧠 Gerakan ke target + deteksi tabrakan
private moveTowards(target: THREE.Vector3, speed: number, deltaTime: number) {
    if (!this.model) return;

    const currentPos = this.model.position.clone();
    const dir = target.clone().sub(currentPos);
    dir.y = 0;
    if (dir.lengthSq() === 0) return;
    dir.normalize();

    // Titik asal raycast: sedikit di depan dada monster (bukan di kaki)
    const rayOrigin = currentPos.clone().add(new THREE.Vector3(0, 1.0, 0));
    this.raycaster.set(rayOrigin, dir);
    const hits = this.raycaster.intersectObjects(this.colliders, true);

    const isBlocked = hits.length > 0 && hits[0].distance < 1.0; // jarak aman ±1m
    if (isBlocked) {
        // Monster berhenti dan ganti arah acak
        const angle = (Math.random() - 0.5) * Math.PI; // rotasi acak 180°
        const newDir = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
        this.model.position.addScaledVector(newDir, 0.05); // dorong dikit keluar
        this.setNewPatrolTarget(); // cari target baru
        return;
    }

    // Cek langkah ke depan aman (tidak menembus collider)
    const nextPos = currentPos.clone().addScaledVector(dir, speed * deltaTime);

    // Raycast ke bawah dari posisi depan untuk memastikan masih di permukaan lantai
    const downRay = new THREE.Raycaster(
        nextPos.clone().add(new THREE.Vector3(0, 2, 0)),
        new THREE.Vector3(0, -1, 0)
    );
    const groundHits = downRay.intersectObjects(this.colliders, true);
    if (groundHits.length === 0) {
        // Jika tidak ada tanah, jangan maju
        return;
    }

    // Aman -> maju
    this.model.position.copy(nextPos);
    this.model.position.y = this.initialPosition.y;
    this.faceTowards(target);
}



    private faceTowards(target: THREE.Vector3) {
        if (!this.model) return;
        const dir = target.clone().sub(this.model.position);
        const angle = Math.atan2(dir.x, dir.z);
        this.model.rotation.y = angle + Math.PI / 2;
    }

    public takeDamage(amount: number): boolean {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.dispose();
            return true;
        }
        return false;
    }

    public dispose() {
        if (this.model) {
            this.scene.remove(this.model);
            this.model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach((mat) => mat.dispose());
                    } else if (child.material) {
                        child.material.dispose();
                    }
                }
            });
            this.model = null;
        }
    }
}
