import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'; 

export class Monster {
    public model: THREE.Group | null = null;
    public health: number = 100;
    private mixer: THREE.AnimationMixer | null = null;
    private clock: THREE.Clock = new THREE.Clock();
    
    // Properti untuk menyimpan material agar bisa diupdate secara asinkron (kritis untuk tekstur polos)
    private monsterMaterial: THREE.MeshStandardMaterial | null = null; 

    constructor(private position: THREE.Vector3, private scene: THREE.Scene) {}

    public async load(texturePath: string, modelPath: string) {
        
        const textureLoader = new THREE.TextureLoader();
        let monsterTexture: THREE.Texture | null = null;

        // =======================================================
        // 1. Muat Tekstur secara Asynchronous (Menggunakan Callback)
        // =======================================================
        textureLoader.load(texturePath, 
            (texture) => {
                monsterTexture = texture;
                
                // Perbaikan UV Mapping dan Orientasi
                monsterTexture.wrapS = THREE.ClampToEdgeWrapping;
                monsterTexture.wrapT = THREE.ClampToEdgeWrapping;
                monsterTexture.flipY = true; // Coba TRUE untuk memperbaiki orientasi
                
                console.log("SUCCESS: Tekstur dimuat. Menerapkan ke material...");

                // 🛠️ PERBAIKAN KRITIS UNTUK MASALAH POLOS (TIMING): 
                // Setelah tekstur selesai diunduh, terapkan dan paksa update
                if (this.monsterMaterial) {
                    this.monsterMaterial.map = monsterTexture;
                    this.monsterMaterial.needsUpdate = true; // Kritis!
                    console.log("SUCCESS: Tekstur diterapkan dan material diperbarui.");
                }
            }, 
            undefined, 
            (err) => console.error("FATAL ERROR: Gagal memuat tekstur:", texturePath, err)
        );
        
        const fbxLoader = new FBXLoader();

        // =======================================================
        // 2. Muat Model FBX (Menggunakan Callback)
        // =======================================================
        fbxLoader.load(
            modelPath,
            // Success Callback
            (fbx) => {
                console.log("SUCCESS: Model FBX berhasil di-parsing!"); 
                
                this.model = fbx;
                
                // 1. Atur Skala, Posisi, dan Rotasi
                this.model.position.copy(this.position);
                this.model.scale.set(0.03, 0.03, 0.03); // Skala yang diminta: 0.03
                this.model.rotation.y = Math.PI/2; // Rotasi 180 derajat

                // 2. Terapkan Material
                this.model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        
                        const material = new THREE.MeshStandardMaterial({ 
                            map: monsterTexture, // Akan null/belum siap, tetapi akan diperbarui nanti
                            color: 0xffffff, 
                            metalness: 0.0,
                            roughness: 0.8,
                            side: THREE.FrontSide,
                        });
                        
                        child.material = material;
                        
                        // Simpan referensi material utama
                        this.monsterMaterial = material; 
                        
                        // Perbaikan Normal (Kritis untuk FBX)
                        child.geometry.computeVertexNormals(); 
                        child.geometry.attributes.normal.needsUpdate = true;
                    }
                });

                // 3. Inisialisasi Animasi
                if (this.model.animations && this.model.animations.length) {
                     this.mixer = new THREE.AnimationMixer(this.model);
                     const clip = this.model.animations[0];
                     this.mixer.clipAction(clip).play();
                }

                this.scene.add(this.model);
                console.log("SUCCESS: Monster Andromeda ditambahkan ke scene.");

            },
            // Progress Callback
            undefined, 
            // Error Callback
            (error) => {
                console.error("FATAL ERROR: Gagal mem-parsing model FBX (Error Detail):", error); 
            }
        );
    }

    public update(deltaTime: number) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }
    
    public dispose() {
        if (this.model) {
            this.scene.remove(this.model);
        }
    }
    
    public takeDamage(amount: number): boolean {
        this.health -= amount;
        if (this.health <= 0) {
            this.dispose();
            return true;
        }
        return false;
    }
}