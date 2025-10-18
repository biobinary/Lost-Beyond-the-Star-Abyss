import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { toast } from 'sonner';
import { PlayerController } from '../systems/PlayerController';
import { Pathfinding, PathfindingHelper } from 'three-pathfinding';
import { AssetManager } from '../systems/AssetManager';

export interface MonsterConfig {
    modelPath: string;
    scale: THREE.Vector3;
    health: number;
    rotation: THREE.Euler;
    speed: number;
    patrolRadius: number;
    detectionRadius: number;
    attackRadius: number;
    attackDamage: number;
    attackCooldown: number;
}

export enum MonsterState {
    PATROL = 'PATROL',
    CHASING = 'CHASING',
    ATTACKING = 'ATTACKING',
    IDLE = 'IDLE',
    DEAD = 'DEAD',
}

export class Monster {
    // Core Components
    private model: THREE.Group | null = null;
    private mixer: THREE.AnimationMixer | null = null;
    private raycaster: THREE.Raycaster = new THREE.Raycaster();
    private assetManager: AssetManager;

    // Pathfinding
    private readonly pathfinding: Pathfinding;
    private readonly pathfindingHelper: PathfindingHelper;
    private readonly zone: string;
    private path: THREE.Vector3[] = [];
    private currentPathTarget: THREE.Vector3 | null = null;

    private lastPathCalculationTime: number = 0;
    private readonly PATH_CALCULATION_COOLDOWN = 150; // ✅ Balanced: 150ms between path recalculations
    
    private readonly ENABLE_PATHFINDING_HELPER = false; // Set to true to see path visualization
    private readonly DEBUG_PATH = false; // Custom debug line (optional, keep false if using PathfindingHelper)
    private debugPathLine: THREE.Line | null = null;
    
    // State & Position
    private state: MonsterState = MonsterState.PATROL;
    private _health: number;
    private readonly initialPosition: THREE.Vector3 = new THREE.Vector3();
    private currentPatrolTarget: THREE.Vector3 = new THREE.Vector3();
    
    // Combat
    private lastAttackTime: number = 0;
    
    // Environment
    private colliders: THREE.Object3D[] = [];
    private readonly defaultRotationY: number;
    
    // Configuration
    public readonly config: MonsterConfig;
    
    private lastCacheUpdate: number = 0;
    private readonly CACHE_DURATION = 100; // ✅ Single unified cache duration
    private cachedPlayerPosition: THREE.Vector3 = new THREE.Vector3();
    private cachedDistanceToPlayer: number = Infinity;
    private cachedLineOfSight: boolean = false;

    constructor(
        private readonly scene: THREE.Scene,
        assetManager: AssetManager,
        config: MonsterConfig,
        colliders: THREE.Object3D[],
        pathfinding: Pathfinding,
        zone: string,
        rotationY: number = 0
    ) {
        this.config = { ...config };
        this._health = config.health;
        this.colliders = colliders;
        this.pathfinding = pathfinding;
        this.zone = zone;
        this.defaultRotationY = rotationY;
        this.assetManager = assetManager;

        // ✅ Initialize PathfindingHelper for visual debugging
        this.pathfindingHelper = new PathfindingHelper();
        
        if (this.ENABLE_PATHFINDING_HELPER) {
            this.scene.add(this.pathfindingHelper);
            console.log('✅ PathfindingHelper visualization enabled');
        }
    }

    public get health(): number {
        return this._health;
    }

    public set health(value: number) {
        this._health = Math.max(0, value);
    }

    public load(position: THREE.Vector3): void {
        if (this.model) {
            console.warn('Monster model already loaded');
            return;
        }

        this.initialPosition.copy(position);

        try {

            const fbx = this.assetManager.get<THREE.Group>(this.config.modelPath);
            
            this.model = fbx;
            this.setupModel(position);
            this.setupAnimations(fbx);
            this.model.traverse(obj => {
                obj.userData.entity = this;
            });
            
            this.scene.add(this.model);
            this.setNewPatrolTarget();

        } catch (error) {
            console.error('Failed to load monster model:', error);
            toast.error(`Failed to load monster: ${this.config.modelPath}`);
            throw error;
        }
    }

    private setupModel(position: THREE.Vector3): void {

        if (!this.model) return;

        this.model.position.copy(position);
        this.model.scale.copy(this.config.scale);
        this.model.rotation.copy(this.config.rotation);
        this.model.rotation.y = this.defaultRotationY;

        this.model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

    }

