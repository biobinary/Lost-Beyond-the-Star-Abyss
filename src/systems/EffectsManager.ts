// src/systems/EffectsManager.ts
import * as THREE from "three";

export class EffectsManager {
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public createBulletTrail(start: THREE.Vector3, end: THREE.Vector3) {
    const material = new THREE.LineBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.8,
    });
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);

    setTimeout(() => {
      this.scene.remove(line);
      geometry.dispose();
      material.dispose();
    }, 100);
  }

  public createImpactEffect(position: THREE.Vector3, normal: THREE.Vector3) {
    const geometry = new THREE.CircleGeometry(0.1, 8);
    const material = new THREE.MeshBasicMaterial({
      color: 0xff00ff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    const impact = new THREE.Mesh(geometry, material);
    impact.position.copy(position);
    impact.lookAt(position.clone().add(normal));
    this.scene.add(impact);

    // Simple fade-out animation
    let opacity = 0.8;
    const fadeOut = setInterval(() => {
      opacity -= 0.1;
      material.opacity = opacity;
      if (opacity <= 0) {
        clearInterval(fadeOut);
        this.scene.remove(impact);
        geometry.dispose();
        material.dispose();
      }
    }, 50);
  }
}