// src/systems/MonsterManager.ts (diganti namanya menjadi MonsterSpawnManager.ts)
import * as THREE from 'three';
import { Monster, MonsterConfig } from '../entities/Monster';

// Definisikan tipe untuk spawn point monster
interface MonsterSpawnPoint {
    position: THREE.Vector3;
    config: MonsterConfig;
    instance?: Monster;
}

// Konfigurasi default untuk monster
const AndromedaConfig: MonsterConfig = {
    modelPath: 'AndromedaMonster.fbx',
    scale: new THREE.Vector3(0.05, 0.05, 0.05),
    health: 100,
    rotation: new THREE.Euler(0, Math.PI / 2, 0)
};

export class MonsterSpawnManager {

    private scene: THREE.Scene;
    private spawnPoints: MonsterSpawnPoint[] = [];
    public activeMonsters: Monster[] = [];

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.initializeSpawnPoints();
    }

    private initializeSpawnPoints() {
    
        const points: { position: THREE.Vector3, rotationY?: number }[] = [
            { position: new THREE.Vector3(0, 0, -1), rotationY: 90 },
            { position: new THREE.Vector3(10, 0, -15), rotationY: -90 },
            { position: new THREE.Vector3(-15, 0, -25) },
        ];

        points.forEach(point => {

            const config = { ...AndromedaConfig };
            
            if (point.rotationY !== undefined) {
                config.rotation = new THREE.Euler(0, point.rotationY * (Math.PI / 180), 0);
            }

            this.spawnPoints.push({
                position: point.position,
                config: config,
            });

        });
        
        this.spawnAllMonsters();

    }
    
    private async spawnAllMonsters() {
        for (const spawnPoint of this.spawnPoints) {
            if (!spawnPoint.instance) {
                const monster = new Monster(this.scene, spawnPoint.config);
                await monster.load(spawnPoint.position);
                
                spawnPoint.instance = monster;
                this.activeMonsters.push(monster);
            }
        }
    }

    public update(deltaTime: number) {
        
        for (let i = this.activeMonsters.length - 1; i >= 0; i--) {

            const monster = this.activeMonsters[i];
            monster.update(deltaTime);

            if (monster.health <= 0) {
                const spawnPoint = this.spawnPoints.find(p => p.instance === monster);
                if (spawnPoint) {
                    spawnPoint.instance = undefined;
                }
                this.activeMonsters.splice(i, 1);
            }
        
        }
        
    }
    
    public getMonsters(): Monster[] {
        return this.activeMonsters;
    }
}