import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { toast } from "sonner";

// Konfigurasi untuk setiap tipe monster
export interface MonsterConfig {
    modelPath: string;
    scale: THREE.Vector3;
    health: number;
    rotation: THREE.Euler; 
    
    // 🛠️ Properti Patroli Baru
    speed: number;
    patrolRadius: number; // Radius dari posisi spawn
}
export enum MonsterState {
    PATROL = 'PATROL', // Hanya fokus pada state ini dulu
    IDLE = 'IDLE',
    DEAD = 'DEAD',
}

export class Monster {

    public model: THREE.Group | null = null;
    public health: number;
    public config: MonsterConfig;
    private mixer: THREE.AnimationMixer | null = null;
    private scene: THREE.Scene;
    private raycaster = new THREE.Raycaster();
    private colliders: any[] = [];

        // 🛠️ Properti AI/Patroli
    public state: MonsterState = MonsterState.PATROL;
    private initialPosition: THREE.Vector3 = new THREE.Vector3();
    private currentPatrolTarget: THREE.Vector3 = new THREE.Vector3();
    
    private defaultRotationY: number;
    constructor(scene: THREE.Scene, config: MonsterConfig, colliders: any[], rotationY: number = 0) {
        this.scene = scene;
        this.config = config;
        this.health = this.config.health;
        this.colliders = colliders;
        this.defaultRotationY = rotationY;
        // Kita tidak bisa memanggil setNewPatrolTarget di sini karena initialPosition belum diset
     }

     private setNewPatrolTarget() {
        if (!this.model) return;
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * this.config.patrolRadius;
        
        // Buat titik acak di sekitar initialPosition
        this.currentPatrolTarget.set(
            this.initialPosition.x + Math.cos(angle) * radius,
            this.initialPosition.y, // Pertahankan ketinggian awal
            this.initialPosition.z + Math.sin(angle) * radius
        );
        console.log(`Monster set new patrol target at: ${this.currentPatrolTarget.x.toFixed(1)}, ${this.currentPatrolTarget.z.toFixed(1)}`);
    }
    public async load(position: THREE.Vector3) {

        if (this.model) return; // Hindari double load
         // 🛠️ Simpan posisi spawn SEBELUM loading
        this.initialPosition.copy(position); 

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

            if (fbx.animations && fbx.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(fbx);
                const action = this.mixer.clipAction(fbx.animations[0]);
                action.play();
            }

            this.scene.add(this.model);
            this.setNewPatrolTarget();

        } catch (error) {
            console.error(`FATAL ERROR: Gagal memuat model monster FBX:`, error);
            toast.error(`Gagal memuat model untuk monster: ${this.config.modelPath}`);
        }

    }

    public update(deltaTime: number) {
        if (!this.model || this.state === MonsterState.DEAD) return;
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }

        // Logika sederhana: Hanya Patroli
        if (this.state === MonsterState.PATROL) {
            this.handlePatrol(deltaTime);
        }
    }
    // --- Metode Gerakan Patroli ---

    private handlePatrol(deltaTime: number) {
        const targetPoint = this.currentPatrolTarget;
        const distanceToTarget = this.model!.position.distanceTo(this.currentPatrolTarget);
        
        // Cek jika target tercapai atau terlalu jauh dari pusat patroli
        if (distanceToTarget < 0.5 || this.model!.position.distanceTo(this.initialPosition) > this.config.patrolRadius * 1.5) { 
            this.setNewPatrolTarget(); 
        } else {
            this.moveTowards(targetPoint, this.config.speed, deltaTime); 
        }
    }

   private moveTowards(target: THREE.Vector3, speed: number, deltaTime: number) {
    if (!this.model) return;

    // 🛠️ PERBAIKAN: Gunakan operator null-check atau pastikan target valid.
    if (!target || !(target instanceof THREE.Vector3)) {
        console.error("Move target is invalid!", target);
        return; // Hentikan gerakan jika target tidak valid
    }

    const direction = target.clone().sub(this.model.position);
    direction.y = 0; 

    // PERIKSA: Jika panjangnya nol (sudah di target), jangan lakukan normalize
    if (direction.lengthSq() === 0) return; 

    direction.normalize(); // Baris yang mengakses 'length'
    
    // Rotasi
    this.faceTowards(target); 

    // Gerak maju
    this.model.position.addScaledVector(direction, speed * deltaTime);
    
    // Kunci posisi Y
    this.model.position.y = this.initialPosition.y; 
}
    
    private faceTowards(target: THREE.Vector3) {
        if (!this.model) return;
        const direction = target.clone().sub(this.model.position);
        const angle = Math.atan2(direction.x, direction.z);
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