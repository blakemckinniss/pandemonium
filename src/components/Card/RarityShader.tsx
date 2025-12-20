import { useRef, useEffect, memo } from 'react'
import * as THREE from 'three'
import type { Element } from '../../types'

interface RarityShaderProps {
  rarity: 'legendary' | 'mythic' | 'ancient'
  element?: Element
  width: number
  height: number
  mouseX?: number // 0-1 normalized mouse X position
  mouseY?: number // 0-1 normalized mouse Y position
  isHovered?: boolean
}

// Element hue mapping (OKLCH hue values)
const ELEMENT_HUE: Record<Element, number> = {
  physical: 250,
  fire: 35,
  ice: 220,
  lightning: 95,
  void: 310,
}

// Vertex shader - simple quad
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Fragment shader - enhanced holographic effects
const fragmentShader = `
  uniform float uTime;
  uniform float uRarityLevel; // 1=legendary, 2=mythic, 3=ancient
  uniform float uElementHue;
  uniform vec2 uResolution;
  uniform vec2 uMouse; // 0-1 normalized mouse position
  uniform float uHovered; // 0 or 1

  varying vec2 vUv;

  #define PI 3.14159265359
  #define TAU 6.28318530718

  // HSL to RGB conversion
  vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
  }

  // High-quality hash
  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  // Value noise
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  // Fractal Brownian Motion
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  // Voronoi for crystalline effects
  vec2 voronoi(vec2 p) {
    vec2 n = floor(p);
    vec2 f = fract(p);
    float minDist = 8.0;
    vec2 minPoint = vec2(0.0);
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j));
        vec2 o = vec2(hash(n + g), hash(n + g + vec2(57.0, 113.0)));
        vec2 r = g + o - f;
        float d = dot(r, r);
        if (d < minDist) {
          minDist = d;
          minPoint = r;
        }
      }
    }
    return vec2(sqrt(minDist), length(minPoint));
  }

  // Scan line effect
  float scanLine(vec2 uv, float time, float count, float speed) {
    float scan = sin((uv.y + time * speed) * count * PI);
    return smoothstep(0.3, 1.0, scan);
  }

  // Chromatic aberration offset
  vec3 chromaticAberration(vec2 uv, float amount) {
    vec2 center = uv - 0.5;
    float dist = length(center);
    vec2 dir = normalize(center + 0.001);
    float offset = amount * dist * dist;
    return vec3(
      hsl2rgb(vec3(fract(uElementHue / 360.0 - 0.05), 0.8, 0.6)).r,
      hsl2rgb(vec3(fract(uElementHue / 360.0), 0.8, 0.6)).g,
      hsl2rgb(vec3(fract(uElementHue / 360.0 + 0.05), 0.8, 0.6)).b
    );
  }

  // Aurora effect
  vec3 aurora(vec2 uv, float time) {
    float wave1 = sin(uv.x * 3.0 + time * 0.5) * 0.5;
    float wave2 = sin(uv.x * 5.0 - time * 0.3) * 0.3;
    float wave3 = sin(uv.x * 8.0 + time * 0.7) * 0.2;
    float combined = wave1 + wave2 + wave3;

    float intensity = smoothstep(0.0, 0.3, uv.y + combined * 0.2) *
                     smoothstep(1.0, 0.5, uv.y + combined * 0.2);

    vec3 col1 = hsl2rgb(vec3(fract(uElementHue / 360.0), 0.9, 0.6));
    vec3 col2 = hsl2rgb(vec3(fract(uElementHue / 360.0 + 0.15), 0.9, 0.7));
    vec3 col3 = hsl2rgb(vec3(fract(uElementHue / 360.0 + 0.3), 0.8, 0.8));

    float t = fract(time * 0.1 + uv.x * 0.5);
    vec3 color = mix(col1, col2, smoothstep(0.0, 0.5, t));
    color = mix(color, col3, smoothstep(0.5, 1.0, t));

    return color * intensity * 0.5;
  }

  // Nebula clouds
  vec3 nebula(vec2 uv, float time) {
    vec2 p = uv * 3.0;
    float n1 = fbm(p + time * 0.1);
    float n2 = fbm(p * 2.0 - time * 0.15 + vec2(100.0));
    float n3 = fbm(p * 0.5 + time * 0.05 + vec2(50.0));

    vec3 col1 = vec3(0.4, 0.1, 0.6); // Deep purple
    vec3 col2 = vec3(0.1, 0.3, 0.8); // Blue
    vec3 col3 = vec3(0.8, 0.2, 0.4); // Pink

    vec3 color = mix(col1, col2, n1);
    color = mix(color, col3, n2 * 0.5);
    color *= 0.3 + n3 * 0.4;

    return color;
  }

  // Star field
  float stars(vec2 uv, float time) {
    vec2 p = uv * 50.0;
    float star = hash(floor(p));
    vec2 f = fract(p) - 0.5;
    float d = length(f);

    // Twinkling
    float twinkle = sin(time * (3.0 + star * 5.0) + star * TAU) * 0.5 + 0.5;

    // Only show bright stars
    float bright = step(0.97, star);
    float glow = bright * smoothstep(0.3, 0.0, d) * twinkle;

    return glow;
  }

  // Dimensional rift effect
  float dimensionalRift(vec2 uv, float time) {
    vec2 center = vec2(0.5);
    vec2 toCenter = uv - center;
    float angle = atan(toCenter.y, toCenter.x);
    float dist = length(toCenter);

    // Spiral distortion
    float spiral = sin(angle * 5.0 + dist * 10.0 - time * 2.0);
    spiral = smoothstep(0.0, 1.0, spiral);

    // Radial waves
    float wave = sin(dist * 30.0 - time * 4.0);
    wave = smoothstep(0.5, 1.0, wave);

    return (spiral + wave * 0.5) * smoothstep(0.5, 0.1, dist);
  }

  // Lens flare
  vec3 lensFlare(vec2 uv, float time) {
    vec2 flarePos = vec2(
      0.3 + sin(time * 0.5) * 0.2,
      0.3 + cos(time * 0.7) * 0.2
    );

    float d = length(uv - flarePos);

    // Main flare
    float flare = smoothstep(0.15, 0.0, d);

    // Halo
    float halo = smoothstep(0.25, 0.2, d) * smoothstep(0.15, 0.2, d);

    // Streaks
    vec2 dir = uv - flarePos;
    float angle = atan(dir.y, dir.x);
    float streaks = pow(abs(sin(angle * 6.0)), 20.0);
    streaks *= smoothstep(0.3, 0.0, d);

    vec3 color = vec3(1.0, 0.9, 0.7) * flare;
    color += vec3(0.8, 0.9, 1.0) * halo * 0.5;
    color += vec3(1.0, 0.95, 0.9) * streaks * 0.3;

    return color;
  }

  void main() {
    vec2 uv = vUv;
    float time = uTime;

    // Mouse-reactive parallax offset
    vec2 mouseOffset = (uMouse - 0.5) * 2.0; // -1 to 1
    float hoverStrength = uHovered * 0.15 * uRarityLevel; // Stronger for higher rarities

    // Parallax-shifted UV for depth layers
    vec2 parallaxUv = uv + mouseOffset * hoverStrength * 0.1;

    // Tilt-based lighting (simulates 3D surface reflection)
    float tiltLight = 1.0 + dot(mouseOffset, vec2(0.3, 0.5)) * uHovered * 0.3;

    // Hot spot that follows mouse (like light reflecting off foil)
    vec2 hotSpotPos = uMouse;
    float hotSpotDist = length(uv - hotSpotPos);
    float hotSpot = smoothstep(0.4, 0.0, hotSpotDist) * uHovered;

    // Border detection
    float borderDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    float borderWidth = 0.12 + uRarityLevel * 0.04;
    float edgeMask = 1.0 - smoothstep(0.0, borderWidth, borderDist);
    float innerMask = smoothstep(0.0, borderWidth * 0.5, borderDist);

    // Element base hue
    float baseHue = uElementHue / 360.0;

    // Initialize color
    vec3 finalColor = vec3(0.0);
    float alpha = 0.0;

    // ===================
    // LEGENDARY (Level 1)
    // ===================

    // Rainbow holographic sweep (uses parallax UV for depth)
    float sweep = fract(parallaxUv.x * 0.5 + parallaxUv.y * 0.3 + time * 0.15);
    // Mouse-reactive hue shift
    float mouseHueShift = dot(mouseOffset, vec2(0.1, 0.05)) * uHovered;
    vec3 holoColor = hsl2rgb(vec3(fract(baseHue + sweep * 0.4 + mouseHueShift), 0.85, 0.65));

    // Chromatic aberration at edges
    float caStrength = edgeMask * 0.15;
    vec3 caColor = chromaticAberration(uv, caStrength);
    holoColor = mix(holoColor, holoColor * caColor, edgeMask * 0.5);

    // Scan lines
    float scan = scanLine(uv, time, 40.0, 0.3);
    holoColor += vec3(1.0) * scan * edgeMask * 0.15;

    // Diagonal sweep highlight
    float diagSweep = sin((uv.x + uv.y) * 8.0 - time * 2.0);
    diagSweep = smoothstep(0.7, 1.0, diagSweep);
    holoColor += vec3(1.0, 0.95, 0.9) * diagSweep * edgeMask * 0.4;

    // Shimmer noise
    float shimmer = fbm(uv * 8.0 + time * 0.5);
    holoColor += shimmer * edgeMask * 0.2;

    finalColor = holoColor;
    alpha = edgeMask * 0.7;

    // ===================
    // MYTHIC (Level 2+)
    // ===================
    if (uRarityLevel >= 2.0) {
      // Aurora waves
      vec3 auroraCol = aurora(uv, time);
      finalColor += auroraCol * edgeMask;

      // Refraction distortion
      vec2 distortedUv = uv;
      float distortion = fbm(uv * 4.0 + time * 0.3) * 0.03;
      distortedUv += vec2(distortion);

      // Crystalline voronoi pattern
      vec2 vor = voronoi(distortedUv * 6.0 + time * 0.2);
      float crystal = smoothstep(0.0, 0.3, vor.x);
      vec3 crystalColor = hsl2rgb(vec3(fract(baseHue + vor.y * 0.2), 0.9, 0.7));
      finalColor = mix(finalColor, crystalColor, crystal * edgeMask * 0.4);

      // Lens flare
      vec3 flare = lensFlare(uv, time);
      finalColor += flare * edgeMask * 0.6;

      // Enhanced prismatic effect
      float prism = sin(uv.x * 25.0 + time * 3.5) * sin(uv.y * 25.0 + time * 2.5);
      prism = pow(max(0.0, prism), 3.0);
      vec3 prismColor = hsl2rgb(vec3(fract(time * 0.1 + uv.x), 1.0, 0.75));
      finalColor += prismColor * prism * edgeMask * 0.5;

      // Increase alpha
      alpha = min(0.85, alpha + 0.1);
    }

    // ===================
    // ANCIENT (Level 3)
    // ===================
    if (uRarityLevel >= 3.0) {
      // Cosmic nebula background
      vec3 nebulaCol = nebula(uv, time);
      finalColor = mix(finalColor, nebulaCol + finalColor, innerMask * 0.3);

      // Star field
      float starField = stars(uv, time);
      starField += stars(uv * 1.5 + vec2(100.0), time * 1.2) * 0.7;
      starField += stars(uv * 2.0 + vec2(200.0), time * 0.8) * 0.5;
      finalColor += vec3(1.0, 0.95, 0.9) * starField * (edgeMask + innerMask * 0.3);

      // Dimensional rift
      float rift = dimensionalRift(uv, time);
      vec3 riftColor = hsl2rgb(vec3(fract(baseHue + 0.5), 1.0, 0.8));
      finalColor += riftColor * rift * 0.3;

      // Void darkness pulsing from center
      float voidPulse = sin(time * 1.5) * 0.5 + 0.5;
      float voidMask = (1.0 - edgeMask) * 0.25 * voidPulse;
      finalColor = mix(finalColor, vec3(0.05, 0.0, 0.1), voidMask);

      // Energy crackling at edges
      float crack = fbm(uv * 20.0 + time * 2.0);
      crack = step(0.7, crack);
      vec3 crackColor = vec3(1.0, 0.8, 1.0);
      finalColor += crackColor * crack * edgeMask * 0.6;

      // Outer reality distortion ring
      float ringDist = abs(borderDist - borderWidth * 0.7);
      float ring = smoothstep(0.02, 0.0, ringDist);
      vec3 ringColor = hsl2rgb(vec3(fract(time * 0.2), 1.0, 0.85));
      finalColor += ringColor * ring * 0.5;

      // Cosmic sparkle bursts
      float burst = hash(floor(uv * 30.0 + floor(time * 5.0)));
      burst = step(0.985, burst);
      float burstGlow = smoothstep(0.5, 0.0, length(fract(uv * 30.0) - 0.5));
      finalColor += vec3(1.0) * burst * burstGlow * 2.0;

      alpha = min(0.9, alpha + 0.15);
    }

    // ===================
    // MOUSE-REACTIVE EFFECTS
    // ===================

    // Apply tilt-based lighting
    finalColor *= tiltLight;

    // Add hot spot highlight (foil reflection following mouse)
    vec3 hotSpotColor = hsl2rgb(vec3(fract(baseHue + 0.1), 0.3, 0.95));
    finalColor += hotSpotColor * hotSpot * 0.8 * uRarityLevel;

    // Fresnel-like edge glow that reacts to mouse position
    float fresnelMouse = 1.0 - dot(normalize(vec2(0.5) - uv), normalize(mouseOffset + 0.001));
    fresnelMouse = pow(abs(fresnelMouse), 2.0) * uHovered;
    finalColor += vec3(1.0, 0.95, 0.9) * fresnelMouse * edgeMask * 0.3;

    // Boost intensity on hover
    float hoverBoost = 1.0 + uHovered * 0.15;
    finalColor *= hoverBoost;
    alpha *= hoverBoost;

    // Final alpha with edge falloff
    alpha *= smoothstep(0.0, 0.02, borderDist);
    alpha = clamp(alpha, 0.0, 0.95);

    gl_FragColor = vec4(finalColor, alpha);
  }
`

