import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { toast } from 'sonner';
import { PlayerController } from '../systems/PlayerController';
import { Pathfinding, PathfindingHelper } from 'three-pathfinding';

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
    
    // Pathfinding
    private readonly pathfinding: Pathfinding;
    private readonly pathfindingHelper: PathfindingHelper;
    private readonly zone: string;
    private path: THREE.Vector3[] = [];
    private currentPathTarget: THREE.Vector3 | null = null;
    
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

    constructor(
        private readonly scene: THREE.Scene,
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

        this.pathfindingHelper = new PathfindingHelper();
        this.scene.add(this.pathfindingHelper);
    }

    public get health(): number {
        return this._health;
    }

    public set health(value: number) {
        this._health = Math.max(0, value);
    }

    public async load(position: THREE.Vector3): Promise<void> {
        if (this.model) {
            console.warn('Monster model already loaded');
            return;
        }

        this.initialPosition.copy(position);

        try {
            const fbxLoader = new FBXLoader();
            const fbx = await fbxLoader.loadAsync(this.config.modelPath);
            
            this.model = fbx;
            this.setupModel(position);
            this.setupAnimations(fbx);
            
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

        const playerPosition = this.getPlayerGroundPosition(player);
        const distanceToPlayer = this.model.position.distanceTo(playerPosition);

        this.updateState(distanceToPlayer, playerPosition, deltaTime, player);
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

        // Check for player detection
        if (this.canSeePlayer(playerPosition) && distanceToPlayer <= this.config.detectionRadius) {
            this.state = MonsterState.CHASING;
            this.clearPath();
            return;
        }

        // Continue patrolling
        const distanceToPatrolTarget = this.model.position.distanceTo(this.currentPatrolTarget);
        if (distanceToPatrolTarget < 0.5) {
            this.setNewPatrolTarget();
        } else {
            this.followPathTo(this.currentPatrolTarget, this.config.speed * 0.5, deltaTime);
        }
        
    }

    /**
     * Handles CHASING state logic
     */
    private handleChasingState(deltaTime: number, playerPosition: THREE.Vector3, distanceToPlayer: number): void {
        
        const lostPlayer = distanceToPlayer > this.config.detectionRadius * 1.5 || 
                          !this.canSeePlayer(playerPosition);

        if (lostPlayer) {
            this.state = MonsterState.PATROL;
            this.clearPath();
            this.setNewPatrolTarget();
            return;
        }

        if (distanceToPlayer <= this.config.attackRadius) {
            this.state = MonsterState.ATTACKING;
            this.clearPath();
            return;
        }

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
        
        const targetChanged = !this.currentPathTarget || 
                            this.currentPathTarget.distanceTo(targetPosition) > 0.5;
        
        const hasNoPath = this.path.length === 0;

        return targetChanged || hasNoPath;

    }

    /**
     * Calculates a new path to the target
     */
    private calculatePath(targetPosition: THREE.Vector3): void {

        if (!this.model) return;

        const groupID = this.pathfinding.getGroup(this.zone, this.model.position);
        if (groupID === null) {
            console.warn('Monster outside navmesh group');
            return;
        }

        const newPath = this.pathfinding.findPath(
            this.model.position,
            targetPosition,
            this.zone,
            groupID
        );

        if (newPath && newPath.length > 0) {
            this.path = newPath;
            this.currentPathTarget = targetPosition.clone();
            this.pathfindingHelper.setPath(this.path);
        } else {
            this.clearPath();
        }

    }

    /**
     * Follows the currently calculated path
     */
    private followCurrentPath(speed: number, deltaTime: number): void {

        if (!this.model || this.path.length === 0) return;

        const nextWaypoint = this.path[0];
        this.moveTowards(nextWaypoint, speed, deltaTime);

        // Reached waypoint, move to next
        if (this.model.position.distanceTo(nextWaypoint) < 0.5) {
            this.path.shift();
        }

    }

    /**
     * Clears the current path
     */
    private clearPath(): void {
        this.path = [];
        this.currentPathTarget = null;
        this.pathfindingHelper.setPath(null);
    }

    // ==================== Patrol Logic ====================

    /**
     * Sets a new random patrol target within patrol radius
     */
    private setNewPatrolTarget(): void {
        
        if (!this.model) return;

        const groupID = this.pathfinding.getGroup(this.zone, this.model.position);
        if (groupID === null) {
            console.warn('Monster outside navmesh group');
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
        const attemptCount = 10;
        const minDistance = 3.0;

        for (let i = 0; i < attemptCount; i++) {
            const angle = (Math.PI * 2 * i) / attemptCount + Math.random() * 0.5;
            const distance = this.config.patrolRadius * (0.3 + Math.random() * 0.7);

            const candidate = this.initialPosition.clone().add(
                new THREE.Vector3(
                    Math.cos(angle) * distance,
                    0,
                    Math.sin(angle) * distance
                )
            );

            if (this.isValidPatrolPoint(candidate, groupID, minDistance)) {
                const node = this.pathfinding.getClosestNode(candidate, this.zone, groupID);
                if (node?.centroid) {
                    candidates.push(node.centroid.clone());
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
        this.scene.remove(this.pathfindingHelper);
        this.clearPath();
    }

}