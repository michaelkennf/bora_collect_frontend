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
    // Générer un manifest pour le cache
    manifest: true,
    rollupOptions: {
      output: {
        // Nommer les fichiers de manière prévisible
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Augmenter la taille limite pour éviter les warnings
    chunkSizeWarningLimit: 1000
  },
  // Configuration pour la production
  base: '/',
  // Désactiver les Service Workers si présents
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})
