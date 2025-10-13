// src/systems/HealthItemSpawnManager.ts
import * as THREE from 'three';
import { HealthItem } from '../items/HealthItem';
import { PlayerController } from './PlayerController';
import { EffectsManager } from './EffectsManager';
import { AssetManager } from './AssetManager';

interface SpawnPoint {
    position: THREE.Vector3;
    item: HealthItem;
    model: THREE.Group | null;
    aura?: THREE.Mesh;
}

export class HealthItemSpawnManager {

    private scene: THREE.Scene;
    private listener: THREE.AudioListener;
    private playerController: PlayerController;
    private effects: EffectsManager;
    private spawnPoints: SpawnPoint[] = [];
    private pickupRadius = 1.5;
    private healSound: THREE.Audio
    private assetManager: AssetManager;

    constructor(
        scene: THREE.Scene,
        playerController: PlayerController,
        effects: EffectsManager,
        listener: THREE.AudioListener,
        assetManager: AssetManager
    ) {
        
        this.scene = scene;
        this.playerController = playerController;
        this.effects = effects;
        this.listener = listener;
        this.assetManager = assetManager;

        this.initializeSpawnPoints();
        this.loadSound();

    }

    private loadSound() {
        this.healSound = new THREE.Audio(this.listener);
        const healSoundBuffer = this.assetManager.get<AudioBuffer>('/Audio/sound/half_life_medkit_sfx.mp3');
        this.healSound.setBuffer(healSoundBuffer);
        this.healSound.setVolume(0.4);
        this.healSound.setLoop(false);
    }

    private initializeSpawnPoints() {
        
        const points = [
            { position: new THREE.Vector3(0, 1, -5), item: new HealthItem(25) },
        ];

        for (const point of points) {
            const spawnPoint: SpawnPoint = { ...point, model: null };
            this.loadItemModel(this.assetManager, spawnPoint);
            this.spawnPoints.push(spawnPoint);
        }

    }

    private loadItemModel(assetManager: AssetManager, spawnPoint: SpawnPoint) {
        try {
        
            spawnPoint.item.load(assetManager);
        
            if (spawnPoint.item.model) {
                spawnPoint.model = spawnPoint.item.model.clone();
                spawnPoint.model.position.copy(spawnPoint.position);
                spawnPoint.model.scale.set(0.0025, 0.0025, 0.0025);
                this.scene.add(spawnPoint.model);

                const auraSpawnPoint = new THREE.Vector3().copy(spawnPoint.position);
                auraSpawnPoint.y -= spawnPoint.position.y * 0.85;
                spawnPoint.aura = this.effects.createWeaponAura(auraSpawnPoint);
            }
        
        } catch (error) {
            console.error(`❌ Gagal memuat model spawn untuk item kesehatan:`, error);
        }

    }

    public update(elapsedTime: number, deltaTime: number) {
        
        for (let i = this.spawnPoints.length - 1; i >= 0; i--) {
            
            const spawnPoint = this.spawnPoints[i];
            
            if (spawnPoint.model) {

                spawnPoint.model.rotation.y += deltaTime * 0.5;
                spawnPoint.model.position.y = spawnPoint.position.y + Math.sin(elapsedTime * 2) * 0.25;

                const playerPosition = this.playerController.getPosition();
                const distance = playerPosition.distanceTo(spawnPoint.position);

                if (distance < this.pickupRadius) {

                    const playerStats = this.playerController.getStats();

                    if (playerStats.health < playerStats.maxHealth) {

                        this.playerController.addHealth(spawnPoint.item.healAmount);
                        window.dispatchEvent(new CustomEvent('medkitPickup'));
                        
                        if (this.healSound && this.healSound.isPlaying) {
                            this.healSound.stop();
                        }
                        this.healSound?.play();

                        if (spawnPoint.model) {
                            this.scene.remove(spawnPoint.model);
                            spawnPoint.model = null;
                        }
                        if (spawnPoint.aura) {
                            this.scene.remove(spawnPoint.aura);
                            spawnPoint.aura = undefined;
                        }

                        spawnPoint.item.dispose();
                        this.spawnPoints.splice(i, 1);
                        console.log(`Mengambil item kesehatan di titik spawn!`);
                    
                    }

                }
        
            }

        }

    }

}