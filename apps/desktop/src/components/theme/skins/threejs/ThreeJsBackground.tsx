import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const GOLD = '#C4A265';
const GOLD_LIGHT = '#D4B87A';
const GOLD_DARK = '#A68B4B';
const INK = '#1a1410';
const PARCHMENT = '#2a2318';

export default function ThreeJsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = new THREE.FogExp2(0x09090b, 0.008);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 28);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // ─── Warm ambient light ───
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const warmLight = new THREE.DirectionalLight(GOLD, 0.8);
    warmLight.position.set(5, 10, 5);
    scene.add(warmLight);

    const rimLight = new THREE.DirectionalLight(GOLD_LIGHT, 0.3);
    rimLight.position.set(-5, -2, -5);
    scene.add(rimLight);

    // ─── Parchment ground ring ───
    const ringGeom = new THREE.RingGeometry(6, 7.5, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: PARCHMENT,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const parchRing = new THREE.Mesh(ringGeom, ringMat);
    parchRing.position.z = -6;
    parchRing.rotation.x = -Math.PI / 3;
    scene.add(parchRing);

    // Second outer ring
    const outerRingGeom = new THREE.RingGeometry(8, 10, 64);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: PARCHMENT,
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const outerRing = new THREE.Mesh(outerRingGeom, outerRingMat);
    outerRing.position.z = -8;
    outerRing.rotation.x = -Math.PI / 3;
    outerRing.rotation.z = 0.5;
    scene.add(outerRing);

    // ─── Floating Quill ───
    const quillGroup = new THREE.Group();

    // Shaft — thin cylinder
    const shaftGeom = new THREE.CylinderGeometry(0.04, 0.06, 3.5, 8);
    const shaftMat = new THREE.MeshPhysicalMaterial({
      color: GOLD,
      metalness: 0.3,
      roughness: 0.5,
      emissive: GOLD,
      emissiveIntensity: 0.05,
    });
    const shaft = new THREE.Mesh(shaftGeom, shaftMat);
    shaft.position.y = 0.5;
    shaft.rotation.z = 0.15;
    shaft.rotation.x = 0.1;
    quillGroup.add(shaft);

    // Nib — cone at the bottom
    const nibGeom = new THREE.ConeGeometry(0.08, 0.4, 6);
    const nibMat = new THREE.MeshPhysicalMaterial({
      color: INK,
      metalness: 0.2,
      roughness: 0.8,
    });
    const nib = new THREE.Mesh(nibGeom, nibMat);
    nib.position.y = -1.3;
    nib.rotation.z = 0.15;
    nib.rotation.x = 0.1;
    quillGroup.add(nib);

    // Nib tip — small gold point
    const tipGeom = new THREE.ConeGeometry(0.02, 0.1, 4);
    const tipMat = new THREE.MeshPhysicalMaterial({
      color: GOLD_LIGHT,
      metalness: 0.5,
      roughness: 0.3,
    });
    const tip = new THREE.Mesh(tipGeom, tipMat);
    tip.position.y = -1.6;
    tip.rotation.z = 0.15;
    tip.rotation.x = 0.1;
    quillGroup.add(tip);

    // Feather — left vane (curved shape using tube)
    const leftFeatherPoints = [
      new THREE.Vector3(0, 0.8, 0),
      new THREE.Vector3(-0.3, 1.2, 0.05),
      new THREE.Vector3(-0.7, 1.8, 0.1),
      new THREE.Vector3(-0.9, 2.4, 0.05),
      new THREE.Vector3(-0.75, 3.0, -0.05),
      new THREE.Vector3(-0.4, 3.5, -0.1),
      new THREE.Vector3(0, 3.8, 0),
    ];
    const leftCurve = new THREE.CatmullRomCurve3(leftFeatherPoints);
    const tubeGeom = new THREE.TubeGeometry(leftCurve, 24, 0.04, 4, false);
    const featherMat = new THREE.MeshPhysicalMaterial({
      color: GOLD,
      metalness: 0.1,
      roughness: 0.4,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      emissive: GOLD,
      emissiveIntensity: 0.03,
    });
    const leftFeather = new THREE.Mesh(tubeGeom, featherMat);
    leftFeather.position.y = 0.5;
    leftFeather.rotation.z = 0.15;
    leftFeather.rotation.x = 0.1;
    quillGroup.add(leftFeather);

    // Feather — right vane
    const rightFeatherPoints = [
      new THREE.Vector3(0, 0.8, 0),
      new THREE.Vector3(0.3, 1.2, -0.05),
      new THREE.Vector3(0.7, 1.8, -0.1),
      new THREE.Vector3(0.9, 2.4, -0.05),
      new THREE.Vector3(0.75, 3.0, 0.05),
      new THREE.Vector3(0.4, 3.5, 0.1),
      new THREE.Vector3(0, 3.8, 0),
    ];
    const rightCurve = new THREE.CatmullRomCurve3(rightFeatherPoints);
    const rightTubeGeom = new THREE.TubeGeometry(rightCurve, 24, 0.04, 4, false);
    const rightFeather = new THREE.Mesh(rightTubeGeom, featherMat);
    rightFeather.position.y = 0.5;
    rightFeather.rotation.z = 0.15;
    rightFeather.rotation.x = 0.1;
    quillGroup.add(rightFeather);

    // Feather — center spine (slightly thicker)
    const spinePoints = [
      new THREE.Vector3(0, 0.6, 0),
      new THREE.Vector3(0, 1.5, 0),
      new THREE.Vector3(0, 2.8, 0),
      new THREE.Vector3(0, 3.8, 0),
    ];
    const spineCurve = new THREE.CatmullRomCurve3(spinePoints);
    const spineGeom = new THREE.TubeGeometry(spineCurve, 16, 0.025, 3, false);
    const spineMat = new THREE.MeshPhysicalMaterial({
      color: GOLD_DARK,
      metalness: 0.2,
      roughness: 0.5,
      transparent: true,
      opacity: 0.6,
    });
    const spine = new THREE.Mesh(spineGeom, spineMat);
    spine.position.y = 0.5;
    spine.rotation.z = 0.15;
    spine.rotation.x = 0.1;
    quillGroup.add(spine);

    // Subtle glow around quill
    const glowGeom = new THREE.SphereGeometry(0.4, 8, 8);
    const glowMat = new THREE.MeshBasicMaterial({
      color: GOLD,
      transparent: true,
      opacity: 0.06,
    });
    const glowSphere = new THREE.Mesh(glowGeom, glowMat);
    glowSphere.position.set(0, 2.5, 0);
    quillGroup.add(glowSphere);

    quillGroup.position.set(-3, 2, 0);
    quillGroup.scale.set(1.2, 1.2, 1.2);
    scene.add(quillGroup);

    // ─── Ink Drop Particles ───
    const particleCount = 1200;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const randoms = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount);

    const inkColor = new THREE.Color(GOLD);
    const inkColor2 = new THREE.Color(GOLD_LIGHT);
    const inkColor3 = new THREE.Color(GOLD_DARK);
    const darkColor = new THREE.Color(INK);

    for (let i = 0; i < particleCount; i++) {
      const radius = 3 + Math.random() * 25;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 20;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius - 3;

      sizes[i] = 0.03 + Math.random() * 0.12;
      velocities[i] = 0.1 + Math.random() * 0.3;
      randoms[i] = Math.random();

      const t = Math.random();
      const c = t < 0.4 ? inkColor : t < 0.7 ? inkColor2 : t < 0.9 ? inkColor3 : darkColor;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeom.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));
    particleGeom.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));

    const particleMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uMouse: { value: new THREE.Vector2(0, 0) },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute float aRandom;
        attribute float velocity;
        varying vec3 vColor;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform vec2 uMouse;

        void main() {
          vColor = color;
          vec3 pos = position;

          float t = uTime * velocity + aRandom * 6.28;
          float drift = sin(t * 0.5 + pos.y * 0.05) * 0.15;
          pos.x += drift;
          pos.z += cos(t * 0.3 + pos.x * 0.05) * 0.15;
          pos.y += sin(t * 0.2) * 0.1;

          // Gentle mouse influence
          pos.x += uMouse.x * 0.3;
          pos.y += uMouse.y * 0.2;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * uPixelRatio * (60.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;

        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.0, 0.5, d);
          alpha = pow(alpha, 1.5);
          float glow = exp(-d * 10.0);
          gl_FragColor = vec4(vColor, alpha * 0.5 + glow * 0.15);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeom, particleMat);
    scene.add(particles);

    // ─── Ink drizzle (falling ink drops) ───
    const dropCount = 30;
    const dropPositions = new Float32Array(dropCount * 3);
    const dropSpeeds = new Float32Array(dropCount);
    const dropSizes = new Float32Array(dropCount);

    for (let i = 0; i < dropCount; i++) {
      dropPositions[i * 3] = (Math.random() - 0.5) * 16;
      dropPositions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      dropPositions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 6;
      dropSpeeds[i] = 0.15 + Math.random() * 0.35;
      dropSizes[i] = 0.02 + Math.random() * 0.04;
    }

    const dropGeom = new THREE.BufferGeometry();
    dropGeom.setAttribute('position', new THREE.BufferAttribute(dropPositions, 3));

    const dropMat = new THREE.PointsMaterial({
      color: GOLD_LIGHT,
      size: 0.03,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const drops = new THREE.Points(dropGeom, dropMat);
    scene.add(drops);

    // ─── Parchment scroll (curved surface) ───
    const scrollGeom = new THREE.CylinderGeometry(4, 4, 0.3, 32, 1, true);
    const scrollMat = new THREE.MeshBasicMaterial({
      color: PARCHMENT,
      transparent: true,
      opacity: 0.04,
      side: THREE.DoubleSide,
      depthWrite: false,
      wireframe: false,
    });
    const scroll = new THREE.Mesh(scrollGeom, scrollMat);
    scroll.position.set(5, -3, -4);
    scroll.rotation.x = 0.3;
    scroll.rotation.y = -0.5;
    scroll.rotation.z = 0.1;
    scene.add(scroll);

    // ─── Wireframe calligraphy accents ───
    const accentPoints: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const x = Math.sin(t * Math.PI * 3) * 2;
      const y = (t - 0.5) * 8;
      accentPoints.push(new THREE.Vector3(x, y, 0));
    }
    const accentCurve = new THREE.CatmullRomCurve3(accentPoints);
    const accentTubeGeom = new THREE.TubeGeometry(accentCurve, 60, 0.015, 3, false);
    const accentMat = new THREE.MeshBasicMaterial({
      color: GOLD,
      transparent: true,
      opacity: 0.06,
      depthWrite: false,
    });
    const accentLine = new THREE.Mesh(accentTubeGeom, accentMat);
    accentLine.position.set(6, 0, -5);
    scene.add(accentLine);

    // ─── Mouse & Resize ───
    const handleMouseMove = (e: MouseEvent) => {
      targetMouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // ─── Animation Loop ───
    let animId: number;
    let clock = new THREE.Clock();

    function animate() {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth mouse
      mouseRef.current.x += (targetMouseRef.current.x - mouseRef.current.x) * 0.04;
      mouseRef.current.y += (targetMouseRef.current.y - mouseRef.current.y) * 0.04;

      // Update particles
      particleMat.uniforms.uTime.value = elapsed;
      particleMat.uniforms.uMouse.value.x = mouseRef.current.x * 0.5;
      particleMat.uniforms.uMouse.value.y = mouseRef.current.y * 0.5;

      particles.rotation.y += delta * 0.03;
      particles.rotation.x += delta * 0.008;

      // Quill animation — gentle floating and swaying
      quillGroup.position.x = -3 + mouseRef.current.x * 0.5 + Math.sin(elapsed * 0.3) * 0.3;
      quillGroup.position.y = 2 + mouseRef.current.y * 0.3 + Math.sin(elapsed * 0.4 + 1) * 0.4;
      quillGroup.rotation.z = 0.15 + Math.sin(elapsed * 0.2) * 0.03;
      quillGroup.rotation.x = 0.1 + Math.sin(elapsed * 0.25) * 0.02;

      // Ink drops falling animation
      const dropPos = drops.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < dropCount; i++) {
        dropPos[i * 3 + 1] -= dropSpeeds[i] * delta * 2;
        if (dropPos[i * 3 + 1] < -10) {
          dropPos[i * 3 + 1] = 10;
          dropPos[i * 3] = (Math.random() - 0.5) * 16;
          dropPos[i * 3 + 2] = (Math.random() - 0.5) * 8 - 6;
        }
      }
      drops.geometry.attributes.position.needsUpdate = true;

      // Parchment rings subtle rotation
      parchRing.rotation.z += delta * 0.02;
      outerRing.rotation.z -= delta * 0.015;

      // Camera sway
      camera.position.x = mouseRef.current.x * 0.2;
      camera.position.y = mouseRef.current.y * 0.15;
      camera.lookAt(0, 0, 0);

      // Scroll rotation
      scroll.rotation.y += delta * 0.1;

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      particleGeom.dispose();
      particleMat.dispose();
      dropGeom.dispose();
      dropMat.dispose();
      shaftGeom.dispose();
      shaftMat.dispose();
      nibGeom.dispose();
      nibMat.dispose();
      featherMat.dispose();
      spineMat.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 1,
      }}
    />
  );
}
