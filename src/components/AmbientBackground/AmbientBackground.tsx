import { useEffect, useRef } from 'react'
import * as THREE from 'three'

/**
 * Ambient particle background using three.js
 * Creates a subtle, professional floating particle effect
 */
export function AmbientBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = window.innerWidth
    const height = window.innerHeight

    // Scene setup
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.z = 50

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Particle system
    const particleCount = 200
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const velocities: THREE.Vector3[] = []

    // Color palette - subtle blues and purples (hex for THREE.js compatibility)
    const colorPalette = [
      new THREE.Color(0x1e3a5f), // dark blue
      new THREE.Color(0x3d2a6b), // purple
      new THREE.Color(0x4a5d75), // steel blue
      new THREE.Color(0x8b7355), // amber accent
    ]

    for (let i = 0; i < particleCount; i++) {
      // Spread particles across view
      positions[i * 3] = (Math.random() - 0.5) * 100
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50

      // Random color from palette
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)]
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b

      // Varied sizes
      sizes[i] = Math.random() * 2 + 0.5

      // Slow drift velocities
      velocities.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.01
      ))
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    // Custom shader for soft glowing particles
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vSize;

        void main() {
          vColor = color;
          vSize = size;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vSize;

        void main() {
          // Soft circular gradient
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);

          // Soft falloff
          float alpha = smoothstep(0.5, 0.0, dist);
          alpha *= 0.4; // Overall transparency

          // Glow effect
          float glow = exp(-dist * 4.0) * 0.3;

          gl_FragColor = vec4(vColor + glow, alpha + glow * 0.5);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    // Animation
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const posArray = geometry.attributes.position.array as Float32Array

      // Update particle positions
      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3] += velocities[i].x
        posArray[i * 3 + 1] += velocities[i].y
        posArray[i * 3 + 2] += velocities[i].z

        // Wrap around edges
        if (posArray[i * 3] > 50) posArray[i * 3] = -50
        if (posArray[i * 3] < -50) posArray[i * 3] = 50
        if (posArray[i * 3 + 1] > 50) posArray[i * 3 + 1] = -50
        if (posArray[i * 3 + 1] < -50) posArray[i * 3 + 1] = 50
      }

      geometry.attributes.position.needsUpdate = true

      // Subtle rotation
      particles.rotation.y += 0.0002
      particles.rotation.x += 0.0001

      renderer.render(scene, camera)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      const newWidth = window.innerWidth
      const newHeight = window.innerHeight
      camera.aspect = newWidth / newHeight
      camera.updateProjectionMatrix()
      renderer.setSize(newWidth, newHeight)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
      container.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1 }}
      aria-hidden="true"
    />
  )
}

export default AmbientBackground
