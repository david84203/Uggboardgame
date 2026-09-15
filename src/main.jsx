import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { initLiff } from './utils/liff'
import HomePage from './pages/public/HomePage.jsx'
import AboutPage from './pages/public/AboutPage.jsx'
import PricingPage from './pages/public/PricingPage.jsx'
import FaqPage from './pages/public/FaqPage.jsx'
import LinkPage from './pages/public/LinkPage.jsx'
import OutboundRedirectPage from './pages/public/OutboundRedirectPage.jsx'

// 于涵 Han 的 AI 妝容診斷 LIFF：獨立 chunk、獨立 LIFF ID，與桌遊店 APP 互不影響
const BeautyApp = lazy(() => import('./beauty/BeautyApp.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider>
          <Routes>
            {/* 首頁＝官網門面（會員 APP 搬到 /app）。帶 ?tab= 的舊連結由 HomePage 轉去 /app */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/faq" element={<FaqPage />} />
            {/* QR code 專用快速連結頁。noindex、不進 sitemap，網址已印在實體物上不可改 */}
            <Route path="/link" element={<LinkPage />} />
            {/* 對外連結先經過站內短網址，讓免費 Web Analytics 能辨識 LINE、電話等轉換來源 */}
            <Route path="/go/:channel/*" element={<OutboundRedirectPage />} />
            <Route path="/beauty/*" element={<Suspense fallback={null}><BeautyApp /></Suspense>} />
            {/* catch-all：/app 與其餘所有網址都照舊 render 會員 APP（含 ?tab= 參數） */}
            <Route path="*" element={<App />} />
          </Routes>
        </ThemeProvider>
        <Analytics />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)

// /beauty 有自己的 LIFF（liff.init 一頁只能呼叫一次），桌遊店的 LIFF 不在那裡初始化
if (!window.location.pathname.startsWith('/beauty')) initLiff()