    private setupAnimations(fbx: THREE.Group): void {
        if (fbx.animations?.length) {
            this.mixer = new THREE.AnimationMixer(fbx);
            const action = this.mixer.clipAction(fbx.animations[0]);
            action.play();
        }
    }

    // ==================== Main Update Loop ====================

    /**
     * Updates the monster's state and behavior
     */
    public update(deltaTime: number, player: PlayerController): void {
        if (!this.model || this.state === MonsterState.DEAD) return;

        this.mixer?.update(deltaTime);

        this.updateCaches(player);

        this.updateState(this.cachedDistanceToPlayer, this.cachedPlayerPosition, deltaTime, player);
        
        if (this.ENABLE_PATHFINDING_HELPER && this.path.length > 0 && Math.random() < 0.05) {
            this.pathfindingHelper.setPlayerPosition(this.model.position);
        }
    }

    /**
     * State machine logic
     */
    private updateState(
        distanceToPlayer: number,
        playerPosition: THREE.Vector3,
        deltaTime: number,
        player: PlayerController
    ): void {
        switch (this.state) {
            case MonsterState.PATROL:
                this.handlePatrolState(deltaTime, playerPosition, distanceToPlayer);
                break;

            case MonsterState.CHASING:
                this.handleChasingState(deltaTime, playerPosition, distanceToPlayer);
                break;

            case MonsterState.ATTACKING:
                this.handleAttackingState(playerPosition, distanceToPlayer, player);
                break;
        }
    }

    // ==================== State Handlers ====================

    /**
     * Handles PATROL state logic
     */
    private handlePatrolState(deltaTime: number, playerPosition: THREE.Vector3, distanceToPlayer: number): void {
        
        if (!this.model) return;

        // ✅ Check for player detection (no line of sight required, just distance)
        if (distanceToPlayer <= this.config.detectionRadius) {
            console.log('🔴 Monster detected player! Switching to CHASING');
            this.state = MonsterState.CHASING;
            this.clearPath();
            return;
        }

        // Continue patrolling
        const distanceToPatrolTarget = this.model.position.distanceTo(this.currentPatrolTarget);
        
        if (distanceToPatrolTarget < 1.0) {
            this.setNewPatrolTarget();
        } else {
            this.followPathTo(this.currentPatrolTarget, this.config.speed * 0.5, deltaTime);
        }
        
    }

    /**
     * Handles CHASING state logic
     */
    private handleChasingState(deltaTime: number, playerPosition: THREE.Vector3, distanceToPlayer: number): void {
        
        const CHASE_ABANDON_MULTIPLIER = 2.0; // Will be 30.0 units with detectionRadius 15.0
        const CHASE_ABANDON_DISTANCE = this.config.detectionRadius * CHASE_ABANDON_MULTIPLIER;
        const lostPlayer = distanceToPlayer > CHASE_ABANDON_DISTANCE;

        if (lostPlayer) {
            console.log('🔵 Monster lost player. Returning to PATROL');
            this.state = MonsterState.PATROL;
            this.clearPath();
            this.setNewPatrolTarget();
            return;
        }

        // ✅ Check if close enough to attack
        if (distanceToPlayer <= this.config.attackRadius) {
            console.log('🔴 Monster in attack range!');
            this.state = MonsterState.ATTACKING;
            this.clearPath();
            return;
        }

        // ✅ Chase at full speed
        this.followPathTo(playerPosition, this.config.speed, deltaTime);
    
    }

    /**
     * Handles ATTACKING state logic
     */
    private handleAttackingState(playerPosition: THREE.Vector3, distanceToPlayer: number, player: PlayerController): void {
        if (distanceToPlayer > this.config.attackRadius) {
            this.state = MonsterState.CHASING;
            return;
        }

        this.faceTowards(playerPosition);
        this.attemptAttack(player);
    }

    // ==================== Pathfinding ====================

    /**
     * Calculates and follows a path to the target position
     */
    private followPathTo(targetPosition: THREE.Vector3, speed: number, deltaTime: number): void {
        
        if (!this.model) return;

        const needsNewPath = this.shouldRecalculatePath(targetPosition);

        if (needsNewPath) {
            this.calculatePath(targetPosition);
        }

        this.followCurrentPath(speed, deltaTime);

    }

