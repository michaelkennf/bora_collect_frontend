import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify('https://api.collect.fikiri.co'), // API EN LIGNE - DOMAINE CORRECT
      'import.meta.env.VITE_API_TIMEOUT': JSON.stringify(30000),
      'import.meta.env.VITE_APP_NAME': JSON.stringify('FikiriCollect'),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify('1.0.0'),
    },
    server: {
      port: 5173,
      host: true,
      strictPort: true,
      // proxy: {
      //   '/api': {
      //     target: 'http://localhost:3000',
      //     changeOrigin: true,
      //     secure: false,
      //   }
      // }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            charts: ['react-chartjs-2', 'chart.js'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
  }
})
