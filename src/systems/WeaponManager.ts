// src/systems/WeaponManager.ts
import * as THREE from 'three';
import { IWeapon } from '../weapons/IWeapon';
import { EffectsManager } from './EffectsManager';
import { InputManager } from './InputManager';

export class WeaponManager {
    
    private inventory: IWeapon[] = [];
    private currentWeaponIndex: number = -1;
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

    public async addWeapon(weapon: IWeapon) {

        // Cek duplikat berdasarkan config.name
        const existingIndex = this.inventory.findIndex(w => w.config.name === weapon.config.name);
        
        if (existingIndex >= 0) {
            const existing = this.inventory[existingIndex];
            existing.reserveAmmo += weapon.maxAmmo;
            console.log(`Added ammo to existing ${weapon.config.name}! Reserve now: ${existing.reserveAmmo}`);
            this.updateHUD();
            return;
        }

        // Bukan duplikat: Tambah ke inventory
        if (this.currentWeaponIndex >= 0 && this.inventory[this.currentWeaponIndex]) {
            const current = this.inventory[this.currentWeaponIndex];
            if (current.model) {
                this.camera.remove(current.model);
            }
        }

        this.inventory.push(weapon);
        this.currentWeaponIndex = this.inventory.length - 1;

        await this.inventory[this.currentWeaponIndex].load(this.camera);
        console.log(`Added new ${weapon.config.name} to inventory!`);
        this.updateHUD();

    }

    public async switchToWeapon(index: number) {
        
        if (index < 0 || index >= this.inventory.length || index === this.currentWeaponIndex) {
            return;
        }

        if (this.currentWeaponIndex >= 0 && this.inventory[this.currentWeaponIndex]) {
            const current = this.inventory[this.currentWeaponIndex];
            if (current.model) {
                this.camera.remove(current.model);
            }
        }

        this.currentWeaponIndex = index;
        await this.inventory[this.currentWeaponIndex].load(this.camera);
        this.updateHUD(); // Update HUD setelah switch senjata
    
    }

    public update(elapsedTime: number, deltaTime: number) {

        const currentWeapon = this.getCurrentWeapon();
        if (!currentWeapon || !this.input.isPointerLocked) return;

        // Update animasi senjata current
        currentWeapon.update(elapsedTime, deltaTime);

        // Shooting
        if (this.input.isShooting) {
            
            const previousAmmo = currentWeapon.ammo;
            currentWeapon.fire(this.camera as THREE.PerspectiveCamera, this.scene, this.effects);
            
            if (currentWeapon.ammo !== previousAmmo) {
                this.updateHUD();
            }

        }

        // Reload
        if (this.input.isReloading) {
            currentWeapon.reload();
            this.input.isReloading = false;
            this.updateHUD(); // Update HUD setelah reload
        }

        // Switch senjata via wheel (one-time trigger)
        if (this.input.scrollDirection !== 0) {
            const direction = this.input.scrollDirection;
            let newIndex = this.currentWeaponIndex + direction;

            // Wrap around (cyclic switch)
            if (newIndex < 0) newIndex = this.inventory.length - 1;
            if (newIndex >= this.inventory.length) newIndex = 0;

            this.switchToWeapon(newIndex);
            this.input.scrollDirection = 0;  // Reset
        }

    }

    private updateHUD() {
        
        const currentWeapon = this.getCurrentWeapon();
        
        if (currentWeapon) {
            const weaponInfo = {
                name: currentWeapon.config.name,
                ammo: currentWeapon.ammo,
                maxAmmo: currentWeapon.maxAmmo,
                reserveAmmo: currentWeapon.reserveAmmo,
                weaponIndex: this.currentWeaponIndex,
                totalWeapons: this.inventory.length
            };

            // Dispatch custom event untuk HUD
            window.dispatchEvent(new CustomEvent('weaponUpdate', { detail: weaponInfo }));
        }

    }

    // Helper: Get senjata current
    private getCurrentWeapon(): IWeapon | null {
        return this.currentWeaponIndex >= 0 ? this.inventory[this.currentWeaponIndex] : null;
    }

    // Dispose semua senjata (panggil di akhir game)
    public disposeAll(): void {
        this.inventory.forEach(weapon => {
            if (weapon.model) {
                this.camera.remove(weapon.model);
            }
            weapon.dispose();
        });
        this.inventory = [];
        this.currentWeaponIndex = -1;
    }

}