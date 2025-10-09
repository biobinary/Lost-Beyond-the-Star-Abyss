export class PlayerStats {
    // Statistik Pemain
    public health = 100;
    public maxHealth = 100;
    public stamina = 100;
    public maxStamina = 100;
    public canSprint = true;

    // Parameter Stamina
    private staminaDrainRate = 30;
    private staminaRegenRate = 10;

    constructor() {}

    public update(delta: number, isTryingToSprint: boolean, isMoving: boolean) {
        
        if (isTryingToSprint && isMoving && this.stamina > 0) {
            
            this.stamina -= this.staminaDrainRate * delta;
        
            if (this.stamina <= 0) {
                this.stamina = 0;
                this.canSprint = false;
            } 

            this.updateHUD();
        
        } else {
            
            if (this.stamina < this.maxStamina) {
                
                this.stamina += this.staminaRegenRate * delta;
                this.stamina = Math.min(this.stamina, this.maxStamina);

                if (this.stamina > 20) {
                    this.canSprint = true;
                }

                this.updateHUD();

            }

        }

    }


    public takeDamage(amount: number) {
        
        this.health -= amount;
        
        if (this.health < 0) {
            this.health = 0;
        }

        this.updateHUD();

    }

    public getStats() {
        return {
            health: this.health,
            maxHealth: this.maxHealth,
            stamina: this.stamina,
            maxStamina: this.maxStamina,
        };
    }

    private updateHUD() {
        window.dispatchEvent(new CustomEvent('playerStatsUpdate', { detail: this.getStats() }));
    }

}
