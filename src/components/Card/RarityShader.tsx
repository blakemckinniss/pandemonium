import { useRef, useEffect, memo } from 'react'
import * as THREE from 'three'
import type { Element } from '../../types'

interface RarityShaderProps {
  rarity: 'legendary' | 'mythic' | 'ancient'
  element?: Element
  width: number
  height: number
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

// Fragment shader - holographic effect
const fragmentShader = `
  uniform float uTime;
  uniform float uRarityLevel; // 1=legendary, 2=mythic, 3=ancient
  uniform float uElementHue;
  uniform vec2 uResolution;

  varying vec2 vUv;

  // HSL to RGB conversion
  vec3 hsl2rgb(vec3 c) {
    vec3 rgb = clamp(abs(mod(c.x * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0);
    return c.z + c.y * (rgb - 0.5) * (1.0 - abs(2.0 * c.z - 1.0));
  }

  // Noise function for shimmer
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // Smooth noise
  float smoothNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = noise(i);
    float b = noise(i + vec2(1.0, 0.0));
    float c = noise(i + vec2(0.0, 1.0));
    float d = noise(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 uv = vUv;
    float time = uTime;

    // Base holographic color cycling
    float hueOffset = time * 0.1;
    float hueRange = 0.3 + uRarityLevel * 0.1; // More range for higher rarities

    // Element-influenced base hue
    float baseHue = uElementHue / 360.0;

    // Rainbow sweep based on position
    float posHue = (uv.x + uv.y) * 0.5;
    float sweepHue = posHue + hueOffset;

    // Combine element hue with rainbow
    float finalHue = mix(baseHue, fract(sweepHue), 0.5 + uRarityLevel * 0.1);

    // Saturation and lightness based on rarity
    float saturation = 0.5 + uRarityLevel * 0.15;
    float lightness = 0.6 + uRarityLevel * 0.05;

    // Convert to RGB
    vec3 baseColor = hsl2rgb(vec3(fract(finalHue), saturation, lightness));

    // Add shimmer layer
    float shimmerSpeed = 2.0 + uRarityLevel * 1.0;
    vec2 shimmerUv = uv * 3.0 + vec2(time * shimmerSpeed, time * shimmerSpeed * 0.7);
    float shimmer = smoothNoise(shimmerUv);
    shimmer = pow(shimmer, 2.0 - uRarityLevel * 0.3);

    // Border detection (fade effect toward edges)
    float borderDist = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
    float borderWidth = 0.15 + uRarityLevel * 0.05;
    float borderFade = smoothstep(0.0, borderWidth, borderDist);

    // Edge glow (stronger at border)
    float edgeGlow = 1.0 - borderFade;
    edgeGlow = pow(edgeGlow, 1.5);

    // Apply shimmer to edge
    float shimmerIntensity = shimmer * edgeGlow * (0.3 + uRarityLevel * 0.2);

    // Final color composition
    vec3 finalColor = baseColor;
    finalColor += shimmerIntensity * vec3(1.0, 0.9, 0.8); // Warm shimmer

    // Add prismatic highlight for mythic/ancient
    if (uRarityLevel >= 2.0) {
      float prism = sin(uv.x * 20.0 + time * 3.0) * sin(uv.y * 20.0 + time * 2.0);
      prism = max(0.0, prism);
      prism *= edgeGlow * 0.5;
      finalColor += prism * vec3(1.0);
    }

    // Ancient: add void darkness in center
    if (uRarityLevel >= 3.0) {
      float voidDark = borderFade * 0.3;
      finalColor = mix(finalColor, vec3(0.1, 0.05, 0.15), voidDark);

      // Cosmic sparkles
      float sparkle = noise(uv * 50.0 + time);
      sparkle = step(0.98, sparkle);
      finalColor += sparkle * vec3(1.0, 0.95, 0.8);
    }

    // Alpha: visible at edges, transparent in center
    float alpha = edgeGlow * (0.6 + uRarityLevel * 0.1) + shimmerIntensity * 0.5;
    alpha = clamp(alpha, 0.0, 0.8);

    gl_FragColor = vec4(finalColor, alpha);
  }
`

export const RarityShader = memo(function RarityShader({
  rarity,
  element = 'physical',
  width,
  height,
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
    let startTime = performance.now()
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
  }, [width, height, rarityLevel, element])

  // Update uniforms when props change
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uRarityLevel.value = rarityLevel
      materialRef.current.uniforms.uElementHue.value = ELEMENT_HUE[element]
    }
  }, [rarityLevel, element])

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
