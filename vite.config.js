import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'images/LOGO.jpg'],
      workbox: {
        // 公開門面頁（/ /about /pricing /faq）是各自獨立的預渲染靜態 HTML，
        // 排除在 SW 的 navigateFallback 之外，避免被舊快取的殼蓋掉。
        // /app 也要排除：首頁改成官網後 dist/index.html 是官網內容，若讓 SW 用它當
        // fallback，裝過 PWA 的客人打開會員 APP 會先閃一下官網首頁（已實測會發生）。
        // 代價是離線時 /app 開不起來——APP 本來就要連線抓資料，離線也無法使用。
        navigateFallbackDenylist: [/^\/$/, /^\/app/, /^\/about/, /^\/pricing/, /^\/faq/],
      },
      manifest: {
        name: '烏嘎嘎桌遊｜玩家指南',
        short_name: '烏嘎嘎桌遊',
        description: '消費方式、餐點、遊戲查詢、環境介紹、密室逃脫，一站搞定！',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/app', // 首頁已改成官網門面，PWA 要直接開會員 APP
        lang: 'zh-TW',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
