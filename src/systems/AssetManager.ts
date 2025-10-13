// src/systems/AssetManager.ts

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

interface AssetConfig {
  type: 'gltf' | 'fbx' | 'texture' | 'cubetexture' | 'audio';
  path: string | string[];
  key?: string;
}

export class AssetManager {

  private manager: THREE.LoadingManager;
  private onProgress: (progress: number, assetName: string) => void;
  private onReady: () => void;
  private assets: Map<string, any> = new Map();
  
  private gltfLoader!: GLTFLoader;
  private fbxLoader!: FBXLoader;
  private textureLoader!: THREE.TextureLoader;
  private audioLoader!: THREE.AudioLoader;
  private cubeTextureLoader!: THREE.CubeTextureLoader;

  constructor(
    onProgress: (progress: number, assetName: string) => void, 
    onReady: () => void
  ) {
    this.manager = new THREE.LoadingManager();
    this.onProgress = onProgress;
    this.onReady = onReady;

    this.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = (itemsLoaded / itemsTotal) * 100;
      this.onProgress(progress, url.split('/').pop() || 'asset');
    };

    this.manager.onLoad = () => {
      this.onReady();
    };

    this.manager.onError = (url) => {
      console.error(`❌ Error loading asset: ${url}`);
    };

    this.initializeLoaders();
  }

  private initializeLoaders(): void {
    
    this.gltfLoader = new GLTFLoader(this.manager);
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    this.gltfLoader.setDRACOLoader(dracoLoader);

    this.fbxLoader = new FBXLoader(this.manager);
    this.textureLoader = new THREE.TextureLoader(this.manager);
    this.audioLoader = new THREE.AudioLoader(this.manager);
    this.cubeTextureLoader = new THREE.CubeTextureLoader(this.manager);

  }

  /**
   * Get asset from cache dengan deep cloning untuk Object3D
   */
    public get<T>(path: string): T {

        const asset = this.assets.get(path);

        if (!asset) {
            throw new Error(`❌ Asset tidak ditemukan di cache: ${path}`);
        }

        // Clone GLTF scene
        if (asset.scene && asset.scene instanceof THREE.Object3D) {
            const clonedScene = clone(asset.scene); // ✅ Gunakan SkeletonUtils

            clonedScene.position.set(0, 0, 0);
            clonedScene.rotation.set(0, 0, 0);
            clonedScene.scale.set(1, 1, 1);

            const animations = asset.animations ? 
                asset.animations.map((clip: THREE.AnimationClip) => clip.clone()) : [];

            return { scene: clonedScene, animations } as T;
        }

        // Clone FBX/Object3D dengan SkeletonUtils
        if (asset instanceof THREE.Object3D) {
            const cloned = clone(asset); // ✅ Gunakan SkeletonUtils

            cloned.position.set(0, 0, 0);
            cloned.rotation.set(0, 0, 0);
            cloned.scale.set(1, 1, 1);

            // ✅ Copy animations dari original
            if ((asset as any).animations) {
                (cloned as any).animations = (asset as any).animations.map(
                    (clip: THREE.AnimationClip) => clip.clone()
                );
            }

            console.log('✅ FBX Cloned with animations:', (cloned as any).animations?.length || 0);

            return cloned as T;
        }

        // Clone texture
        if (asset instanceof THREE.Texture) {
            return asset.clone() as T;
        }

        return asset as T;
    }

  private deepCloneFBX(source: THREE.Group): THREE.Group {

    const cloned = new THREE.Group();
    
    source.traverse((child) => {
        
        if (child === source) return;

            if (child instanceof THREE.Mesh) {
                const clonedMesh = new THREE.Mesh(
                    child.geometry.clone(),
                    child.material instanceof Array 
                        ? child.material.map(m => m.clone())
                        : child.material.clone()
                );

                // Copy properties
                clonedMesh.position.copy(child.position);
                clonedMesh.rotation.copy(child.rotation);
                clonedMesh.scale.copy(child.scale);
                clonedMesh.castShadow = child.castShadow;
                clonedMesh.receiveShadow = child.receiveShadow;

                cloned.add(clonedMesh);
            }
        });

        // Copy animations if exist
        if ((source as any).animations) {
            (cloned as any).animations = (source as any).animations.map(
                (clip: THREE.AnimationClip) => clip.clone()
            );
        }

        return cloned;

    }

  /**
   * Check if asset exists in cache
   */
  public has(path: string): boolean {
    return this.assets.has(path);
  }

  /**
   * Get GLTF model khusus untuk map/environment
   */
  public getModel(path: string): THREE.Group {
    const gltf = this.get<any>(path);
    return gltf.scene;
  }

  /**
   * Get FBX model khusus untuk weapon/items
   */
  public getFBXModel(path: string): THREE.Group {
    return this.get<THREE.Group>(path);
  }

  /**
   * Get texture dengan automatic SRGB color space
   */
  public getTexture(path: string, srgb: boolean = true): THREE.Texture {
    const texture = this.get<THREE.Texture>(path);
    if (srgb) {
      texture.colorSpace = THREE.SRGBColorSpace;
    }
    return texture;
  }

  /**
   * Get audio buffer
   */
  public getAudioBuffer(path: string): AudioBuffer {
    return this.get<AudioBuffer>(path);
  }

  /**
   * Get skybox/cubemap texture
   */
  public getSkybox(key: string = 'skybox'): THREE.CubeTexture {
    return this.get<THREE.CubeTexture>(key);
  }

  /**
   * Load all predefined assets
   */
  public loadAssets(): void {
    
    const assetsToLoad: AssetConfig[] = [
    
        // ===== MAP & ENVIRONMENT =====
      { type: 'gltf', path: '/models/Map.glb' },
      { type: 'gltf', path: '/models/NavMesh.glb' },
      { type: 'gltf', path: '/models/freeport_space_station1.glb' },

      // ===== WEAPONS (FBX) =====
      { type: 'fbx', path: '/models/low_poly_guns_fbx/fusil/fusil_3.fbx' },
      { type: 'fbx', path: '/models/low_poly_guns_fbx/shotguns/shotgun_1.fbx' },
      
      // ===== ITEMS =====
      { type: 'fbx', path: '/models/Medkit-2.0/fbx/medkit.fbx' },
      
      // ===== CHARACTERS/MONSTERS =====
      { type: 'fbx', path: 'AndromedaMonster.fbx' },

      // ===== TEXTURES =====
      { type: 'texture', path: '/models/low_poly_guns_fbx/uv_palette.png' },

      // ===== SKYBOX =====
      { 
        type: 'cubetexture', 
        path: [
          '/skybox/right.png', 
          '/skybox/left.png', 
          '/skybox/top.png', 
          '/skybox/bottom.png', 
          '/skybox/front.png', 
          '/skybox/back.png'
        ], 
        key: 'skybox'
      },

      // ===== AUDIO - MUSIC =====
      { type: 'audio', path: '/Audio/Music/mystery-in-space-178544.mp3' },

      // ===== AUDIO - SOUND EFFECTS =====
      { type: 'audio', path: '/Audio/sound/heathers-gunshot.mp3' },
      { type: 'audio', path: '/Audio/sound/mag-in.mp3' },
      { type: 'audio', path: '/Audio/sound/empty-gun-shot.mp3' },
      { type: 'audio', path: '/Audio/sound/shotgun-firing-3.mp3' },
      { type: 'audio', path: '/Audio/sound/gun-reload-2.mp3' },
      { type: 'audio', path: '/Audio/sound/half_life_medkit_sfx.mp3' },
    ];

    this.loadAssetBatch(assetsToLoad);

  }

  /**
   * Load batch of assets
   */
  private loadAssetBatch(assets: AssetConfig[]): void {
    assets.forEach(asset => {
      const key = asset.key || (Array.isArray(asset.path) ? asset.path.join(',') : asset.path);
      
      switch(asset.type) {
        case 'gltf':
          this.gltfLoader.load(
            asset.path as string, 
            (gltf) => {
              this.assets.set(key, gltf);
              console.log(`✅ Loaded GLTF: ${key}`);
            },
            undefined,
            (error) => console.error(`❌ Error loading GLTF ${key}:`, error)
          );
          break;

        case 'fbx':
          this.fbxLoader.load(
            asset.path as string, 
            (fbx) => {
              this.assets.set(key, fbx);
              console.log(`✅ Loaded FBX: ${key}`);
            },
            undefined,
            (error) => console.error(`❌ Error loading FBX ${key}:`, error)
          );
          break;

        case 'texture':
          this.textureLoader.load(
            asset.path as string, 
            (texture) => {
              this.assets.set(key, texture);
              console.log(`✅ Loaded Texture: ${key}`);
            },
            undefined,
            (error) => console.error(`❌ Error loading Texture ${key}:`, error)
          );
          break;

        case 'cubetexture':
          this.cubeTextureLoader.load(
            asset.path as string[], 
            (texture) => {
              this.assets.set(key, texture);
              console.log(`✅ Loaded Cubetexture: ${key}`);
            },
            undefined,
            (error) => console.error(`❌ Error loading Cubetexture ${key}:`, error)
          );
          break;

        case 'audio':
          this.audioLoader.load(
            asset.path as string, 
            (buffer) => {
              this.assets.set(key, buffer);
              console.log(`✅ Loaded Audio: ${key}`);
            },
            undefined,
            (error) => console.error(`❌ Error loading Audio ${key}:`, error)
          );
          break;
      }
    });
  }

  /**
   * Load single asset dynamically (jika diperlukan)
   */
  public async loadSingleAsset(type: string, path: string): Promise<any> {
    const key = path;

    // Check cache first
    if (this.has(key)) {
      return this.get(key);
    }

    return new Promise((resolve, reject) => {
      switch(type) {
        case 'gltf':
          this.gltfLoader.load(
            path,
            (gltf) => {
              this.assets.set(key, gltf);
              resolve(gltf);
            },
            undefined,
            reject
          );
          break;

        case 'fbx':
          this.fbxLoader.load(
            path,
            (fbx) => {
              this.assets.set(key, fbx);
              resolve(fbx);
            },
            undefined,
            reject
          );
          break;

        case 'texture':
          this.textureLoader.load(
            path,
            (texture) => {
              this.assets.set(key, texture);
              resolve(texture);
            },
            undefined,
            reject
          );
          break;

        case 'audio':
          this.audioLoader.load(
            path,
            (buffer) => {
              this.assets.set(key, buffer);
              resolve(buffer);
            },
            undefined,
            reject
          );
          break;

        default:
          reject(new Error(`Unknown asset type: ${type}`));
      }
    });
  }

  /**
   * Dispose specific asset
   */
  public disposeAsset(path: string): void {
    const asset = this.assets.get(path);
    if (!asset) return;

    if (asset instanceof THREE.Object3D) {
      asset.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    }

    if (asset instanceof THREE.Texture) {
      asset.dispose();
    }

    this.assets.delete(path);
  }

  /**
   * Dispose all assets
   */
  public dispose(): void {
    this.assets.forEach((asset, key) => {
      this.disposeAsset(key);
    });
    this.assets.clear();
  }

  /**
   * Get loading progress info
   */
  public getLoadedCount(): number {
    return this.assets.size;
  }

}