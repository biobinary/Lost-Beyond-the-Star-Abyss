// src/systems/WeaponManager.ts
import * as THREE from 'three';
import { IWeapon } from '../weapons/IWeapon';
import { EffectsManager } from './EffectsManager';
import { InputManager } from './InputManager';

export class WeaponManager {
    
    private currentWeapon: IWeapon | null = null;
    private camera: THREE.Camera;
    private scene: THREE.Scene;
    private effects: EffectsManager;
    private input: InputManager;

    constructor(camera: THREE.Camera, scene: THREE.Scene, effects: EffectsManager, input: InputManager) {
        this.camera = camera;
        this.scene = scene;
        this.effects = effects;
        this.input = input;
    }

    public async equip(weapon: IWeapon) {
        // Unequip dan dispose senjata sebelumnya jika ada
        if (this.currentWeapon) {
            if (this.currentWeapon.model) {
                this.camera.remove(this.currentWeapon.model);
            }
            this.currentWeapon.dispose();
        }
        
        this.currentWeapon = weapon;
        await this.currentWeapon.load(this.camera);
    }

    // Pastikan Anda memiliki clock di game loop utama Anda untuk mendapatkan deltaTime
    public update(elapsedTime: number, deltaTime: number) {
        if (!this.currentWeapon || !this.input.isPointerLocked) return;
        
        // Kirim deltaTime ke update senjata untuk animasi yang mulus
        this.currentWeapon.update(elapsedTime, deltaTime);
        
        if (this.input.isShooting) {
            this.currentWeapon.fire(this.camera as THREE.PerspectiveCamera, this.scene, this.effects);
        }

        // Tambahkan input untuk reload, contoh:
        if (this.input.isReloading) {
            this.currentWeapon.reload();
            this.input.isReloading = false; // Reset state reload setelah dipanggil
        }
    }
}