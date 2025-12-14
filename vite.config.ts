import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'ES2022',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-three': ['three'],
          'vendor-gsap': ['gsap'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    testTimeout: 30000, // 30s for API calls
    setupFiles: ['./src/test-setup.ts'],
  },
})
