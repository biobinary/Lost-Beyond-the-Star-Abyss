// src/weapons/Shotgun.ts
import * as THREE from "three";
import { EffectsManager } from "../systems/EffectsManager";
import { BaseWeapon } from "./BaseWeapon";
import { WeaponConfig } from "./IWeapon";
import { WeaponManager } from "@/systems/WeaponManager";
import { Monster } from "../entities/Monster";
import { AssetManager } from "@/systems/AssetManager";

const ShotgunConfig: WeaponConfig = {
    name: "Shotgun",
    shootCooldown: 800,
    recoilAmount: 0.25,
    recoilDuration: 300,
    swayAmount: 0.002,
    swaySpeed: 1.0,
    modelPath: '/models/low_poly_guns_fbx/shotguns/shotgun_1.fbx', // Ganti dengan model shotgun
    texturePath: '/models/low_poly_guns_fbx/uv_palette.png',
    gunPosition: new THREE.Vector3(0.5, -0.4, -0.7),
    muzzlePosition: new THREE.Vector3(0, 0.225, -1.1)
};

export class Shotgun extends BaseWeapon {

    private raycaster = new THREE.Raycaster();
    private pelletCount = 8;
    private spreadAngle = 0.35; // dalam radian
    private shootSound?: THREE.Audio;
    private reloadSound?: THREE.Audio;
    private emptySound?: THREE.Audio;
    
    private loadSound() {
        
        this.shootSound = new THREE.Audio(this.listener);
        const shootAudioBuffer = this.assetManager.get<AudioBuffer>('/Audio/sound/shotgun-firing-3.mp3');
        this.shootSound.setBuffer(shootAudioBuffer);
        this.shootSound.setVolume(0.4);
        this.shootSound.setLoop(false);
        
        this.reloadSound = new THREE.Audio(this.listener);
        const reloadAudioBuffer = this.assetManager.get<AudioBuffer>('/Audio/sound/gun-reload-2.mp3');
        this.reloadSound.setBuffer(reloadAudioBuffer);
        this.reloadSound.setVolume(0.6);
        this.reloadSound.setLoop(false);
                
        this.emptySound = new THREE.Audio(this.listener);
        const emptyAudioBuffer = this.assetManager.get<AudioBuffer>('/Audio/sound/empty-gun-shot.mp3');
        this.emptySound.setBuffer(emptyAudioBuffer);
        this.emptySound.setVolume(0.4);
        this.emptySound.setLoop(false);

    }

    constructor(private listener: THREE.AudioListener, assetManager: AssetManager) {
        super(ShotgunConfig, 8, assetManager); // 8 peluru
        this.loadSound();
        this.damage = 5;
    }

    public fire(camera: THREE.Camera, scene: THREE.Scene, effects: EffectsManager): void {

        if (!this.canShoot()){
            if (this.emptySound && !this.emptySound.isPlaying && this.ammo <= 0) {
                this.emptySound?.play();
            }
            return;
        } else if(!this.model) return;
    
        super.onFire();
    
        if (this.shootSound && this.shootSound.isPlaying) {
            this.shootSound.stop();
        }
        this.shootSound?.play();
        
        const muzzleLocal = this.config.muzzlePosition ? this.config.muzzlePosition.clone() : new THREE.Vector3(0, 0, -0.5);
        const muzzleWorld = this.config.gunPosition.clone().add(muzzleLocal.clone());
        camera.localToWorld(muzzleWorld);
    
        const baseDirection = new THREE.Vector3();
        camera.getWorldDirection(baseDirection);
        baseDirection.normalize();
    
        const rayOrigin = muzzleWorld.clone();
    
        this.raycaster.near = 0.1;
        this.raycaster.far = 1000;
    
        for (let i = 0; i < this.pelletCount; i++) {
            const spread = new THREE.Vector3(
                (Math.random() - 0.5) * this.spreadAngle,
                (Math.random() - 0.5) * this.spreadAngle,
                (Math.random() - 0.5) * this.spreadAngle
            );
            
            const pelletDirection = baseDirection.clone().add(spread).normalize();
    
            this.raycaster.set(rayOrigin, pelletDirection);
            const intersects = this.raycaster.intersectObjects(scene.children, true);
    
            let bulletEnd = new THREE.Vector3();
            let hitFound = false;
            
            for (const inter of intersects) {
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
            
                bulletEnd.copy(inter.point);
                
                let worldNormal = new THREE.Vector3(0, 1, 0);
                if (inter.face) {
                    worldNormal = inter.face.normal.clone();
                    const normalMatrix = new THREE.Matrix3().getNormalMatrix(inter.object.matrixWorld);
                    worldNormal.applyMatrix3(normalMatrix).normalize();
                }
                        
                // Enhanced impact with orange color for shotgun
                effects.createImpactEffect(bulletEnd.clone(), worldNormal, 0xff5500);
                hitFound = true;
                break;
            }
            
            if (!hitFound) {
                bulletEnd.copy(rayOrigin).add(pelletDirection.multiplyScalar(100));
            }
            
            // Enhanced bullet trail with orange color for shotgun pellets
            effects.createBulletTrail(muzzleWorld, bulletEnd, 0xffaa00);
        }

    }
    
    public async reload(weaponManager: WeaponManager) {
        
        const reloadDelayPerShell = 800;

        if (this.reserveAmmo == 0) {
            console.log(`${this.config.name} no reserve ammo to reload!`);
            return;
        }

        while (this.ammo < this.maxAmmo && this.reserveAmmo > 0) {
            this.ammo++;
            this.reserveAmmo--;
            // Reuse the pre-created audio node to avoid per-shell allocations
            if (this.reloadSound && this.reloadSound.isPlaying) {
                this.reloadSound.stop();
            }
            this.reloadSound?.play();
            await this.wait(reloadDelayPerShell);
            weaponManager.updateHUD();
        }
        
        console.log(`${this.config.name} reloaded. Clip: ${this.ammo}/${this.maxAmmo}, Reserve: ${this.reserveAmmo}`);

    }
    
    private wait(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private playClone(sound?: THREE.Audio) {
        // Deprecated for reload to reduce GC churn; kept for potential future overlapping SFX needs
        if (!sound?.buffer) return;
        if (sound.isPlaying) sound.stop();
        sound.play();
    }
}