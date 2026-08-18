import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { initLiff } from './utils/liff'
import AboutPage from './pages/public/AboutPage.jsx'
import PricingPage from './pages/public/PricingPage.jsx'
import FaqPage from './pages/public/FaqPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider>
          <Routes>
            <Route path="/about" element={<AboutPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/faq" element={<FaqPage />} />
            {/* catch-all：保留現有會員 APP 的所有行為（含 / 與 ?tab= 參數） */}
            <Route path="*" element={<App />} />
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)

initLiff()
