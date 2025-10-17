import * as THREE from "three";

// Enhanced vertex shader for glowing trail with better visuals
const trailVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Enhanced fragment shader for glowing trail with gradient and pulse effect
const trailFragmentShader = `
  uniform float opacity;
  uniform vec3 color;
  uniform float time;
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    // Core glow with gradient
    float coreGlow = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
    
    // Edge glow with smooth falloff
    float edgeGlow = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x);
    
    // Vertical fade for cylindrical effect
    float verticalFade = 1.0 - smoothstep(0.0, 0.5, abs(vUv.y - 0.5));
    
    // Pulsing effect
    float pulse = sin(time * 20.0) * 0.1 + 0.9;
    
    // Combine effects
    float alpha = opacity * (coreGlow * 0.8 + edgeGlow * 0.4) * verticalFade * pulse;
    
    // Color variation - brighter core
    vec3 coreColor = color * 1.5;
    vec3 edgeColor = color * 0.8;
    vec3 finalColor = mix(edgeColor, coreColor, coreGlow);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// Enhanced vertex shader for impact particles
const impactVertexShader = `
  attribute vec3 velocity;
  attribute float size;
  attribute float lifetime;
  uniform float time;
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    float lifeProgress = time / lifetime;
    vAlpha = 1.0 - lifeProgress;
    
    // Apply gravity and drag
    vec3 newPosition = position + velocity * time + vec3(0.0, -2.0 * time * time, 0.0);
    vec3 newVelocity = velocity * (1.0 - time * 0.5);
    
    // Spark color variation based on velocity
    float speed = length(newVelocity);
    vColor = vec3(1.0, mix(0.3, 1.0, speed * 2.0), 0.0);
    
    gl_PointSize = size * vAlpha * (1.0 + speed * 2.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

// Enhanced fragment shader for impact particles with sparkle effect
const impactFragmentShader = `
  uniform sampler2D pointTexture;
  varying float vAlpha;
  varying vec3 vColor;
  
  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dist = length(uv);
    
    // Discard pixels outside circle
    if (dist > 0.5) discard;
    
    // Core sparkle with bright center
    float sparkle = 1.0 - smoothstep(0.3, 0.5, dist);
    
    // Glow effect around core
    float glow = 1.0 - smoothstep(0.1, 0.5, dist);
    
    // Combine effects
    float alpha = vAlpha * (sparkle * 0.9 + glow * 0.4);
    
    // Color intensity based on distance from center
    vec3 finalColor = vColor * (1.0 + sparkle * 2.0);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

export class EffectsManager {
  private scene: THREE.Scene;
  private time: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.animateTime();
  }

  private animateTime() {
    const updateTime = () => {
      this.time += 0.016;
      requestAnimationFrame(updateTime);
    };
    updateTime();
  }

  public createBulletTrail(start: THREE.Vector3, end: THREE.Vector3, color: number = 0x00ffff) {
    const length = start.distanceTo(end);
    
    // Use cylinder geometry for more volumetric trail
    const geometry = new THREE.CylinderGeometry(0.02, 0.02, length, 8, 1, true);
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(color) },
        opacity: { value: 0.9 },
        time: { value: 0 }
      },
      vertexShader: trailVertexShader,
      fragmentShader: trailFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const trail = new THREE.Mesh(geometry, material);
    
    // Position and orient the trail
    const midPoint = start.clone().lerp(end, 0.5);
    trail.position.copy(midPoint);
    
    // Align cylinder with the trajectory
    trail.lookAt(end);
    trail.rotateX(Math.PI / 2); // Rotate to align cylinder properly
    
    this.scene.add(trail);

    // Enhanced animation with multiple effects
    let opacity = 0.9;
    let scale = 1.0;
    let startTime = this.time;
    
    const animateTrail = () => {
      const elapsed = this.time - startTime;
      material.uniforms.time.value = elapsed * 10;
      
      // Fade out
      opacity = Math.max(0, 0.9 - (elapsed * 4.5));
      material.uniforms.opacity.value = opacity;
      
      // Expand slightly during fade
      scale = 1.0 + elapsed * 0.5;
      trail.scale.set(scale, 1, scale);
      
      if (opacity <= 0) {
        this.scene.remove(trail);
        geometry.dispose();
        material.dispose();
        return;
      }
      requestAnimationFrame(animateTrail);
    };
    animateTrail();

    return trail;
  }

  public createImpactEffect(position: THREE.Vector3, normal: THREE.Vector3, color: number = 0xff5500) {
    const particleCount = 16; // Increased particle count
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const lifetimes = new Float32Array(particleCount);

    const baseColor = new THREE.Color(color);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Start at impact point
      positions[i3] = 0;
      positions[i3 + 1] = 0;
      positions[i3 + 2] = 0;
      
      // Random velocity in hemisphere around normal with varied speeds
      const coneAngle = Math.PI / 4; // 45 degree cone
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * coneAngle;
      
      const speed = 0.05 + Math.random() * 0.1; // Varied speeds
      
      const randomDir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.abs(Math.sin(phi) * Math.sin(theta)), // Prefer upward direction
        Math.sin(phi) * Math.sin(theta)
      ).normalize();
      
      // Blend random direction with normal
      const finalDir = new THREE.Vector3()
        .addVectors(normal.clone().multiplyScalar(2.0), randomDir)
        .normalize()
        .multiplyScalar(speed);
      
      velocities[i3] = finalDir.x;
      velocities[i3 + 1] = finalDir.y;
      velocities[i3 + 2] = finalDir.z;
      
      // Random sizes and lifetimes
      sizes[i] = 2.0 + Math.random() * 4.0;
      lifetimes[i] = 0.3 + Math.random() * 0.4;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: this.createParticleTexture() },
        time: { value: 0 }
      },
      vertexShader: impactVertexShader,
      fragmentShader: impactFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    particles.position.copy(position);
    this.scene.add(particles);

    // Enhanced animation with physics
    let startTime = this.time;
    
    const animate = () => {
      const elapsed = this.time - startTime;
      material.uniforms.time.value = elapsed;
      
      if (elapsed >= 1.0) {
        this.scene.remove(particles);
        geometry.dispose();
        material.dispose();
        return;
      }
      requestAnimationFrame(animate);
    };
    animate();
  }

  private createParticleTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    
    const context = canvas.getContext('2d')!;
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 200, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 200, 100, 0.6)');
    gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  public createWeaponAura(position: THREE.Vector3): THREE.Mesh {
    const geometry = new THREE.RingGeometry(0.5, 0.7, 32);
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        color: { value: new THREE.Color(0x00ffff) },
        time: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float time;
        varying vec2 vUv;
        
        void main() {
          float pulse = sin(time * 3.0) * 0.5 + 0.5;
          float dist = length(vUv - vec2(0.5, 0.5));
          float circle = smoothstep(0.45, 0.5, dist) * smoothstep(0.55, 0.5, dist);
          float alpha = circle * (0.3 + pulse * 0.3);
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(position);
    this.scene.add(ring);

    const animate = () => {
      material.uniforms.time.value = this.time;
      requestAnimationFrame(animate);
    };
    animate();

    return ring;
  }
}