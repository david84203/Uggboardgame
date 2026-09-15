import { useEffect, useRef, useState } from 'react'
import { Routes, Route, useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { useLiff } from './liff/useLiff.js'
import { analyze, fetchReport, track } from './api.js'
import { T } from './ui/theme.jsx'
import Welcome from './ui/Welcome.jsx'
import Guide from './ui/Guide.jsx'
import Capture from './ui/Capture.jsx'
import StylePicker from './ui/StylePicker.jsx'
import Analyzing from './ui/Analyzing.jsx'
import Privacy from './ui/Privacy.jsx'
import ReportPage from './report/ReportPage.jsx'
import { QUALITY_ISSUE } from './rules/labels.js'

const newKey = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)

function Flow({ liff }) {
  const [step, setStep] = useState('welcome')
  const [photo, setPhoto] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const keyRef = useRef(newKey())
  const inflight = useRef(null)

  useEffect(() => { track('liff_ready') }, [])

  async function run(photoPayload, prefs) {
    setStep('analyzing'); setError(null)
    track('analysis_start')
    const t0 = Date.now()
    try {
      const res = await analyze({ ...photoPayload, ...prefs, idempotencyKey: keyRef.current, ref: new URLSearchParams(window.location.search).get('ref') })
      track('analysis_done', { analysisId: res.analysisId, payload: { ms: Date.now() - t0 } })
      setResult(res); setStep('report'); track('report_view', { analysisId: res.analysisId })
      window.scrollTo(0, 0)
    } catch (e) {
      if (e.status === 422 && e.data?.issues) {
        setError(e.data.issues.map((i) => QUALITY_ISSUE[i] ?? i).join('；') + '。請換一張照片。')
      } else if (e.status === 429) {
        setError(e.message)
      } else {
        setError(e.name === 'TimeoutError' ? '分析花的時間比平常久，請再試一次' : e.message || '暫時無法分析，請稍後再試')
      }
    }
  }

  if (step === 'welcome') return <Welcome profile={liff.profile} onNext={() => { track('consent_ok'); setStep('guide') }} />
  if (step === 'guide') return <Guide onNext={() => { track('guide_view'); setStep('capture') }} />
  if (step === 'capture') return <Capture onReady={(p) => { setPhoto(p); setStep('style') }} />
  if (step === 'style') return <StylePicker onSubmit={(prefs) => { track('style_selected', { payload: prefs }); run(photo, prefs) }} />
  if (step === 'analyzing') return <Analyzing error={error} onRetry={() => (error?.includes('換一張') ? (keyRef.current = newKey(), setStep('capture')) : setStep('style'))} />
  if (step === 'report' && result) return <ReportPage analysisId={result.analysisId} report={result.report} products={result.products} onRestart={() => { keyRef.current = newKey(); setPhoto(null); setResult(null); setStep('capture') }} />
  return null
}

function Reopen() {
  const { id } = useParams()
  const [state, setState] = useState({ loading: true })
  useEffect(() => {
    fetchReport(id).then((r) => { setState({ loading: false, ...r }); track('report_reopen', { analysisId: id }) }).catch((e) => setState({ loading: false, error: e.message }))
  }, [id])
  if (state.loading) return <div className={`${T.wrap} text-center`}>載入報告中…</div>
  if (state.error) return <div className={`${T.wrap} text-center`}>找不到這份報告，或不是你的報告。</div>
  return <ReportPage analysisId={state.analysisId} report={state.report} products={state.products} />
}

function Gate({ children }) {
  const liff = useLiff()
  if (liff.status === 'loading') return <div className={`${T.wrap} text-center`}>載入中…</div>
  if (liff.status === 'error') {
    return (
      <div className={`${T.wrap} text-center`}>
        <p>請從 LINE 開啟這個頁面。</p>
        <a className={`${T.btn} mt-4 block`} href={`https://line.me/R/ti/p/${import.meta.env.VITE_HAN_OA_ID || ''}`}>加入 Han 的 LINE</a>
      </div>
    )
  }
  return children(liff)
}

export default function BeautyApp() {
  return (
    <div className={T.page}>
      <Helmet>
        <title>AI 妝容診斷｜于涵 Han</title>
        <meta name="robots" content="noindex" />
        <meta name="theme-color" content="#F5EFE6" />
      </Helmet>
      <Routes>
        <Route path="privacy" element={<Privacy />} />
        <Route path="report/:id" element={<Gate>{() => <Reopen />}</Gate>} />
        <Route path="*" element={<Gate>{(liff) => <Flow liff={liff} />}</Gate>} />
      </Routes>
    </div>
  )
}
