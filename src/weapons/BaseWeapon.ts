// src/weapons/BaseWeapon.ts
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { toast } from "sonner";
import { IWeapon, WeaponConfig } from "./IWeapon";
import { EffectsManager } from "../systems/EffectsManager";

export abstract class BaseWeapon implements IWeapon {

    public model: THREE.Group | null = null;
    public config: WeaponConfig;
    public ammo: number;
    public maxAmmo: number;

    protected lastShotTime = 0;
    private muzzleLight: THREE.PointLight;
    
    // Untuk animasi recoil
    private isRecoiling = false;
    private recoilTime = 0;
    
    // Posisi & Rotasi Awal Model (diisi dari config jika tersedia)
    private initialPosition: THREE.Vector3;
    private initialRotation = new THREE.Euler(0, 0, 0);

    constructor(config: WeaponConfig, maxAmmo: number) {
        this.config = config;
        this.maxAmmo = maxAmmo;
        this.ammo = maxAmmo;

        // Gun position from config or fallback
        this.initialPosition = config.gunPosition ? config.gunPosition.clone() : new THREE.Vector3(0.4, -0.3, -0.8);

        // Muzzle light, posisi relatif ke model; gunakan config muzzlePosition (z biasanya negatif)
        const muzzlePos = config.muzzlePosition ? config.muzzlePosition.clone() : new THREE.Vector3(0, 0, -5.5);
        this.muzzleLight = new THREE.PointLight(0xffee00, 0, 10);
        this.muzzleLight.position.copy(muzzlePos);
    }

    public async load(camera: THREE.Object3D): Promise<void> {
        
        const loader = new GLTFLoader();
        const textureLoader = new THREE.TextureLoader();
        
        try {
            const [gltf, colorTexture] = await Promise.all([
                loader.loadAsync(this.config.modelPath),
                textureLoader.loadAsync(this.config.texturePath)
            ]);
            
            colorTexture.colorSpace = THREE.SRGBColorSpace;
            colorTexture.flipY = false;
            
            this.model = gltf.scene;
            this.model.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.map = colorTexture;
                    child.material.needsUpdate = true;
                    child.castShadow = true;
                }
            });

            // Set posisi & rotasi awal berdasarkan config
            this.model.position.copy(this.initialPosition);
            this.model.rotation.copy(this.initialRotation);
            this.model.add(this.muzzleLight);

            if(camera == null)
                return;

            camera.add(this.model);

        } catch (error) {
            console.error(`An error happened while loading ${this.config.name}:`, error);
            toast.error(`Failed to load ${this.config.name} model.`);
        
        }

    }

    public update(elapsedTime: number, deltaTime: number): void {
        if (!this.model) return;

        // Weapon Sway
        this.handleSway(elapsedTime);

        // Recoil Animation
        this.handleRecoil(deltaTime);
    }
    
    // Logika fire akan spesifik untuk setiap senjata turunan
    public abstract fire(camera: THREE.Camera, scene: THREE.Scene, effects: EffectsManager): void;

    public reload(): void {
        console.log(`${this.config.name} reloading...`);
        this.ammo = this.maxAmmo;
        // Di sini Anda bisa menambahkan animasi dan timer reload
    }

    protected canShoot(): boolean {
        const now = performance.now();
        if (this.ammo <= 0) {
            // Mungkin bisa memutar suara "empty clip"
            return false;
        }
        return now - this.lastShotTime >= this.config.shootCooldown;
    }

    protected onFire(): void {
        this.lastShotTime = performance.now();
        this.ammo--;
        this.isRecoiling = true;
        this.recoilTime = 0;
        this.animateMuzzleFlash();
    }
    
    private handleSway(elapsedTime: number) {
        if (!this.model) return;
        const swayAmount = this.config.swayAmount;
        const swaySpeed = this.config.swaySpeed;
        this.model.position.y = this.initialPosition.y + Math.sin(elapsedTime * swaySpeed) * swayAmount;
        this.model.position.x = this.initialPosition.x + Math.cos(elapsedTime * swaySpeed * 0.5) * swayAmount;
    }

    private handleRecoil(deltaTime: number) {
        if (!this.model || !this.isRecoiling) return;

        this.recoilTime += deltaTime * 1000; // konversi ke ms
        const recoilProgress = Math.min(this.recoilTime / this.config.recoilDuration, 1.0);

        // Animasi recoil: naik cepat, turun lambat
        if (recoilProgress < 0.5) {
            this.model.rotation.x = this.initialRotation.x - this.config.recoilAmount * (recoilProgress * 2);
        } else {
            this.model.rotation.x = this.initialRotation.x - this.config.recoilAmount * (1 - (recoilProgress - 0.5) * 2);
        }

        if (recoilProgress >= 1.0) {
            this.isRecoiling = false;
            this.recoilTime = 0;
            this.model.rotation.x = this.initialRotation.x;
        }
    }
    
    private animateMuzzleFlash() {
        this.muzzleLight.intensity = 20; // Lebih terang
        setTimeout(() => { this.muzzleLight.intensity = 0; }, 60);
    }

    public dispose(): void {
        if (this.model) {
            this.model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (child.material instanceof THREE.Material) {
                        child.material.dispose();
                    }
                }
            });
        }
    }
}