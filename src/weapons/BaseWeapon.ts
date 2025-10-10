// src/weapons/BaseWeapon.ts
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { toast } from "sonner";
import { IWeapon, WeaponConfig } from "./IWeapon";
import { EffectsManager } from "../systems/EffectsManager";

export abstract class BaseWeapon implements IWeapon {
  public model: THREE.Group | null = null;
  public config: WeaponConfig;
  public ammo: number;
  public maxAmmo: number;
  public reserveAmmo: number = 0;

  protected lastShotTime = 0;
  private muzzleLight: THREE.PointLight;

  // Untuk animasi recoil
  private isRecoiling = false;
  private recoilTime = 0;

  // Posisi & Rotasi Awal Model
  private initialPosition: THREE.Vector3;
  private initialRotation = new THREE.Euler(0, 0, 0);
  private initialScale = new THREE.Vector3(0.008, 0.008, 0.008);

  constructor(config: WeaponConfig, maxAmmo: number) {
    this.config = config;
    this.maxAmmo = maxAmmo;
    this.ammo = maxAmmo;
    this.reserveAmmo = 0;

    this.initialPosition = config.gunPosition
      ? config.gunPosition.clone()
      : new THREE.Vector3(0.4, -0.3, -0.8);

    const muzzlePos = config.muzzlePosition
      ? config.muzzlePosition.clone()
      : new THREE.Vector3(0, 0, -5.5);

    this.muzzleLight = new THREE.PointLight(0xffee00, 0, 10);
    
  }

  public async load(camera?: THREE.Object3D): Promise<void> {  // Camera opsional
    const loader = new FBXLoader();
    const textureLoader = new THREE.TextureLoader();

    try {
      if (this.model == null) {
        const [fbx, colorTexture] = await Promise.all([
          loader.loadAsync(this.config.modelPath),
          textureLoader.loadAsync(this.config.texturePath),
        ]);

        colorTexture.colorSpace = THREE.SRGBColorSpace;

        this.model = fbx;
        this.model.traverse((child) => {
          if (child instanceof THREE.Mesh && (child.material instanceof THREE.MeshStandardMaterial || child.material instanceof THREE.MeshPhongMaterial)) {
            child.material.color.set(0xffffff);
            child.material.map = colorTexture;
            child.material.needsUpdate = true;
            child.castShadow = false;
          }
        });
      }

      this.model.position.copy(this.initialPosition);
      this.model.rotation.copy(this.initialRotation);
      this.model.scale.copy(this.initialScale);
      this.model.add(this.muzzleLight);

      if (camera) {  // Hanya jika camera disediakan (untuk held weapon)
        const muzzleLocal = this.config.muzzlePosition ? this.config.muzzlePosition.clone() : new THREE.Vector3(0, 0, -0.5);
        const muzzleWorld = this.config.gunPosition ? this.config.gunPosition.clone().add(muzzleLocal) : muzzleLocal.clone();
        camera.localToWorld(muzzleWorld);
        this.muzzleLight.position.copy(muzzleWorld);
        camera.add(this.model);
      }
    
    } catch (error) {
      console.error(`❌ Error loading FBX weapon ${this.config.name}:`, error);
      toast.error(`Failed to load FBX model for ${this.config.name}.`);
    }
  }

  // ... (sisa method sama seperti sebelumnya: update, fire, reload, dll.)
  public update(elapsedTime: number, deltaTime: number): void {
    if (!this.model) return;
    this.handleSway(elapsedTime);
    this.handleRecoil(deltaTime);
  }

  public abstract fire(
    camera: THREE.Camera,
    scene: THREE.Scene,
    effects: EffectsManager
  ): void;

  public reload(): void {
    let ammoChange = (this.maxAmmo - this.ammo)
    if (this.reserveAmmo == 0) {
      console.log(`${this.config.name} no reserve ammo to reload!`);
      return;
    } else if (this.reserveAmmo >= ammoChange) {
      this.reserveAmmo -= ammoChange;
      this.ammo += ammoChange;
    } else if (this.reserveAmmo < ammoChange) {
      this.ammo += this.reserveAmmo;
      this.reserveAmmo = 0;
    }
    console.log(`${this.config.name} reloaded. Clip: ${this.ammo}/${this.maxAmmo}, Reserve: ${this.reserveAmmo}`);
  }

  protected canShoot(): boolean {
    const now = performance.now();
    if (this.ammo <= 0) return false;
    return now - this.lastShotTime >= this.config.shootCooldown;
  }

  protected onFire(): void {
    this.lastShotTime = performance.now();
    this.ammo--;
    this.isRecoiling = true;
    this.recoilTime = 0;
    this.animateMuzzleFlash();
  }

  private handleSway(elapsedTime: number) {
    if (!this.model) return;
    const swayAmount = this.config.swayAmount;
    const swaySpeed = this.config.swaySpeed;
    this.model.position.y =
      this.initialPosition.y + Math.sin(elapsedTime * swaySpeed) * swayAmount;
    this.model.position.x =
      this.initialPosition.x + Math.cos(elapsedTime * swaySpeed * 0.5) * swayAmount;
  }

  private handleRecoil(deltaTime: number) {
    if (!this.model || !this.isRecoiling) return;

    this.recoilTime += deltaTime * 1000;
    const recoilProgress = Math.min(this.recoilTime / this.config.recoilDuration, 1.0);

    if (recoilProgress < 0.5) {
      this.model.rotation.x = -(this.initialRotation.x - this.config.recoilAmount * (recoilProgress * 2));
    } else {
      this.model.rotation.x = -(this.initialRotation.x - this.config.recoilAmount * (1 - (recoilProgress - 0.5) * 2));
    }

    if (recoilProgress >= 1.0) {
      this.isRecoiling = false;
      this.recoilTime = 0;
      this.model.rotation.x = this.initialRotation.x;
    }
  }

  private animateMuzzleFlash() {
    this.muzzleLight.intensity = 20;
    setTimeout(() => {
      this.muzzleLight.intensity = 0;
    }, 60);
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