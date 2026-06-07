import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

// Stamp SW_VERSION with build timestamp so PWA users always get updates
function stampServiceWorker() {
  return {
    name: 'stamp-sw-version',
    buildStart() {
      const swPath = resolve(__dirname, 'public/sw.js')
      let content = readFileSync(swPath, 'utf-8')
      const stamped = content.replace(
        /const SW_VERSION = '[^']*';/,
        `const SW_VERSION = 'v-${Date.now()}';`
      )
      if (stamped !== content) writeFileSync(swPath, stamped, 'utf-8')
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), stampServiceWorker()],
  build: {
    rollupOptions: {
      output: {
        // Split vendor libraries into separate chunks for better long-term caching
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
            return 'vendor';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'motion';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          if (id.includes('node_modules/axios')) {
            return 'http';
          }
        },
      },
    },
    // Increase chunk size warning limit (framer-motion is large but unavoidable)
    chunkSizeWarningLimit: 600,
    // Minify CSS
    cssMinify: true,
    // Target modern browsers for smaller output
    target: 'es2020',
  },
})
