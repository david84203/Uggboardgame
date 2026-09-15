import { useEffect, useRef, useState } from 'react'
import { T, Star } from './theme.jsx'
import { fileToCanvas, canvasToJpegBase64 } from '../capture/preprocess.js'
import { measureQuality, qualityIssues } from '../capture/quality.js'
import { measureFace, loadLandmarker } from '../capture/measure.js'
import { faceShapeHint } from '../rules/faceShape.js'
import { QUALITY_ISSUE } from '../rules/labels.js'
import { track } from '../api.js'

export default function Capture({ onReady }) {
  const camRef = useRef(null)
  const libRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [issues, setIssues] = useState([])
  const [warn, setWarn] = useState(null)
  const [pending, setPending] = useState(null)

  useEffect(() => { loadLandmarker().catch(() => {}) }, [])

  async function handleFile(file) {
    if (!file) return
    setBusy(true); setIssues([]); setWarn(null); setPending(null)
    try {
      const canvas = await fileToCanvas(file)
      setPreview(canvas.toDataURL('image/jpeg', 0.7))
      track('photo_selected')
      let face
      try { face = await measureFace(canvas) } catch (e) { face = { faces: -1, issues: [], metrics: null, error: e?.message } }
      const q = measureQuality(canvas, face.metrics?.box && { ...face.metrics.box })
      const all = [...face.issues, ...qualityIssues(q)]
      if (all.length) {
        setIssues(all)
        track('quality_fail', { payload: { issues: all, q } })
        return
      }
      if (face.faces === -1) setWarn('臉部量測功能載入失敗，仍可分析，但臉型判斷會少一道確認。')
      const payload = {
        image: canvasToJpegBase64(canvas),
        clientQuality: q,
        metrics: face.metrics ?? null,
        faceHint: face.metrics ? faceShapeHint(face.metrics) : null,
        skinHint: face.skinHint ?? null,
      }
      setPending(payload)
    } catch (e) {
      setIssues(['blurry'])
      setWarn(`讀取照片失敗：${e?.message || e}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={T.wrap}>
      <h1 className={T.h1}><Star />拍一張正臉<Star /></h1>
      <div className={`${T.card} mt-4 flex aspect-[3/4] items-center justify-center overflow-hidden p-0`}>
        {preview ? <img src={preview} alt="預覽" className="h-full w-full object-cover" /> : <p className={T.sub}>還沒有照片</p>}
      </div>
      {busy && <p className={`${T.sub} mt-3`}>正在檢查光線與臉部位置…</p>}
      {issues.length > 0 && (
        <div className="mt-3 rounded-xl bg-[#FBEAE5] p-3 text-sm text-[#8A3B2E]">
          {issues.map((i) => <p key={i}>・{QUALITY_ISSUE[i] ?? i}</p>)}
        </div>
      )}
      {warn && <p className="mt-2 text-xs text-[#8A6A3B]">{warn}</p>}
      {pending && !issues.length && <p className="mt-3 text-sm text-[#3B6B4A]">這張可以，光線與角度都合格。</p>}

      <input ref={camRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      <input ref={libRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />

      <div className={`${T.bar} space-y-2`}>
        {pending && !issues.length ? (
          <>
            <button className={T.btn} onClick={() => onReady(pending)}>使用這張</button>
            <button className={T.btnGhost} onClick={() => camRef.current?.click()}>重拍</button>
          </>
        ) : (
          <>
            <button className={T.btn} disabled={busy} onClick={() => camRef.current?.click()}>自拍</button>
            <button className={T.btnGhost} disabled={busy} onClick={() => libRef.current?.click()}>從相簿選</button>
          </>
        )}
      </div>
    </div>
  )
}
