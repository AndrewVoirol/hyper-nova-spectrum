import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

interface SceneProps {
  isWarping: boolean;
  rotationSpeed: number;
  spectrumShift: number;
  entropy: number;
  twist: number;
  starSize: number;
  bloomStrength: number;
  singularityDepth: number;
  onReady?: () => void;
}

const Scene: React.FC<SceneProps> = ({ 
  isWarping, 
  rotationSpeed, 
  spectrumShift, 
  entropy, 
  twist, 
  starSize, 
  bloomStrength, 
  singularityDepth,
  onReady 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Store props in a ref to access them in the animation loop without triggering re-renders/re-init
  const propsRef = useRef({ isWarping, rotationSpeed, spectrumShift, entropy, twist, starSize, bloomStrength, singularityDepth });
  
  // Mouse tracking for steering
  const mouseRef = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    propsRef.current = { isWarping, rotationSpeed, spectrumShift, entropy, twist, starSize, bloomStrength, singularityDepth };
  }, [isWarping, rotationSpeed, spectrumShift, entropy, twist, starSize, bloomStrength, singularityDepth]);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- MOUSE EVENTS FOR STEERING ---
    const onMouseMove = (event: MouseEvent) => {
      // Normalize mouse -1 to 1
      mouseRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.002);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 20, 50);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ReinhardToneMapping;
    // Clear any existing canvases from React StrictMode double-mount
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 200;
    controls.minDistance = 10;
    controls.enablePan = false;

    // Camera Group for Shake & Bank (Wrapper)
    const cameraGroup = new THREE.Group();
    scene.add(cameraGroup);
    cameraGroup.add(camera);

    // --- DESTINATION SINGULARITY ---
    const destinationGeo = new THREE.SphereGeometry(10, 32, 32);
    const destinationMat = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uWarp: { value: 0 },
        uDestinationPosition: { value: 0 }
      },
      vertexShader: `
        uniform float uDestinationPosition;
        uniform float uTime;
        varying vec2 vUv;
        varying float vPulse;
        
        void main() {
          vUv = uv;
          vec3 pos = position;
          
          // Dynamic Pulse
          // Base heartbeat
          float beat = sin(uTime * 4.0) * 0.5 + 0.5;
          // Jitter/Flutter increases with depth
          float flutter = sin(uTime * 20.0) * 0.05 * uDestinationPosition;
          
          // Calculate pulse intensity
          float pulse = beat * (0.1 + uDestinationPosition * 0.5) + flutter;
          vPulse = pulse;
          
          // Apply scale based on pulse
          pos *= 1.0 + pulse;
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          
          // Movement logic: Bring closer based on uniform
          // uDestinationPosition 0 -> -800 (Far)
          // uDestinationPosition 1 -> -200 (Close)
          mvPosition.z += uDestinationPosition * 600.0;
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uWarp;
        uniform float uDestinationPosition;
        varying vec2 vUv;
        varying float vPulse;

        void main() {
          // Distance from center of sprite
          float d = distance(vUv, vec2(0.5));
          
          // Soft circular mask to fade edges
          float mask = 1.0 - smoothstep(0.4, 0.5, d);
          if (mask < 0.01) discard;

          // 1. Core (Hot White)
          // Radius pulses slightly with vertex
          float coreRadius = 0.1 + (vPulse * 0.02 * uDestinationPosition);
          float core = smoothstep(coreRadius + 0.05, coreRadius, d);
          
          // 2. Inner Glow (Amber -> Red Shift)
          float glow = 0.15 / (d + 0.05);
          glow *= (0.5 + uDestinationPosition); // Brighter when closer
          
          // 3. Outer Ring (Cyan -> Purple Ripple)
          // Visible mainly when deep in singularity
          float ring = smoothstep(0.35, 0.3, d) * smoothstep(0.2, 0.25, d);
          float ripple = sin(d * 40.0 - uTime * 5.0) * 0.5 + 0.5;
          ring *= ripple * uDestinationPosition * 2.0;

          // Colors
          vec3 cCore = vec3(1.0);
          
          // Glow color shifts from Amber to Red/Dark Energy based on depth
          vec3 cGlowStart = vec3(1.0, 0.7, 0.3);
          vec3 cGlowEnd = vec3(1.0, 0.1, 0.1);
          vec3 cGlow = mix(cGlowStart, cGlowEnd, uDestinationPosition);
          
          // Ring color
          vec3 cRing = vec3(0.4, 0.6, 1.0);

          // Composite
          vec3 finalColor = cCore * core;
          finalColor += cGlow * glow;
          finalColor += cRing * ring;
          
          // Overall Alpha
          // Only visible during warp (uWarp > 0)
          float alpha = smoothstep(0.0, 0.1, uWarp);
          alpha *= mask;
          // Clamp brightness for alpha to avoid super saturation artifacting in add blend
          alpha *= min(1.0, (core + glow + ring));

          gl_FragColor = vec4(finalColor, alpha);
        }
      `
    });
    const destinationMesh = new THREE.Mesh(destinationGeo, destinationMat);
    destinationMesh.position.set(0, 0, -800); 
    scene.add(destinationMesh);


    // --- PART 1: GALAXY GENERATION ---
    const galaxyParams = {
      count: 100000,
      radius: 45,
      branches: 3,
      insideColor: '#ffaa60',
      outsideColor: '#1b3984',
      randomness: 0.55,
      randomnessPower: 3,
      spin: 1,
    };

    const galaxyUniforms = {
      uTime: { value: 0 },
      uSize: { value: 30.0 * renderer.getPixelRatio() },
      uColorOffset: { value: 0 },
      uWarpFactor: { value: 0 },
      uEntropy: { value: 0 },
      uTwist: { value: 0 }
    };

    let galaxyGeometry: THREE.BufferGeometry | null = null;
    let galaxyMaterial: THREE.ShaderMaterial | null = null;
    let galaxyPoints: THREE.Points | null = null;

    const generateGalaxy = () => {
      if (galaxyPoints !== null) {
        galaxyGeometry?.dispose();
        galaxyMaterial?.dispose();
        scene.remove(galaxyPoints);
      }

      galaxyGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(galaxyParams.count * 3);
      const randomPositions = new Float32Array(galaxyParams.count * 3);
      const randomness = new Float32Array(galaxyParams.count * 3);
      const colors = new Float32Array(galaxyParams.count * 3);
      const scales = new Float32Array(galaxyParams.count * 1);

      const colorInside = new THREE.Color(galaxyParams.insideColor);
      const colorOutside = new THREE.Color(galaxyParams.outsideColor);

      for (let i = 0; i < galaxyParams.count; i++) {
        const i3 = i * 3;
        const radius = Math.random() * galaxyParams.radius;
        const spinAngle = radius * galaxyParams.spin;
        const branchAngle = (i % galaxyParams.branches) / galaxyParams.branches * Math.PI * 2;

        const randomX = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius;
        const randomY = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius;
        const randomZ = Math.pow(Math.random(), galaxyParams.randomnessPower) * (Math.random() < 0.5 ? 1 : -1) * galaxyParams.randomness * radius;

        positions[i3] = Math.cos(branchAngle + spinAngle) * radius + randomX;
        positions[i3 + 1] = randomY;
        positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

        const r = Math.cbrt(Math.random()) * galaxyParams.radius * 1.5;
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        
        randomPositions[i3] = r * Math.sin(phi) * Math.cos(theta);
        randomPositions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        randomPositions[i3 + 2] = r * Math.cos(phi);

        randomness[i3] = randomX;
        randomness[i3 + 1] = randomY;
        randomness[i3 + 2] = randomZ;

        const mixedColor = colorInside.clone();
        mixedColor.lerp(colorOutside, radius / galaxyParams.radius);
        
        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;

        scales[i] = Math.random();
      }

      galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      galaxyGeometry.setAttribute('aRandomPosition', new THREE.BufferAttribute(randomPositions, 3));
      galaxyGeometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3));
      galaxyGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      galaxyGeometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

      galaxyMaterial = new THREE.ShaderMaterial({
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        uniforms: galaxyUniforms,
        vertexShader: `
          uniform float uTime;
          uniform float uSize;
          uniform float uWarpFactor;
          uniform float uColorOffset;
          uniform float uEntropy;
          uniform float uTwist;
          
          attribute float aScale;
          attribute vec3 aRandomness;
          attribute vec3 aRandomPosition;
          
          varying vec3 vColor;

          vec3 hueShift(vec3 color, float hue) {
              const vec3 k = vec3(0.57735, 0.57735, 0.57735);
              float cosAngle = cos(hue);
              return vec3(color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle));
          }

          void main() {
              vec3 mixedPosition = mix(position, aRandomPosition, uEntropy);
              
              // Basic Twist logic
              float angle = atan(mixedPosition.x, mixedPosition.z);
              float distanceToCenter = length(mixedPosition.xz);
              float angleOffset = (1.0 / distanceToCenter) * uTime * 0.2;
              angle += angleOffset + (distanceToCenter * uTwist * 0.5);

              // Apply twist to base position
              vec3 pos = mixedPosition;
              pos.x = cos(angle) * distanceToCenter;
              pos.z = sin(angle) * distanceToCenter;

              // WARP TRANSITION: REDSHIFT JUMP
              // Instead of morphing to cylinder, we stretch and accelerate past camera.
              float warpEase = pow(uWarpFactor, 4.0); // Sharp acceleration curve
              
              // Move towards/past camera (Camera is at z=50)
              // Increased clearance speed to remove stars faster
              pos.z += warpEase * 500.0; 
              
              // Expansion effect as they fly by
              pos.xy *= (1.0 + warpEase * 3.0);

              vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
              vec4 viewPosition = viewMatrix * modelPosition;
              gl_Position = projectionMatrix * viewPosition;

              gl_PointSize = uSize * aScale;
              // Attenuate size based on distance
              gl_PointSize *= (1.0 / -viewPosition.z);

              // Colors
              vec3 finalColor = hueShift(color, uColorOffset + (uWarpFactor * 0.5));
              
              // Brightness boost (subtle)
              finalColor += vec3(uWarpFactor * 0.3); 
              
              // Fade out as they pass camera
              float dist = -viewPosition.z;
              float alpha = smoothstep(5.0, 30.0, dist); 
              
              // Aggressive fade out during warp to swap with tunnel clearly
              // Fade out between 0.1 and 0.5 warp factor
              alpha *= (1.0 - smoothstep(0.1, 0.6, uWarpFactor));

              vColor = finalColor * alpha;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          void main() {
              // Apply point texture soft circle
              vec2 cxy = 2.0 * gl_PointCoord - 1.0;
              float r = dot(cxy, cxy);
              if (r > 1.0) discard;
              
              // Soft edge
              float alpha = 1.0 - smoothstep(0.8, 1.0, r);
              
              gl_FragColor = vec4(vColor, alpha);
          }
        `
      });

      galaxyPoints = new THREE.Points(galaxyGeometry, galaxyMaterial);
      scene.add(galaxyPoints);
    };

    generateGalaxy();

    // --- PART 2: WARP TUNNEL ---
    const warpGeo = new THREE.BufferGeometry();
    const wPos = [];
    const wType = []; 
    const wRand = [];
    
    const tunnelCount = 4000; // Increased density
    const tLen = 1000;
    const tRad = 60;

    for(let i=0; i<tunnelCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const z = (Math.random() - 0.5) * tLen;
      const r = tRad + (Math.random() - 0.5) * 30; // Thickness

      const x = Math.cos(theta) * r;
      const y = Math.sin(theta) * r;

      // Segment: Head
      wPos.push(x, y, z);
      wType.push(0.0);
      wRand.push(Math.random());

      // Segment: Tail
      wPos.push(x, y, z);
      wType.push(1.0);
      wRand.push(Math.random());
    }

    warpGeo.setAttribute('position', new THREE.Float32BufferAttribute(wPos, 3));
    warpGeo.setAttribute('aType', new THREE.Float32BufferAttribute(wType, 1));
    warpGeo.setAttribute('aRandom', new THREE.Float32BufferAttribute(wRand, 1));

    const warpMat = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uWarp: { value: 0 },
        uColor: { value: new THREE.Color(0x88ccff) }, // Changed to Cyan/Blue tint
        uMouse: { value: new THREE.Vector2(0, 0) }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uWarp;
        uniform vec2 uMouse;
        attribute float aType; 
        attribute float aRandom;
        
        varying float vAlpha;
        varying vec2 vUv;
        varying float vRandom;
        varying float vLinePos;

        void main() {
            vRandom = aRandom;
            vLinePos = aType;
            
            vec3 pos = position;
            
            // Tunnel flow
            // Start further away so we don't see the start plane clipping
            float speed = 50.0 + (uWarp * 800.0);
            float travel = uTime * speed + (aRandom * 1000.0);
            float zRange = 1000.0;
            
            pos.z = mod(travel, zRange) - (zRange * 0.5);

            // Tail stretch
            if (aType > 0.5) {
                pos.z -= (10.0 + uWarp * 400.0);
            }

            // Spiral Twist effect
            float spiral = pos.z * 0.003 * uWarp;
            float c = cos(spiral);
            float s = sin(spiral);
            float rx = pos.x * c - pos.y * s;
            float ry = pos.x * s + pos.y * c;
            pos.x = rx;
            pos.y = ry;
            
            // --- DYNAMIC MOUSE REACTIVITY ---
            // Calculate steering intensity
            float steerIntensity = length(uMouse);
            
            // 1. Vibration/Turbulence on hard turns
            float vibration = sin(uTime * 60.0 + pos.z * 0.2) * steerIntensity * 2.0 * uWarp;
            pos.x += vibration * (aRandom - 0.5);
            pos.y += vibration * (aRandom - 0.5);

            // 2. Curve Bending (simulate inertia/G-force)
            float bendFactor = uWarp * 0.05;
            float distFactor = (abs(pos.z) + 200.0);
            pos.x -= uMouse.x * distFactor * bendFactor;
            pos.y -= uMouse.y * distFactor * bendFactor;
            
            // Expansion
            pos.xy *= (1.0 + uWarp * 0.5);

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;

            // Pass UV for Chromatic Aberration
            vec2 ndc = gl_Position.xy / gl_Position.w;
            vUv = ndc * 0.5 + 0.5;

            // Alpha Fade Logic for Transition
            // Delay the appearance of the tunnel until the galaxy has started zooming
            float entryFade = smoothstep(0.2, 0.8, uWarp);
            
            float dist = abs(pos.z);
            vAlpha = smoothstep(0.0, 100.0, dist); // Fade close
            vAlpha *= (1.0 - smoothstep(300.0, 500.0, dist)); // Fade far
            
            vAlpha *= entryFade;
            vAlpha *= 0.4; // Reduced overall opacity to prevent whiteout
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uWarp;
        uniform float uTime;
        uniform vec2 uMouse;
        
        varying float vAlpha;
        varying vec2 vUv;
        varying float vRandom;
        varying float vLinePos;

        void main() {
            // Center masking to fix whiteout at the singularity
            // Create a hole in the middle where lines converge
            float centerDist = distance(vUv, vec2(0.5));
            float voidRadius = 0.02 + (0.1 * uWarp); // Hole gets bigger at speed
            float centerMask = smoothstep(voidRadius, voidRadius + 0.15, centerDist);
            
            // Chromatic Aberration
            float d = distance(vUv, vec2(0.5));
            float offset = d * uWarp * 0.05;
            
            vec4 col = vec4(uColor, vAlpha);
            
            col.r += offset;
            col.b -= offset;

            // Flicker
            float flicker = sin(uTime * 40.0 + vRandom * 100.0) * 0.5 + 0.5;
            col.a *= (0.5 + 0.5 * flicker);

            // Dynamic Reactivity: Brighten on turns
            float steerIntensity = length(uMouse);
            float dynamicGlow = 1.0 + (steerIntensity * uWarp * 2.0);
            col.rgb *= dynamicGlow;
            
            // Shift color based on horizontal steer (Redshift/Blueshift concept)
            col.r += uMouse.x * uWarp * 0.3;
            col.b -= uMouse.x * uWarp * 0.3;

            // Gradient trail
            col.a *= (1.0 - vLinePos);
            
            // Apply center mask
            col.a *= centerMask;

            gl_FragColor = col;
        }
      `
    });

    const warpLines = new THREE.LineSegments(warpGeo, warpMat);
    scene.add(warpLines);


    // --- POST PROCESS ---
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
    const outputPass = new OutputPass();
    
    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composer.addPass(outputPass);


    // --- ANIMATION ---
    const clock = new THREE.Clock();
    let warpValue = 0;
    let cameraVelX = 0;
    let cameraVelY = 0;
    let cameraRoll = 0;
    let firstFrame = true;

    const animate = () => {
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const props = propsRef.current;

      // Warp Transition
      const targetWarp = props.isWarping ? 1.0 : 0.0;
      warpValue += (targetWarp - warpValue) * 0.02;

      // Controls Logic
      if (props.isWarping) {
        controls.enabled = false;

        // Mouse Steering
        const tx = mouseRef.current.x * 40;
        const ty = mouseRef.current.y * 30;
        
        cameraVelX += (tx - cameraGroup.position.x) * 0.05;
        cameraVelY += (ty - cameraGroup.position.y) * 0.05;
        
        cameraVelX *= 0.9;
        cameraVelY *= 0.9;

        cameraGroup.position.x += cameraVelX * delta * 60;
        cameraGroup.position.y += cameraVelY * delta * 60;

        // Bank
        cameraRoll += (-cameraVelX * 0.005 - cameraRoll) * 0.1;
        camera.rotation.z = cameraRoll;
        
      } else {
        // Return to Idle
        controls.enabled = true;
        controls.update();
        
        cameraGroup.position.x += (0 - cameraGroup.position.x) * 0.05;
        cameraGroup.position.y += (0 - cameraGroup.position.y) * 0.05;
        camera.rotation.z += (0 - camera.rotation.z) * 0.05;
      }

      // Update Shader Uniforms
      galaxyUniforms.uTime.value = elapsed;
      galaxyUniforms.uWarpFactor.value = warpValue;
      galaxyUniforms.uColorOffset.value = props.spectrumShift * Math.PI * 2;
      galaxyUniforms.uEntropy.value = props.entropy;
      galaxyUniforms.uTwist.value = props.twist;
      galaxyUniforms.uSize.value = 30.0 * renderer.getPixelRatio() * props.starSize;

      warpMat.uniforms.uTime.value = elapsed;
      warpMat.uniforms.uWarp.value = warpValue;
      warpMat.uniforms.uMouse.value.copy(mouseRef.current); // Update Mouse Uniform
      
      destinationMat.uniforms.uTime.value = elapsed;
      destinationMat.uniforms.uWarp.value = warpValue;
      destinationMat.uniforms.uDestinationPosition.value = props.singularityDepth;

      // Bloom - capped brightness during warp to prevent whiteout
      bloomPass.strength = props.bloomStrength + (warpValue * 0.2);

      // Warp Shake
      if (warpValue > 0.01) {
         const shake = warpValue * 0.2;
         camera.position.x = (Math.random() - 0.5) * shake;
         camera.position.y = 20 + (Math.random() - 0.5) * shake;
         camera.position.z = 50 + (Math.random() - 0.5) * shake;
         
         camera.fov = 75 + (warpValue * 30);
      } else {
         camera.fov = 75;
      }
      camera.updateProjectionMatrix();

      composer.render();

      if (firstFrame) {
        firstFrame = false;
        onReady?.();
      }

      animationId = requestAnimationFrame(animate);
    };

    let animationId = requestAnimationFrame(animate);

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationId);
      controls.dispose();
      renderer.dispose();
      composer.dispose();
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.firstChild);
        }
      }
      galaxyGeometry?.dispose();
      galaxyMaterial?.dispose();
      warpGeo.dispose();
      warpMat.dispose();
      destinationGeo.dispose();
      destinationMat.dispose();
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default Scene;