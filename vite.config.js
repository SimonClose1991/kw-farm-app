import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Target Safari 13+ (iOS 13+) to ensure wide iPhone compatibility
    // This forces Vite to transpile modern JS features like optional chaining,
    // nullish coalescing, and async/await into forms Safari can handle
    target: ['es2019', 'safari13'],
  },
})