    /**
     * Determines if path needs recalculation
     */
    private shouldRecalculatePath(targetPosition: THREE.Vector3): boolean {
        
        // 1. Always recalculate if there is no current path.
        if (this.path.length === 0) {
            return true;
        }

        const now = performance.now();
        const timeSinceLastCalculation = now - this.lastPathCalculationTime;
        if (timeSinceLastCalculation < this.PATH_CALCULATION_COOLDOWN) {
            return false; // Still in cooldown, use existing path
        }

        // 2. In CHASING state, recalculate only when player moves significantly
        if (this.state === MonsterState.CHASING) {
            // ✅ Balanced threshold for good response without excessive recalculation
            const RECALCULATION_THRESHOLD = 4.0; 
            if (this.currentPathTarget && this.currentPathTarget.distanceTo(targetPosition) > RECALCULATION_THRESHOLD) {
                return true;
            }
        }
        
        // 3. In PATROL state, recalculate if the target has changed more than a small tolerance.
        if (this.state === MonsterState.PATROL) {
            const TARGET_CHANGE_TOLERANCE = 1.0;
            if (this.currentPathTarget && this.currentPathTarget.distanceTo(targetPosition) > TARGET_CHANGE_TOLERANCE) {
                 // This should only happen if the patrol target was just set.
                 return true;
            }
        }

        // Otherwise, continue following the current path.
        return false;
    }

    /**
     * Calculates a new path to the target
     */
    private calculatePath(targetPosition: THREE.Vector3): void {

        if (!this.model) return;

        const groupID = this.pathfinding.getGroup(this.zone, this.model.position);
        if (groupID === null) {
            console.warn('⚠️ Monster outside navmesh at:', this.model.position.toArray());
            
            // Try to find closest point on navmesh and snap to it
            const allGroups = [0, 1, 2, 3, 4]; // Try common group IDs
            for (const testGroupID of allGroups) {
                try {
                    const closestNode = this.pathfinding.getClosestNode(this.model.position, this.zone, testGroupID);
                    if (closestNode?.centroid) {
                        console.log('✅ Snapping monster to navmesh at:', closestNode.centroid.toArray());
                        this.model.position.copy(closestNode.centroid);
                        return this.calculatePath(targetPosition); // Retry with new position
                    }
                } catch (e) {
                    // Try next group
                }
            }
            return;
        }
        
        const startNode = this.pathfinding.getClosestNode(this.model.position, this.zone, groupID);
        const targetNode = this.pathfinding.getClosestNode(targetPosition, this.zone, groupID);

        // ✅ Validate nodes before pathfinding
        if (!startNode?.centroid) {
            console.error('❌ No valid start node for pathfinding');
            return;
        }

        if (!targetNode?.centroid) {
            console.warn('⚠️ Target position outside navmesh, using closest point');
        }

        const newPath = this.pathfinding.findPath(
            startNode.centroid,
            targetNode?.centroid || targetPosition,
            this.zone,
            groupID
        );

        if (newPath && newPath.length > 0) {
            this.path = newPath;
            this.currentPathTarget = targetPosition.clone();
            
            this.lastPathCalculationTime = performance.now();

            if (this.ENABLE_PATHFINDING_HELPER && this.model) {
                this.pathfindingHelper.reset();
                this.pathfindingHelper.setPlayerPosition(this.model.position);
                this.pathfindingHelper.setTargetPosition(targetPosition);
                this.pathfindingHelper.setPath(this.path);
            }
            
            if (this.DEBUG_PATH) {
                this.updateDebugPath();
            }
        } else {
            console.warn('⚠️ No path found to target');
            this.clearPath();
        }

    }

    /**
     * Follows the currently calculated path
     */
    private followCurrentPath(speed: number, deltaTime: number): void {
        if (!this.model || this.path.length === 0) return;

        const nextWaypoint = this.path[0];
        const position = this.model.position;

        // ✅ Adjusted tolerance - slightly larger for smoother movement (was 0.25, now 0.5)
        const WAYPOINT_TOLERANCE = 0.5; 
        const distanceToWaypoint = position.distanceTo(nextWaypoint);

        if (distanceToWaypoint < WAYPOINT_TOLERANCE) {
            this.path.shift();
            
            if (this.path.length === 0) {
                this.clearPath();
            }
            
            // Crucial: Stop processing movement for this frame after path shift
            return; 
        } 
        
        // Move towards the current waypoint
        const direction = nextWaypoint.clone().sub(position);
        const distance = direction.length();
        
        this.faceTowards(nextWaypoint);

        const moveDistance = Math.min(speed * deltaTime, distance);
        
        if (distance > 0.001) {
            direction.normalize();
            
            const finalMoveDistance = Math.min(moveDistance, distanceToWaypoint);
            this.model.position.addScaledVector(direction, finalMoveDistance);
        }
    }

