// src/weapons/IWeapon.ts
import * as THREE from "three";
import { EffectsManager } from "../systems/EffectsManager";
import { WeaponManager } from "../systems/WeaponManager";
import { AssetManager } from "../systems/AssetManager";

// Definisikan konfigurasi umum untuk semua senjata
export interface WeaponConfig {
    name: string;
    shootCooldown: number; // in ms
    recoilAmount: number;
    recoilDuration: number; // in ms
    swayAmount: number;
    swaySpeed: number;
    modelPath: string;
    texturePath: string;

    // Posisi default model relatif ke camera (gun hold position)
    gunPosition?: THREE.Vector3;

    // Posisi muzzle relatif ke origin model (digunakan untuk raycast dan muzzle effects)
    muzzlePosition?: THREE.Vector3;
}

export interface IWeapon {
    model: THREE.Group | null;
    config: WeaponConfig;
    ammo: number;
    maxAmmo: number;
    reserveAmmo: number;  // Tambahan: Ammo cadangan untuk reload
    assetManager: AssetManager;

    load(camera?: THREE.Object3D): void;
    update(elapsedTime: number, deltaTime: number): void;
    fire(camera: THREE.Camera, scene: THREE.Scene, effects: EffectsManager): void;
    reload(weaponManager: WeaponManager): void;
    dispose(): void;
}