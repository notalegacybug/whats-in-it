import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registered from src/main.tsx so unit tests (which never import it) never touch a service worker.
      injectRegister: false,
      manifest: {
        name: 'Ingredient Safety',
        short_name: 'Ingredient Safety',
        display: 'standalone',
        start_url: '/',
        theme_color: '#1a1a1a',
        background_color: '#ffffff',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // App shell only. The 15 MB OCR files and the reference are cached at runtime instead,
        // so a first visit does not download them all and the reference can update independently.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        globIgnores: ['tesseract/**', 'reference.json'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          { urlPattern: ({ url }) => url.pathname === '/reference.json', handler: 'StaleWhileRevalidate', options: { cacheName: 'reference' } },
          { urlPattern: ({ url }) => url.pathname.startsWith('/tesseract/'), handler: 'CacheFirst', options: { cacheName: 'tesseract' } },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    // e2e/ is Playwright's territory; keep Vitest out of it.
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
  },
})