    /**
     * Clears the current path
     */
    private clearPath(): void {
        this.path = [];
        this.currentPathTarget = null;
        
        // ✅ Clear PathfindingHelper visualization
        if (this.ENABLE_PATHFINDING_HELPER) {
            this.pathfindingHelper.setPath([]);
        }
        
        // ✅ Clear custom debug visualization
        if (this.DEBUG_PATH && this.debugPathLine) {
            this.scene.remove(this.debugPathLine);
            this.debugPathLine.geometry.dispose();
            (this.debugPathLine.material as THREE.Material).dispose();
            this.debugPathLine = null;
        }
    }

    // ==================== Patrol Logic ====================

    /**
     * Sets a new random patrol target within patrol radius
     */
    private setNewPatrolTarget(): void {
        
        if (!this.model) return;

        const groupID = this.pathfinding.getGroup(this.zone, this.model.position);
        if (groupID === null) {
            console.log('Monster outside navmesh group');
            return;
        }

        const candidates = this.findPatrolCandidates(groupID);

        if (candidates.length > 0) {
            const randomIndex = Math.floor(Math.random() * candidates.length);
            this.currentPatrolTarget.copy(candidates[randomIndex]);
        
        } else {
            this.useFallbackPatrolTarget(groupID);
        
        }

    }

    /**
     * Finds valid patrol target candidates
     */
    private findPatrolCandidates(groupID: number): THREE.Vector3[] {
        
        if (!this.model) return [];

        const candidates: THREE.Vector3[] = [];
        const attemptCount = 25; 
        const minDistance = 3.0; 

        for (let i = 0; i < attemptCount; i++) {
            // Generate a truly random point within a circle around initialPosition
            const radius = this.config.patrolRadius * Math.sqrt(Math.random());
            const angle = Math.random() * 2 * Math.PI;

            const randomOffset = new THREE.Vector3(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            );
            
            const candidate = this.initialPosition.clone().add(randomOffset);

            // Get the closest point on the navmesh for this candidate
            const node = this.pathfinding.getClosestNode(candidate, this.zone, groupID);
            
            if (node?.centroid) {
                const navmeshPoint = node.centroid.clone();
                
                // Check distance constraints after clamping to the navmesh
                const distanceToMonster = this.model.position.distanceTo(navmeshPoint);
                const distanceFromInitial = this.initialPosition.distanceTo(navmeshPoint);

                if (distanceToMonster > minDistance && 
                    distanceFromInitial <= this.config.patrolRadius + 5.0) {
                    candidates.push(navmeshPoint);
                }
            }
        }

        return candidates;

    }


    /**
     * Checks if a point is valid for patrolling
     */
    private isValidPatrolPoint(point: THREE.Vector3, expectedGroupID: number, minDistance: number): boolean {
        
        if (!this.model) return false;

        const pointGroupID = this.pathfinding.getGroup(this.zone, point);
        if (pointGroupID !== expectedGroupID) return false;

        const node = this.pathfinding.getClosestNode(point, this.zone, expectedGroupID);
        if (!node?.centroid) return false;

        const distance = this.model.position.distanceTo(node.centroid);
        return distance > minDistance && distance < this.config.patrolRadius;

    }

    /**
     * Uses a fallback patrol target if no candidates found
     */
    private useFallbackPatrolTarget(groupID: number): void {
        const fallback = this.pathfinding.getClosestNode(this.initialPosition, this.zone, groupID);
        if (fallback?.centroid) {
            this.currentPatrolTarget.copy(fallback.centroid);
        } else {
            console.warn('Failed to find valid patrol target');
        }
    }

    // ==================== Movement ====================

    /**
     * Moves the monster towards a target position
     */
    private moveTowards(target: THREE.Vector3, speed: number, deltaTime: number): void {
        if (!this.model) return;

        const direction = target.clone().sub(this.model.position);
        if (direction.lengthSq() < 0.01) return;

        direction.normalize();
        const moveDistance = Math.min(speed * deltaTime, direction.length());
        
        this.model.position.addScaledVector(direction, moveDistance);
        this.faceTowards(target);
    }

