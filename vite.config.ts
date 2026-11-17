import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registered from src/main.tsx so unit tests (which never import it) never touch a service worker.
      injectRegister: false,
      manifest: {
        // Fields PWABuilder needs to generate the Android (Play Store) package.
        id: '/',
        name: 'Ingredient Safety',
        short_name: 'Ingredients',
        description: 'Check food and cosmetic ingredient labels against published cancer, hormone and allergen lists.',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'en',
        categories: ['health', 'utilities'],
        theme_color: '#0f4c5c',
        background_color: '#edf2f4',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell only; the 15 MB OCR files and the reference are cached at runtime instead.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        globIgnores: ['tesseract/**', 'reference.json'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          // Network first so a data update shows on the next open; the saved copy covers offline and slow networks.
          { urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname === '/reference.json', handler: 'NetworkFirst', options: { cacheName: 'reference', networkTimeoutSeconds: 5 } },
          { urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/tesseract/'), handler: 'CacheFirst', options: { cacheName: 'tesseract-v1' } },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
  },
})
