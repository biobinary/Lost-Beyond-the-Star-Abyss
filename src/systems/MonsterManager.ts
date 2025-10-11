import * as THREE from 'three';
import { Monster } from '../entities/Monster';

export class MonsterManager {
    private scene: THREE.Scene;
    private monsters: Monster[] = [];
    
    // PATH FILE ANDA - INI ADALAH TITIK KEGAGALAN PALING MUNGKIN
    // Jika masih gagal, coba ubah path ini menjadi 'AndromedaMonster.fbx' 
    // dan letakkan file di root folder public/ Anda.
    private readonly MONSTER_MODEL_PATH = 'AndromedaMonster.fbx'; 
    private readonly MONSTER_TEXTURE_PATH = 'MonsterTexture.jpg';

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.spawnInitialMonsters();
    }
    
    private async spawnInitialMonsters() {
        // Monster 1: Ditempatkan dekat di depan pemain (Y=1.8 = setinggi mata)
        const testPosition1 = new THREE.Vector3(0, 0, -1); 
        const monster1 = new Monster(testPosition1, this.scene);
        await monster1.load(this.MONSTER_TEXTURE_PATH, this.MONSTER_MODEL_PATH);
        this.monsters.push(monster1);
        
        // Monster 2: Contoh lain
        // const testPosition2 = new THREE.Vector3(5, 0.05, -10);
        // const monster2 = new Monster(testPosition2, this.scene);
        // await monster2.load(this.MONSTER_TEXTURE_PATH, this.MONSTER_MODEL_PATH);
        // this.monsters.push(monster2);
    }

    public update(deltaTime: number) {
        // Perbarui semua monster
        for (const monster of this.monsters) {
            monster.update(deltaTime);
        }
        
        // Logika pembersihan monster yang sudah mati
        this.monsters = this.monsters.filter(monster => monster.health > 0);
    }
    
    public getMonsters(): Monster[] {
        return this.monsters;
    }
}