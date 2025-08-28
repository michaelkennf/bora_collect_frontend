import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration Vite pour développement et production
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [react()],
    
    // Configuration des variables d'environnement
    define: {
      // FORCER L'API EN LIGNE MÊME EN DÉVELOPPEMENT (DOMAINE CORRECT)
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify('https://api.collect.fikiri.co'),
      
      // Configuration des timeouts
      'import.meta.env.VITE_API_TIMEOUT': JSON.stringify(30000),
      'import.meta.env.VITE_APP_NAME': JSON.stringify('FikiriCollect'),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify('1.0.0'),
    },
    
    // Configuration du serveur de développement
    server: {
      port: 5173,
      host: true,
      strictPort: true, // Empêcher le changement automatique de port
      // SUPPRIMER LE PROXY CAR ON UTILISE L'API EN LIGNE
      // proxy: {
      //   '/api': {
      //     target: 'http://localhost:3000',
      //     changeOrigin: true,
      //     secure: false,
      //     rewrite: (path) => path.replace(/^\/api/, ''),
      //     timeout: 30000,
      //   },
      //   '/uploads': {
      //     target: 'http://localhost:3000',
      //     changeOrigin: true,
      //     secure: false,
      //     timeout: 30000,
      //   }
      // }
    },
    
    // Configuration de build
    build: {
      outDir: 'dist',
      sourcemap: !isProduction,
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    },
    
    // Configuration des dépendances
    optimizeDeps: {
      include: ['react', 'react-dom', 'axios']
    }
  }
})
