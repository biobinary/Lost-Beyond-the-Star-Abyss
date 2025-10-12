// src/weapons/Blaster.ts
import * as THREE from "three";
import { EffectsManager } from "../systems/EffectsManager";
import { BaseWeapon } from "./BaseWeapon";
import { WeaponConfig } from "./IWeapon";
import { WeaponManager } from "@/systems/WeaponManager";
import { Monster } from "../entities/Monster"

// Definisikan konfigurasi spesifik untuk Blaster
const BlasterConfig: WeaponConfig = {
    name: "Blaster",
    shootCooldown: 100,
    recoilAmount: 0.05,
    recoilDuration: 80,
    swayAmount: 0.003,
    swaySpeed: 1.5,
    modelPath: '/models/low_poly_guns_fbx/fusil/fusil_3.fbx',
    texturePath: '/models/low_poly_guns_fbx/uv_palette.png',
    gunPosition: new THREE.Vector3(0.4, -0.3, -0.8),
    muzzlePosition: new THREE.Vector3(0, 0.05, -1.0)
};

export class Blaster extends BaseWeapon {
    private raycaster = new THREE.Raycaster();
    private shootSound?: THREE.Audio;
    private reloadSound?: THREE.Audio;
    private emptySound?: THREE.Audio;

    constructor(private listener: THREE.AudioListener) {
        super(BlasterConfig, 30); // 30 peluru per magasin
        this.loadSound();
        this.damage = 20;
    }
    
    private loadSound() {
        const audioLoader = new THREE.AudioLoader();
        this.shootSound = new THREE.Audio(this.listener);
        audioLoader.load('/Audio/sound/heathers-gunshot.mp3', (buffer) => {
            this.shootSound!.setBuffer(buffer);
            this.shootSound!.setVolume(0.4);
            this.shootSound!.setLoop(false);
        });

        this.reloadSound = new THREE.Audio(this.listener);
        audioLoader.load('/Audio/sound/mag-in.mp3', (buffer) => {
            this.reloadSound!.setBuffer(buffer);
            this.reloadSound!.setVolume(0.8);
            this.reloadSound!.setLoop(false);
        });
        
        this.emptySound = new THREE.Audio(this.listener);
        audioLoader.load('/Audio/sound/empty-gun-shot.mp3', (buffer) => {
            this.emptySound!.setBuffer(buffer);
            this.emptySound!.setVolume(0.4);
            this.emptySound!.setLoop(false);
        });
    }

    public fire(camera: THREE.Camera, scene: THREE.Scene, effects: EffectsManager): void {
        if (!this.canShoot()){
            if (this.emptySound && !this.emptySound.isPlaying && this.ammo <= 0) {
                this.emptySound?.play();
            }
            return;
        } else if(!this.model) return;
        
        super.onFire(); // Panggil logika dasar: kurangi amunisi, set cooldown, mulai recoil
        
        if (this.shootSound?.buffer) {
            const clone = new THREE.Audio(this.shootSound.listener);
            clone.setBuffer(this.shootSound.buffer);
            clone.setVolume(this.shootSound.getVolume());
            clone.setLoop(false);
            clone.play();

            // Auto-remove after playback to avoid buildup
            clone.source.onended = () => {
                if (clone.parent) clone.parent.remove(clone);
            };

            // Optionally attach to weapon for spatial sound
            this.model.add(clone);
        }

        // Gunakan muzzlePosition dari config jika tersedia
        const muzzleLocal = this.config.muzzlePosition ? this.config.muzzlePosition.clone() : new THREE.Vector3(0, 0, -0.5);
        const muzzleWorld = this.config.gunPosition.clone().add(muzzleLocal.clone());
        camera.localToWorld(muzzleWorld);

        // PERBAIKAN: Gunakan arah kamera, bukan arah weapon model
        // Karena weapon mengikuti kamera, gunakan camera direction untuk akurasi
        const shootDirection = new THREE.Vector3();
        camera.getWorldDirection(shootDirection);
        shootDirection.normalize();

        // OPSIONAL: Tambahkan sedikit offset untuk raycast origin
        // agar tidak mengenai objek yang terlalu dekat dengan kamera
        const rayOrigin = muzzleWorld.clone();
        
        // Raycast dari muzzle sepanjang arah kamera
        this.raycaster.set(rayOrigin, shootDirection);
        
        // PERBAIKAN: Tambahkan parameter untuk mengabaikan objek yang terlalu dekat
        this.raycaster.far = 1000; // Jarak maksimal raycast
        this.raycaster.near = 0.1; // Jarak minimal (hindari self-intersection)
        
        const intersects = this.raycaster.intersectObjects(scene.children, true);

        let bulletEnd = new THREE.Vector3();
        let hitFound = false;

        for (const inter of intersects) {
            // Lewati hits yang berasal dari model senjata sendiri
            let parent: THREE.Object3D | null = inter.object;
            let belongsToWeapon = false;
            while (parent) {
                if (parent === this.model) { 
                    belongsToWeapon = true; 
                    break; 
                }
                parent = parent.parent;
            }

            if (belongsToWeapon || inter.distance < 0.1) 
                continue;

            const hitEntity = inter.object.userData.entity;

            if (hitEntity && hitEntity instanceof Monster) {
                hitEntity.takeDamage(this.damage);
            }
            
            // Valid hit
            bulletEnd.copy(inter.point);
            
            // Hitung normal dengan benar
            let worldNormal = new THREE.Vector3(0, 1, 0); // default
            if (inter.face) {
                worldNormal = inter.face.normal.clone();
                
                // Transformasi normal ke world space
                const normalMatrix = new THREE.Matrix3().getNormalMatrix(inter.object.matrixWorld);
                worldNormal.applyMatrix3(normalMatrix).normalize();
            }
            
            effects.createImpactEffect(bulletEnd.clone(), worldNormal);
            hitFound = true;
            break;
        }

        if (!hitFound) {
            // PERBAIKAN: Gunakan shootDirection yang sudah benar
            bulletEnd.copy(rayOrigin).add(shootDirection.multiplyScalar(100));
        }

        // Buat bullet trail dari muzzle ke endpoint
        effects.createBulletTrail(muzzleWorld, bulletEnd);
    }

    public reload(weaponManager: WeaponManager) {
        let ammoChange = (this.maxAmmo - this.ammo)

        if (this.reserveAmmo == 0) {
            console.log(`${this.config.name} no reserve ammo to reload!`);
            return;
        } else if (this.reserveAmmo >= ammoChange) {
            this.reserveAmmo -= ammoChange;
            this.ammo += ammoChange;
        } else if (this.reserveAmmo < ammoChange) {
            this.ammo += this.reserveAmmo;
            this.reserveAmmo = 0;
        }

        if (this.reloadSound && this.reloadSound.isPlaying) {
            this.reloadSound.stop();
        }
        this.reloadSound?.play();
        weaponManager.updateHUD();
        
        console.log(`${this.config.name} reloaded. Clip: ${this.ammo}/${this.maxAmmo}, Reserve: ${this.reserveAmmo}`);
    }
}   