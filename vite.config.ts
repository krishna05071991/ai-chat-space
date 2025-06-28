import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Simple Vite configuration for reliable builds
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020'
  },
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  }
})