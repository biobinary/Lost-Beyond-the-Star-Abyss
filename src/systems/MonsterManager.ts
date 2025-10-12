// src/systems/MonsterManager.ts (diganti namanya menjadi MonsterSpawnManager.ts)
import * as THREE from 'three';
import { Monster, MonsterConfig } from '../entities/Monster';
import { Pathfinding } from 'three-pathfinding';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PlayerController } from './PlayerController';

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
    rotation: new THREE.Euler(0, Math.PI / 2, 0),
    speed: 2.5,
    patrolRadius: 10.0,
    detectionRadius: 5.0,
    attackRadius: 2.5,
    attackDamage: 10,
    attackCooldown: 1000,
};


export class MonsterSpawnManager {

    private scene: THREE.Scene;
    private spawnPoints: MonsterSpawnPoint[] = [];
    public activeMonsters: Monster[] = [];
    private player: PlayerController;
    private colliders: any[];
    private pathfinding: Pathfinding;
    private navmesh: THREE.Mesh;
    private ZONE = 'level';
    private navmeshReady = false;

    constructor(scene: THREE.Scene, player: PlayerController, colliders: any[]) {
        this.scene = scene;
        this.player = player;
        this.colliders = colliders;
        this.pathfinding = new Pathfinding();
        this.loadNavMesh();
    }

    private async loadNavMesh() { 
        const loader = new GLTFLoader();
        
        try {
            const gltf = await loader.loadAsync('/models/NavMesh.glb');

            // Transformasi
            gltf.scene.scale.set(1.5, 1.5, 1.5);
            gltf.scene.position.set(0, 0, 5);
            gltf.scene.rotation.y = Math.PI / 2;
            this.scene.add(gltf.scene);

            let navmeshFound = false;
            gltf.scene.traverse((child) => {
                if (child instanceof THREE.Mesh && !navmeshFound) {
                    console.log('Found mesh:', child.name, child.type);
                    console.log('Geometry:', child.geometry);
                    console.log('Vertices count:', child.geometry.attributes.position?.count);
                        
                    this.navmesh = child as THREE.Mesh;

                    const zoneData = Pathfinding.createZone(child.geometry);
                    console.log('Zone data created:', zoneData);
                    console.log('Groups in zone:', Object.keys(zoneData.groups).length);

                    this.pathfinding.setZoneData(this.ZONE, zoneData);
                    navmeshFound = true;

                }

            });

            if (!navmeshFound) {
                throw new Error('No valid mesh found in NavMesh.glb');
            }

            await this.initializeSpawnPoints();
            this.navmeshReady = true;

        } catch (error) { 
            console.error('Failed to load NavMesh:', error);
        }
    }

    private async initializeSpawnPoints() {
    
        const points: { position: THREE.Vector3, rotationY?: number }[] = [
            { position: new THREE.Vector3(0, 0, -1), rotationY: 90 },
            // { position: new THREE.Vector3(10, 0, -15), rotationY: -90 },
            // { position: new THREE.Vector3(-15, 0, -25) },
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
        
        await this.spawnAllMonsters();

    }
    
    private async spawnAllMonsters() {
        for (const spawnPoint of this.spawnPoints) {
            if (!spawnPoint.instance) {
                const monster = new Monster(this.scene, spawnPoint.config, this.colliders, this.pathfinding, this.ZONE);
                await monster.load(spawnPoint.position);
                
                spawnPoint.instance = monster;
                this.activeMonsters.push(monster);
            }
        }
    }

    public update(deltaTime: number) {
        
        if (!this.navmeshReady) return;

        for (let i = this.activeMonsters.length - 1; i >= 0; i--) {

            const monster = this.activeMonsters[i];
            monster.update(deltaTime, this.player);

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