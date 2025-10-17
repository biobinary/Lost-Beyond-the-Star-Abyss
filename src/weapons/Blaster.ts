// src/weapons/Blaster.ts
import * as THREE from "three";
import { EffectsManager } from "../systems/EffectsManager";
import { BaseWeapon } from "./BaseWeapon";
import { WeaponConfig } from "./IWeapon";
import { WeaponManager } from "@/systems/WeaponManager";
import { Monster } from "../entities/Monster"
import { AssetManager } from "@/systems/AssetManager";

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

    constructor(private listener: THREE.AudioListener, assetManager: AssetManager) {
        super(BlasterConfig, 30, assetManager); // 30 peluru per magasin
        this.loadSound();
        this.damage = 20;
    }
    
    private loadSound() {

        this.shootSound = new THREE.Audio(this.listener);
        const shootAudioBuffer = this.assetManager.get<AudioBuffer>('/Audio/sound/heathers-gunshot.mp3');
        this.shootSound.setBuffer(shootAudioBuffer);
        this.shootSound.setVolume(0.4);
        this.shootSound.setLoop(false);

        this.reloadSound = new THREE.Audio(this.listener);
        const reloadSound = this.assetManager.get<AudioBuffer>('/Audio/sound/mag-in.mp3');
        this.reloadSound.setBuffer(reloadSound);
        this.reloadSound.setVolume(0.8);
        this.reloadSound.setLoop(false);
        
        this.emptySound = new THREE.Audio(this.listener);
        const emptySound = this.assetManager.get<AudioBuffer>('/Audio/sound/empty-gun-shot.mp3');
        this.emptySound.setBuffer(emptySound);
        this.emptySound.setVolume(0.4);
        this.emptySound.setLoop(false);
        
    }

    public fire(camera: THREE.Camera, scene: THREE.Scene, effects: EffectsManager): void {
        if (!this.canShoot()){
            if (this.emptySound && !this.emptySound.isPlaying && this.ammo <= 0) {
                this.emptySound?.play();
            }
            return;
        } else if(!this.model) return;
        
        super.onFire();
        
        if (this.shootSound?.buffer) {
            // Reuse a single audio node to avoid per-shot allocations
            if (this.shootSound.isPlaying) this.shootSound.stop();
            this.shootSound.setLoop(false);
            this.shootSound.play();
        }
    
        const muzzleLocal = this.config.muzzlePosition ? this.config.muzzlePosition.clone() : new THREE.Vector3(0, 0, -0.5);
        const muzzleWorld = this.config.gunPosition.clone().add(muzzleLocal.clone());
        camera.localToWorld(muzzleWorld);
    
        const shootDirection = new THREE.Vector3();
        camera.getWorldDirection(shootDirection);
        shootDirection.normalize();
    
        const rayOrigin = muzzleWorld.clone();
        
        this.raycaster.set(rayOrigin, shootDirection);
        this.raycaster.far = 1000;
        this.raycaster.near = 0.1;
        
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
            
            // Enhanced impact with blue color for blaster
            effects.createImpactEffect(bulletEnd.clone(), worldNormal, 0x00aaff);
            hitFound = true;
            break;
        }
    
        if (!hitFound) {
            bulletEnd.copy(rayOrigin).add(shootDirection.multiplyScalar(100));
        }
    
        // Enhanced bullet trail with blue color
        effects.createBulletTrail(muzzleWorld, bulletEnd, 0x00ffff);
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