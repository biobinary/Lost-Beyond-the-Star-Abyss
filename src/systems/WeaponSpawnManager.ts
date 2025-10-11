// src/systems/WeaponSpawnManager.ts
import * as THREE from 'three';
import { IWeapon } from '../weapons/IWeapon';
import { Blaster } from '../weapons/Blaster';  // Asumsi ini extend BaseWeapon dengan config
import { Shotgun } from '../weapons/Shotgun';  // Sama
import { WeaponManager } from './WeaponManager';
import { PlayerController } from './PlayerController';
import { EffectsManager } from './EffectsManager';

interface SpawnPoint {
    position: THREE.Vector3;
    weapon: IWeapon;
    model: THREE.Group | null;
    aura?: THREE.Mesh;
}

export class WeaponSpawnManager {
    private scene: THREE.Scene;
    private weaponManager: WeaponManager;
    private playerController: PlayerController;
    private effects: EffectsManager;  // Tambahan: Pakai shared EffectsManager
    private spawnPoints: SpawnPoint[] = [];
    private pickupRadius = 1.5;

    constructor(
        scene: THREE.Scene, 
        weaponManager: WeaponManager, 
        playerController: PlayerController,
        effects: EffectsManager  // Tambahan
    ) {
        this.scene = scene;
        this.weaponManager = weaponManager;
        this.playerController = playerController;
        this.effects = effects;

        this.initializeSpawnPoints();
    }

    private async initializeSpawnPoints() {
        const points = [
            { position: new THREE.Vector3(13.5, 1, -21), weapon: new Blaster() },
            { position: new THREE.Vector3(-28, 1, -52), weapon: new Shotgun() },
            { position: new THREE.Vector3(-6, 1, -1), weapon: new Blaster() },
        ];

        for (const point of points) {
            const spawnPoint: SpawnPoint = { ...point, model: null };
            await this.loadWeaponModel(spawnPoint);
            this.spawnPoints.push(spawnPoint);
        }
    }

    private async loadWeaponModel(spawnPoint: SpawnPoint) {
        
        try {
            
            await spawnPoint.weapon.load();

            if (spawnPoint.weapon.model) {
            
                spawnPoint.model = spawnPoint.weapon.model.clone();  // Clone agar spawn independen dari held model
                spawnPoint.model.position.copy(spawnPoint.position);
                spawnPoint.model.scale.set(0.009, 0.009, 0.009);  // lebih besar untuk visibility
                this.scene.add(spawnPoint.model);

                // Buat aura pakai shared effects
                const auraSpawnPoint = new THREE.Vector3().copy(spawnPoint.position);
                auraSpawnPoint.y -= spawnPoint.position.y * 0.85;  // Letakkan di bawah senjata (fixed offset)
                spawnPoint.aura = this.effects.createWeaponAura(auraSpawnPoint);  // Asumsi method ini return Mesh & add ke scene otomatis
            
            }

        } catch (error) {
            console.error(`❌ Failed to load spawn model for ${spawnPoint.weapon.config.name}:`, error);
            // Tetap tambah spawnPoint tanpa model (atau skip)
        }

    }

    // Update: Ambil elapsedTime dari game loop untuk animasi smooth
    public update(elapsedTime: number, deltaTime: number) {  // Tambah elapsedTime
        
        for (let i = this.spawnPoints.length - 1; i >= 0; i--) {
        
            const spawnPoint = this.spawnPoints[i];
        
            if (spawnPoint.model) {
        
                spawnPoint.model.rotation.y += deltaTime * 0.5;
                spawnPoint.model.position.y = spawnPoint.position.y + Math.sin(elapsedTime * 2) * 0.25;  // Speed 2 rad/s

                const playerPosition = this.playerController.getPosition();
                const distance = playerPosition.distanceTo(spawnPoint.position);

                if (distance < this.pickupRadius) {

                    this.weaponManager.addWeapon(spawnPoint.weapon);

                    // Cleanup: Remove model & aura dari scene
                    if (spawnPoint.model) {
                        this.scene.remove(spawnPoint.model);
                        spawnPoint.model = null;
                    }
                    if (spawnPoint.aura) {
                        this.scene.remove(spawnPoint.aura);
                        spawnPoint.aura = undefined;
                    }

                    // Dispose resource spawn weapon (model spawn independen)
                    spawnPoint.weapon.dispose();

                    // Hapus dari array
                    this.spawnPoints.splice(i, 1);
                    console.log(`Picked up ${spawnPoint.weapon.config.name} at spawn point!`);
                }

            }

        }
    }
}