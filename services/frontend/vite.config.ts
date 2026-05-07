import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    host: true,
    proxy: {
      '/api/auth': {
        target: process.env.AUTH_URL || 'http://localhost:3001',
        changeOrigin: true
      },
      '/api/fridge': {
        target: process.env.FRIDGE_URL || 'http://localhost:3002',
        changeOrigin: true
      },
      '/api/recipes': {
        target: process.env.RECIPE_URL || 'http://localhost:3003',
        changeOrigin: true
      }
    }
  }
})