export const RarityShader = memo(function RarityShader({
  rarity,
  element = 'physical',
  width,
  height,
  mouseX = 0.5,
  mouseY = 0.5,
  isHovered = false,
}: RarityShaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const animationRef = useRef<number>(0)

  // Rarity level: 1=legendary, 2=mythic, 3=ancient
  const rarityLevel = rarity === 'legendary' ? 1 : rarity === 'mythic' ? 2 : 3

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Setup scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Orthographic camera for 2D overlay
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10)
    camera.position.z = 1

    // Renderer with transparency
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Shader material
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uRarityLevel: { value: rarityLevel },
        uElementHue: { value: ELEMENT_HUE[element] },
        uResolution: { value: new THREE.Vector2(width, height) },
        uMouse: { value: new THREE.Vector2(mouseX, mouseY) },
        uHovered: { value: isHovered ? 1.0 : 0.0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    materialRef.current = material

    // Full-screen quad
    const geometry = new THREE.PlaneGeometry(1, 1)
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    // Animation loop
    const startTime = performance.now()
    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000
      material.uniforms.uTime.value = elapsed

      renderer.render(scene, camera)
      animationRef.current = requestAnimationFrame(animate)
    }
    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(animationRef.current)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mouseX/mouseY/isHovered intentionally excluded; updated via separate effect
  }, [width, height, rarityLevel, element])

  // Update uniforms when props change
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uRarityLevel.value = rarityLevel
      materialRef.current.uniforms.uElementHue.value = ELEMENT_HUE[element]
    }
  }, [rarityLevel, element])

  // Update mouse uniforms (separate effect for performance - runs frequently)
  useEffect(() => {
    if (materialRef.current) {
      const uniforms = materialRef.current.uniforms
      ;(uniforms.uMouse.value as THREE.Vector2).set(mouseX, mouseY)
      uniforms.uHovered.value = isHovered ? 1.0 : 0.0
    }
  }, [mouseX, mouseY, isHovered])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  )
})

export default RarityShader