    /**
     * Rotates the monster to face a target position
     */
    private faceTowards(target: THREE.Vector3): void {
        if (!this.model) return;

        const direction = target.clone().sub(this.model.position);
        const angle = Math.atan2(direction.x, direction.z);
        this.model.rotation.y = angle + Math.PI / 2;
    }

    // ==================== Combat ====================

    /**
     * Attempts to attack the player if cooldown elapsed
     */
    private attemptAttack(player: PlayerController): void {
        const now = performance.now();
        if (now - this.lastAttackTime >= this.config.attackCooldown) {
            player.takeDamage(this.config.attackDamage);
            this.lastAttackTime = now;
        }
    }

    /**
     * Applies damage to the monster
     */
    public takeDamage(amount: number): boolean {
        this.health -= amount;
        
        if (this.health <= 0) {
            this.state = MonsterState.DEAD;
            this.dispose();
            return true;
        }
        
        return false;
    }

    // ==================== Vision & Detection ====================

    /**
     * Checks if the monster has line of sight to the player
     */
    private canSeePlayer(playerPosition: THREE.Vector3): boolean {
        if (!this.model) return false;

        const direction = playerPosition.clone().sub(this.model.position).normalize();
        this.raycaster.set(this.model.position, direction);
        
        const intersects = this.raycaster.intersectObjects(this.colliders, true);
        const distanceToPlayer = this.model.position.distanceTo(playerPosition);
        
        return intersects.length === 0 || intersects[0].distance > distanceToPlayer;
    }
    

    private updateCaches(player: PlayerController): void {
        const now = performance.now();
        
        if (now - this.lastCacheUpdate > this.CACHE_DURATION) {
            // Update all caches together to maintain consistency
            this.cachedPlayerPosition.copy(this.getPlayerGroundPosition(player));
            this.cachedDistanceToPlayer = this.model 
                ? this.model.position.distanceTo(this.cachedPlayerPosition) 
                : Infinity;
            this.cachedLineOfSight = this.canSeePlayer(this.cachedPlayerPosition);
            
            this.lastCacheUpdate = now;
        }
    }

    /**
     * Gets player position at ground level
     */
    private getPlayerGroundPosition(player: PlayerController): THREE.Vector3 {
        const position = player.getPosition();
        position.y = 0.0;
        return position;
    }

    // ==================== Cleanup ====================

    /**
     * Cleans up all resources used by the monster
     */
    public dispose(): void {
        this.disposeModel();
        this.disposeMixer();
        this.disposePathfinding();
        
        this.colliders = [];
    }

    /**
     * Disposes of the model and its materials
     */
    private disposeModel(): void {
        if (!this.model) return;

        this.scene.remove(this.model);
        
        this.model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.geometry?.dispose();
                
                if (child.material) {
                    const materials = Array.isArray(child.material) 
                        ? child.material 
                        : [child.material];
                    
                    materials.forEach(mat => mat.dispose());
                }
            }
        });
        
        this.model = null;
    }

    /**
     * Disposes of the animation mixer
     */
    private disposeMixer(): void {
        if (!this.mixer) return;

        this.mixer.stopAllAction();
        this.mixer.uncacheRoot(this.mixer.getRoot());
        this.mixer = null;
    }

    /**
     * Disposes of pathfinding resources
     */
    private disposePathfinding(): void {
        if (this.ENABLE_PATHFINDING_HELPER) {
            this.scene.remove(this.pathfindingHelper);
        }
        this.clearPath();
    }

    /**
     * ✅ Update debug path visualization
     */
    private updateDebugPath(): void {
        if (!this.model || !this.DEBUG_PATH) return;

        // Remove old debug line
        if (this.debugPathLine) {
            this.scene.remove(this.debugPathLine);
            this.debugPathLine.geometry.dispose();
            (this.debugPathLine.material as THREE.Material).dispose();
        }

        // Create new debug line
        if (this.path.length > 0) {
            const points = [this.model.position.clone(), ...this.path];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ 
                color: 0xff0000, 
                linewidth: 3,
                transparent: true,
                opacity: 0.7
            });
            
            this.debugPathLine = new THREE.Line(geometry, material);
            this.scene.add(this.debugPathLine);
        }
    }

}