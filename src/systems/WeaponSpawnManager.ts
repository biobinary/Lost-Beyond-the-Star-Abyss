// src/systems/WeaponSpawnManager.ts
import * as THREE from 'three';
import { IWeapon } from '../weapons/IWeapon';
import { Blaster } from '../weapons/Blaster';
import { Shotgun } from '../weapons/Shotgun';
import { WeaponManager } from './WeaponManager';
import { PlayerController } from './PlayerController';
import { EffectsManager } from './EffectsManager';
import { AssetManager } from './AssetManager';

interface SpawnPoint {
    position: THREE.Vector3;
    weapon: IWeapon;
    model: THREE.Group | null;
    aura?: THREE.Mesh;
}

export class WeaponSpawnManager {
    private scene: THREE.Scene;
    private listener: THREE.AudioListener;
    private weaponManager: WeaponManager;
    private playerController: PlayerController;
    private effects: EffectsManager;
    private assetManager: AssetManager;
    private spawnPoints: SpawnPoint[] = [];
    private pickupRadius = 1.5;

    constructor(
        scene: THREE.Scene,
        weaponManager: WeaponManager,
        playerController: PlayerController,
        effects: EffectsManager,
        listener: THREE.AudioListener,
        assetManager: AssetManager
    ) {
        this.scene = scene;
        this.weaponManager = weaponManager;
        this.playerController = playerController;
        this.effects = effects;
        this.listener = listener;
        this.assetManager = assetManager;

        this.initializeSpawnPoints();
    }

    private async initializeSpawnPoints() {

        const points = [
            { position: new THREE.Vector3(-13.5, 1, -21), weapon: new Blaster(this.listener, this.assetManager) },
            { position: new THREE.Vector3(28, 1, -52), weapon: new Shotgun(this.listener, this.assetManager) },
            { position: new THREE.Vector3(25, 1, -52), weapon: new Shotgun(this.listener, this.assetManager) },
            { position: new THREE.Vector3(6, 1, -1), weapon: new Blaster(this.listener, this.assetManager) },
        ];

        for (const point of points) {
            const spawnPoint: SpawnPoint = { ...point, model: null };
            this.loadWeaponModel(spawnPoint);
            this.spawnPoints.push(spawnPoint);
        }

    }

    private loadWeaponModel(spawnPoint: SpawnPoint) {
        
        try {
        
            spawnPoint.weapon.load();

            if (spawnPoint.weapon.model) {
                spawnPoint.model = spawnPoint.weapon.model.clone();
                spawnPoint.model.position.copy(spawnPoint.position);
                spawnPoint.model.scale.set(0.009, 0.009, 0.009);
                this.scene.add(spawnPoint.model);

                // Buat aura di bawah senjata
                const auraSpawnPoint = spawnPoint.position.clone();
                auraSpawnPoint.y -= spawnPoint.position.y * 0.875;
                spawnPoint.aura = this.effects.createWeaponAura(auraSpawnPoint);
            }
        
        } catch (error) {
            console.error(`❌ Failed to load spawn model for ${spawnPoint.weapon.config.name}:`, error);
        
        }

    }

    public update(elapsedTime: number, deltaTime: number) {
        for (let i = this.spawnPoints.length - 1; i >= 0; i--) {
            const spawnPoint = this.spawnPoints[i];
            const { model, position } = spawnPoint;

            if (!model || !position) continue;

            model.rotation.y += deltaTime * 0.5;
            model.position.y = position.y + Math.sin(elapsedTime * 2) * 0.25;

            const playerPos = this.playerController.getPosition();
            const distance = playerPos.distanceTo(position);

            if (distance < this.pickupRadius) {
                this.weaponManager.addWeapon(spawnPoint.weapon);

                if (spawnPoint.model) {
                    this.scene.remove(spawnPoint.model);
                    spawnPoint.model = null;
                }
                if (spawnPoint.aura) {
                    this.scene.remove(spawnPoint.aura);
                    spawnPoint.aura = undefined;
                }

                spawnPoint.weapon.dispose();
                this.spawnPoints.splice(i, 1);

                console.log(`🔫 Player picked up ${spawnPoint.weapon.config.name}`);
            }
        }
    }
}
