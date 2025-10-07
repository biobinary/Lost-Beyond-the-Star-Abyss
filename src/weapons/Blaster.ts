// src/weapons/Blaster.ts
import * as THREE from "three";
import { EffectsManager } from "../systems/EffectsManager";
import { BaseWeapon } from "./BaseWeapon";
import { WeaponConfig } from "./IWeapon";

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

    constructor() {
        super(BlasterConfig, 30); // 30 peluru per magasin
    }

    public fire(camera: THREE.Camera, scene: THREE.Scene, effects: EffectsManager): void {
        if (!this.canShoot() || !this.model) return;
        
        super.onFire(); // Panggil logika dasar: kurangi amunisi, set cooldown, mulai recoil

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
            // PERBAIKAN: Gunakan shootDirection yang sudah benar
            bulletEnd.copy(rayOrigin).add(shootDirection.multiplyScalar(100));
        }

        // Buat bullet trail dari muzzle ke endpoint
        effects.createBulletTrail(muzzleWorld, bulletEnd);
    }
}   