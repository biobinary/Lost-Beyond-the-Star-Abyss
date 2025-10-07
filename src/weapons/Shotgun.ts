// src/weapons/Shotgun.ts
import * as THREE from "three";
import { EffectsManager } from "../systems/EffectsManager";
import { BaseWeapon } from "./BaseWeapon";
import { WeaponConfig } from "./IWeapon";

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
    muzzlePosition: new THREE.Vector3(0, 0.05, -1.0)
};

export class Shotgun extends BaseWeapon {

    private raycaster = new THREE.Raycaster();
    private pelletCount = 8;
    private spreadAngle = 0.35; // dalam radian

    constructor() {
        super(ShotgunConfig, 8); // 8 peluru
    }

    public fire(camera: THREE.Camera, scene: THREE.Scene, effects: EffectsManager): void {
        
        if (!this.canShoot() || !this.model) 
            return;
        
        super.onFire();

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

            // Buat arah yang menyebar secara acak
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
            
                if (belongsToWeapon) 
                    continue;
            
                // PERBAIKAN: Pastikan jarak hit masuk akal
                if (inter.distance < 0.1) 
                    continue; // Skip hits yang terlalu dekat
    
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
                bulletEnd.copy(rayOrigin).add(pelletDirection.multiplyScalar(100));
            }
            
            effects.createBulletTrail(muzzleWorld, bulletEnd);

        }
    }
}