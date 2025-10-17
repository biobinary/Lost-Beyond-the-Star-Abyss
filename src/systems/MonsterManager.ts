// src/systems/MonsterManager.ts (diganti namanya menjadi MonsterSpawnManager.ts)
import * as THREE from 'three';
import { Monster, MonsterConfig } from '../entities/Monster';
import { Pathfinding } from 'three-pathfinding';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { PlayerController } from './PlayerController';
import { AssetManager } from './AssetManager';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

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
    private assetManager: AssetManager;

    constructor(scene: THREE.Scene, player: PlayerController, colliders: any[], assetManager: AssetManager) {
        this.scene = scene;
        this.player = player;
        this.colliders = colliders;
        this.assetManager = assetManager;
        this.pathfinding = new Pathfinding();
        this.loadNavMesh();
    }

    private loadNavMesh() {
        
        try {

            const gltf = this.assetManager.get<any>('/models/NavMeshTest.glb');

            gltf.scene.position.set(0, 0, 5);
            gltf.scene.rotation.y = Math.PI / 2;
            this.scene.add(gltf.scene);

            let navmeshFound = false;

            // INI AKU NYOBA-NYOBA, 
            // HAPUS WAE PAKEK YANG LAEN

            gltf.scene.traverse((child) => {
                if (child instanceof THREE.Mesh && !navmeshFound) {
                    
                    this.navmesh = child;

                    // // Clone + apply transforms
                    // const geometry = this.navmesh.geometry.clone();
                    // this.navmesh.updateWorldMatrix(true, false);
                    // geometry.applyMatrix4(this.navmesh.matrixWorld);

                    // // ✅ Clean up geometry before creating zone
                    // let cleanedGeometry = BufferGeometryUtils.mergeVertices(geometry);

                    // // Optional: check for negative scale
                    // const s = this.navmesh.scale;
                    // if (s.x * s.y * s.z < 0) {
                    //     cleanedGeometry.scale(-1, 1, 1);
                    // }

                    // ✅ Create zone data from cleaned geometry
                    const zoneData = Pathfinding.createZone(this.navmesh.geometry);
                    this.pathfinding.setZoneData(this.ZONE, zoneData);

                    // geometry.dispose();
                    navmeshFound = true;
                }
            });

            if (!navmeshFound) {
                throw new Error('No valid mesh found in NavMesh.glb');
            }

            this.initializeSpawnPoints();
            this.navmeshReady = true;

        } catch (error) {
            console.error('Failed to load NavMesh:', error);
        }
    }

    private async initializeSpawnPoints() {
    
        const points: { position: THREE.Vector3, rotationY?: number }[] = [
            { position: new THREE.Vector3(0, 0, -5), rotationY: 0 },
            // { position: new THREE.Vector3(0, 0, -10) },
            // { position: new THREE.Vector3(-25, 0, -52) },
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
    
    private spawnAllMonsters() {
        
        for (const spawnPoint of this.spawnPoints) {
            
            if (!spawnPoint.instance) {

                const monster = new Monster(this.scene, this.assetManager, spawnPoint.config, this.colliders, this.pathfinding, this.ZONE);
                monster.load(spawnPoint.position);
                
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