import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    // Désactiver le cache pour éviter les problèmes MIME
    headers: {
      'Cache-Control': 'no-store'
    }
  },
  build: {
    // Assurer que les assets sont servis avec les bons types MIME
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Nommer les fichiers de manière prévisible
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  // Configuration pour la production
  base: '/',
})
