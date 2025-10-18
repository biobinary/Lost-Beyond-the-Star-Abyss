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
    patrolRadius: 25.0, // ✅ Increased from 10.0 to 25.0 for wider patrol area
    detectionRadius: 15.0, // ✅ Increased from 5.0 to 15.0 for better detection
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
    
    // ✅ Debug visualization
    private readonly DEBUG_NAVMESH = false; // Set to true to see navmesh wireframe
    private debugNavmeshHelper: THREE.LineSegments | null = null;

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


            let navmeshFound = false;

            gltf.scene.traverse((child) => {
                if (child instanceof THREE.Mesh && !navmeshFound) {
                    
                    this.navmesh = child;
                    this.navmesh.position.set(0, 0, 5);
                    this.navmesh.rotation.y = Math.PI / 2.0;

                    const geometry = this.navmesh.geometry.clone();
                    
                    this.navmesh.updateWorldMatrix(true, true);
                    
                    geometry.applyMatrix4(this.navmesh.matrixWorld);

                    const cleanedGeometry = BufferGeometryUtils.mergeVertices(geometry);
                    
                    const zoneData = Pathfinding.createZone(cleanedGeometry);
                    this.pathfinding.setZoneData(this.ZONE, zoneData);

                    console.log('✅ NavMesh zone created with world transforms applied');

                    geometry.dispose();
                    
                    navmeshFound = true;
                }
            });

            // Add to scene AFTER processing (needed for debug wireframe)
            //gltf.scene.visible = false; // Hide navmesh mesh, but keep in scene for transforms
            //this.scene.add(this.navmesh);

            if (!navmeshFound) {
                throw new Error('No valid mesh found in NavMesh.glb');
            }

            // ✅ Optional: Add debug visualization
            if (this.DEBUG_NAVMESH && this.navmesh) {
                this.addDebugVisualization();
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
            { position: new THREE.Vector3(25, 0, -52) },
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

                // ✅ Validate spawn point is on navmesh
                const groupID = this.pathfinding.getGroup(this.ZONE, spawnPoint.position);
                
                if (groupID === null) {
                    console.error(`❌ Spawn point ${spawnPoint.position.toArray()} is NOT on navmesh! Skipping...`);
                    continue;
                }

                const closestNode = this.pathfinding.getClosestNode(spawnPoint.position, this.ZONE, groupID);
                if (closestNode && closestNode.centroid) {
                    const distance = spawnPoint.position.distanceTo(closestNode.centroid);
                    if (distance > 2.0) {
                        console.warn(`⚠️ Spawn point is ${distance.toFixed(2)} units from navmesh. Adjusting to navmesh...`);
                        spawnPoint.position.copy(closestNode.centroid);
                    }
                    console.log(`✅ Spawn point validated on navmesh (distance: ${distance.toFixed(2)} units)`);
                }

                const monster = new Monster(this.scene, this.assetManager, spawnPoint.config, this.colliders, this.pathfinding, this.ZONE);
                monster.load(spawnPoint.position);
                
                spawnPoint.instance = monster;
                this.activeMonsters.push(monster);

            }

        }
            
    }

    public update(deltaTime: number) {
        
        if (!this.navmeshReady) return;

        // ✅ Simple loop with per-monster optimizations (no grouping needed)
        for (let i = this.activeMonsters.length - 1; i >= 0; i--) {
            const monster = this.activeMonsters[i];
            
            // Remove dead monsters
            if (monster.health <= 0) {
                const spawnPoint = this.spawnPoints.find(p => p.instance === monster);
                if (spawnPoint) {
                    spawnPoint.instance = undefined;
                }
                this.activeMonsters.splice(i, 1);
                continue;
            }
            
            monster.update(deltaTime, this.player);
        }
        
    }
    
    public getMonsters(): Monster[] {
        return this.activeMonsters;
    }

    /**
     * ✅ Add debug wireframe visualization for navmesh
     */
    private addDebugVisualization(): void {
        if (!this.navmesh) return;

        const edges = new THREE.EdgesGeometry(this.navmesh.geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00ff00, 
            linewidth: 2,
            transparent: true,
            opacity: 0.5
        });
        
        this.debugNavmeshHelper = new THREE.LineSegments(edges, lineMaterial);
        
        // Apply same transform as navmesh
        this.debugNavmeshHelper.position.copy(this.navmesh.position);
        this.debugNavmeshHelper.rotation.copy(this.navmesh.rotation);
        this.debugNavmeshHelper.scale.copy(this.navmesh.scale);
        
        this.scene.add(this.debugNavmeshHelper);
        console.log('✅ NavMesh debug visualization added (green wireframe)');
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        // Dispose monsters
        this.activeMonsters.forEach(monster => monster.dispose());
        this.activeMonsters = [];
        
        // Remove debug helper
        if (this.debugNavmeshHelper) {
            this.scene.remove(this.debugNavmeshHelper);
            this.debugNavmeshHelper.geometry.dispose();
            (this.debugNavmeshHelper.material as THREE.Material).dispose();
            this.debugNavmeshHelper = null;
        }
    }
}