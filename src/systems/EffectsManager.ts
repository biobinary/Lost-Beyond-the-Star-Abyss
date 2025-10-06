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

  public createWeaponAura(position: THREE.Vector3): THREE.Mesh {
    
    const geometry = new THREE.RingGeometry(0.5, 0.7, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(position);
    this.scene.add(ring);

    let scale = 1;
    const animate = () => {
      scale = 1 + Math.sin(Date.now() * 0.003) * 0.2;
      ring.scale.set(scale, scale, scale);
      material.opacity = 0.4 + Math.sin(Date.now() * 0.005) * 0.2;
      requestAnimationFrame(animate);
    };
    animate();

    return ring;

  }

}