import * as THREE from "three";
import { InputManager } from "./InputManager";
import { PlayerMovement } from "./PlayerMovement";
import { PlayerStats } from "./PlayerStats";

export class PlayerController {
    private input: InputManager;
    public movement: PlayerMovement;
    public stats: PlayerStats;

    constructor(camera: THREE.PerspectiveCamera, inputManager: InputManager, colliders: THREE.Mesh[]) {
        this.input = inputManager;
        this.stats = new PlayerStats();
        this.movement = new PlayerMovement(camera, inputManager, colliders);
    }

    public update(delta: number, elapsedTime: number) {
        this.stats.update(delta, this.input.moveState.sprint, this.movement.isMoving());
        this.movement.update(delta, elapsedTime, this.stats.canSprint);
    }

    public takeDamage(amount: number) {
        this.stats.takeDamage(amount);
    }

    public addHealth(amount: number) {
        this.stats.restoreHealth(amount);
    }

    public getStats() {
        return this.stats.getStats();
    }

    public getPosition(): THREE.Vector3 {
        return this.movement.getPosition();
    }
    
}
