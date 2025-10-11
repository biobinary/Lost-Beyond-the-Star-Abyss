import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { toast } from "sonner";

// Konfigurasi untuk setiap tipe monster
export interface MonsterConfig {
    modelPath: string;
    scale: THREE.Vector3;
    health: number;
    rotation: THREE.Euler;
}

export class Monster {

    public model: THREE.Group | null = null;
    public health: number;
    public config: MonsterConfig;
    private mixer: THREE.AnimationMixer | null = null;
    private scene: THREE.Scene;

    constructor(scene: THREE.Scene, config: MonsterConfig) {
        this.scene = scene;
        this.config = config;
        this.health = this.config.health;
    }

    public async load(position: THREE.Vector3) {

        if (this.model) return; // Hindari double load

        const fbxLoader = new FBXLoader();
        try {

            const fbx = await fbxLoader.loadAsync(this.config.modelPath);
            this.model = fbx;

            this.model.position.copy(position);
            this.model.scale.copy(this.config.scale);
            this.model.rotation.copy(this.config.rotation);
            
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

        } catch (error) {
            console.error(`FATAL ERROR: Gagal memuat model monster FBX:`, error);
            toast.error(`Gagal memuat model untuk monster: ${this.config.modelPath}`);
        }

    }

    public update(deltaTime: number) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
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