import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// For GitHub Pages PROJECT sites the app is served from
// https://<user>.github.io/<repo>/  — so the base path must be "/<repo>/".
// Set it via the BASE_PATH env var in the deploy workflow.
// For local dev (npm run dev) it stays "/".
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'favicon.png'],
      manifest: {
        name: "Sean's Cut",
        short_name: 'Cut',
        description: 'Daily cut tracker — checklist, workouts & weight trend',
        theme_color: '#0a0b0d',
        background_color: '#0a0b0d',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
      },
    }),
  ],
})
