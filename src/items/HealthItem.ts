// src/items/HealthItem.ts
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { toast } from "sonner";

export class HealthItem {

    public model: THREE.Group | null = null;
    public readonly healAmount: number;
    private readonly modelPath: string = '/models/Medkit-2.0/fbx/medkit.fbx'; // ubah ke .fbx

    constructor(healAmount: number = 25) {
        this.healAmount = healAmount;
    }

    public async load(): Promise<void> {

        const loader = new FBXLoader();

        try {
        
            const fbx = await loader.loadAsync(this.modelPath);
            this.model = fbx;

            this.model.traverse((child) => {
                
                if (child instanceof THREE.Mesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }

            });

        } catch (error) {
            console.error("❌ Gagal memuat model item kesehatan (FBX):", error);
            toast.error("Gagal memuat model item kesehatan.");
        }

    }

    public dispose(): void {
        if (this.model) {
            this.model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose();
                    if (child.material instanceof THREE.Material) {
                        child.material.dispose();
                    }
                }
            });
        }
    }

}
