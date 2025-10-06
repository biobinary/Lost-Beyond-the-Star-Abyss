// src/systems/WeaponSpawnManager.ts
import * as THREE from 'three';
import { IWeapon } from '../weapons/IWeapon';
import { Blaster } from '../weapons/Blaster';
import { Shotgun } from '../weapons/Shotgun';
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
    private spawnPoints: SpawnPoint[] = [];
    private pickupRadius = 1.5;

    constructor(scene: THREE.Scene, weaponManager: WeaponManager, playerController: PlayerController) {
        this.scene = scene;
        this.weaponManager = weaponManager;
        this.playerController = playerController;

        this.initializeSpawnPoints();
    }

    private async initializeSpawnPoints() {
        const points = [
            { position: new THREE.Vector3(5, 1, -5), weapon: new Blaster() },
            { position: new THREE.Vector3(-5, 1, -5), weapon: new Shotgun() },
        ];

        for (const point of points) {
            const spawnPoint: SpawnPoint = { ...point, model: null };
            await this.loadWeaponModel(spawnPoint);
            this.spawnPoints.push(spawnPoint);
        }
    }

    private async loadWeaponModel(spawnPoint: SpawnPoint) {
        // Asumsikan IWeapon memiliki metode load yang dapat dipanggil tanpa parameter
        // atau Anda dapat menyesuaikannya sesuai dengan implementasi IWeapon Anda.
        await (spawnPoint.weapon as any).load(null);
        if (spawnPoint.weapon.model) {
            
            spawnPoint.model = spawnPoint.weapon.model;
            spawnPoint.model.position.copy(spawnPoint.position);
            this.scene.add(spawnPoint.model);
        
            let auraSpawnPoint = new THREE.Vector3().copy(spawnPoint.position);
            auraSpawnPoint.y -= spawnPoint.position.y * 0.9; // Letakkan sedikit di bawah senjata
            spawnPoint.aura = new EffectsManager(this.scene).createWeaponAura(auraSpawnPoint);
        
        }
    }

    public update(deltaTime: number) {
        
        for (let i = this.spawnPoints.length - 1; i >= 0; i--) {
        
            const spawnPoint = this.spawnPoints[i];
            if (spawnPoint.model) {
                // Animasi rotasi dan melayang
                spawnPoint.model.rotation.y += deltaTime * 0.5;
                spawnPoint.model.position.y = spawnPoint.position.y + Math.sin(Date.now() * 0.001) * 0.25;

                // Cek jarak dengan pemain
                const playerPosition = this.playerController.getPosition();
                const distance = playerPosition.distanceTo(spawnPoint.position);

                if (distance < this.pickupRadius) {
                    this.weaponManager.equip(spawnPoint.weapon);
                    
                    if (spawnPoint.model) {
                        this.scene.remove(spawnPoint.model);
                        this.scene.remove(spawnPoint.aura!);
                    }
                    
                    this.spawnPoints.splice(i, 1);
                }
            }
            
        }

    }
    
}