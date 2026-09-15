// MediaPipe Face Landmarker：在手機上量 478 個特徵點，算出臉型幾何、三庭五眼、膚色提示。
// 這些數字是「量出來的」，臉型只讓 AI 在候選中選、比例特性完全不經 AI。

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

let landmarkerPromise = null

export function loadLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FilesetResolver, FaceLandmarker } = await import('@mediapipe/tasks-vision')
      const fileset = await FilesetResolver.forVisionTasks(WASM_URL)
      return FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
        runningMode: 'IMAGE',
        numFaces: 3,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: true,
      })
    })().catch((e) => {
      landmarkerPromise = null
      throw e
    })
  }
  return landmarkerPromise
}

// 常用特徵點索引（MediaPipe 468 點 + 10 個虹膜點）
const L = {
  foreheadTop: 10, chin: 152, glabella: 9, noseBottom: 2, noseTip: 1,
  cheekL: 234, cheekR: 454,          // 顴骨最外緣（臉寬）
  templeL: 103, templeR: 332,        // 額頭寬（太陽穴上方）
  jawL: 172, jawR: 397,              // 下顎角
  jawUpL: 132, jawUpR: 361,          // 下顎角上方（耳下）
  chinL: 148, chinR: 377,            // 下巴兩側
  eyeLOuter: 33, eyeLInner: 133, eyeRInner: 362, eyeROuter: 263,
  eyeLTop: 159, eyeLBottom: 145, eyeRTop: 386, eyeRBottom: 374,
  browLLow: 105, browRLow: 334,      // 眉毛下緣（眼睛正上方）
  appleL: 50, appleR: 280,           // 蘋果肌
  cheekboneL: 116, cheekboneR: 345,
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y)
const angleAt = (p, a, b) => {
  const v1 = { x: a.x - p.x, y: a.y - p.y }, v2 = { x: b.x - p.x, y: b.y - p.y }
  const cos = (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y) || 1)
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI
}

/** 特徵點（像素座標）→ 幾何量測 */
export function computeMetrics(pts, canvasW, canvasH) {
  const p = (i) => pts[i]
  const faceLength = dist(p(L.foreheadTop), p(L.chin))
  const cheekW = dist(p(L.cheekL), p(L.cheekR))
  const foreheadW = dist(p(L.templeL), p(L.templeR))
  const jawW = dist(p(L.jawL), p(L.jawR))
  const jawAngle = (angleAt(p(L.jawL), p(L.jawUpL), p(L.chin)) + angleAt(p(L.jawR), p(L.jawUpR), p(L.chin))) / 2
  // 下巴尖銳度：下巴兩側點到下巴尖的夾角越小越尖
  const chinAngle = angleAt(p(L.chin), p(L.chinL), p(L.chinR))
  const chin = Math.max(0, Math.min(1, (150 - chinAngle) / 60))

  const eyeLW = dist(p(L.eyeLOuter), p(L.eyeLInner))
  const eyeRW = dist(p(L.eyeRInner), p(L.eyeROuter))
  const eyeW = (eyeLW + eyeRW) / 2
  const innerGap = dist(p(L.eyeLInner), p(L.eyeRInner))
  const eyeH = (dist(p(L.eyeLTop), p(L.eyeLBottom)) + dist(p(L.eyeRTop), p(L.eyeRBottom))) / 2
  const browGap = (dist(p(L.browLLow), p(L.eyeLTop)) + dist(p(L.browRLow), p(L.eyeRTop))) / 2

  const midface = dist(p(L.glabella), p(L.noseBottom)) / faceLength
  const lowerFace = dist(p(L.noseBottom), p(L.chin)) / faceLength

  // 偏頭（yaw）：鼻尖到左右顴骨距離差 / 臉寬
  const yaw = Math.abs(dist(p(L.noseTip), p(L.cheekL)) - dist(p(L.noseTip), p(L.cheekR))) / cheekW

  const xs = pts.map((q) => q.x), ys = pts.map((q) => q.y)
  const box = { x: Math.min(...xs), y: Math.min(...ys) }
  box.w = Math.max(...xs) - box.x
  box.h = Math.max(...ys) - box.y

  return {
    ratio: +(faceLength / cheekW).toFixed(3),
    fw: +(foreheadW / cheekW).toFixed(3),
    jw: +(jawW / cheekW).toFixed(3),
    jawAngle: +jawAngle.toFixed(1),
    chin: +chin.toFixed(2),
    eyeSpacing: +(innerGap / eyeW).toFixed(3),
    midface: +midface.toFixed(3),
    lowerFace: +lowerFace.toFixed(3),
    cheekbone: +((cheekW / jawW + cheekW / foreheadW) / 2).toFixed(3),
    browEyeGap: +(browGap / (eyeH || 1)).toFixed(2),
    yaw: +yaw.toFixed(3),
    faceBoxRatio: +(box.w / canvasW).toFixed(3),
    box,
  }
}

/** 取兩側蘋果肌附近的膚色，轉 Lab 給 AI 當冷暖提示（受光線影響，僅供參考） */
export function sampleSkinTone(canvas, pts) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const r = Math.max(4, Math.round(dist(pts[L.eyeLOuter], pts[L.eyeLInner]) * 0.35))
  let R = 0, G = 0, B = 0, n = 0
  for (const idx of [L.appleL, L.appleR, L.cheekboneL, L.cheekboneR]) {
    const c = pts[idx]
    const x = Math.max(0, Math.round(c.x - r)), y = Math.max(0, Math.round(c.y - r))
    const w = Math.min(canvas.width - x, 2 * r), h = Math.min(canvas.height - y, 2 * r)
    if (w <= 0 || h <= 0) continue
    const { data } = ctx.getImageData(x, y, w, h)
    for (let i = 0; i < data.length; i += 4) { R += data[i]; G += data[i + 1]; B += data[i + 2]; n++ }
  }
  if (!n) return null
  const lab = rgbToLab(R / n, G / n, B / n)
  const hueAngle = (Math.atan2(lab.b, lab.a) * 180) / Math.PI
  return { L: +lab.L.toFixed(1), a: +lab.a.toFixed(1), b: +lab.b.toFixed(1), hueAngle: +hueAngle.toFixed(1) }
}

function rgbToLab(r, g, b) {
  const f = (c) => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92 }
  const [R, G, B] = [f(r), f(g), f(b)]
  let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047
  let y = (R * 0.2126 + G * 0.7152 + B * 0.0722) / 1.0
  let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883
  const g2 = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  ;[x, y, z] = [g2(x), g2(y), g2(z)]
  return { L: 116 * y - 16, a: 500 * (x - y), b: 200 * (y - z) }
}

export const FACE_BOX_MIN = 0.25
export const YAW_MAX = 0.25

/**
 * 主要進入點：canvas → { faces, metrics, skinHint, issues[] }
 * issues 只含臉相關（no_face / multiple_faces / not_frontal / face_too_small）。
 */
export async function measureFace(canvas) {
  const lm = await loadLandmarker()
  const result = lm.detect(canvas)
  const faces = result.faceLandmarks?.length ?? 0
  if (faces === 0) return { faces, issues: ['no_face'] }
  if (faces > 1) return { faces, issues: ['multiple_faces'] }
  const pts = result.faceLandmarks[0].map((q) => ({ x: q.x * canvas.width, y: q.y * canvas.height }))
  const metrics = computeMetrics(pts, canvas.width, canvas.height)
  const skinHint = sampleSkinTone(canvas, pts)
  const issues = []
  if (metrics.faceBoxRatio < FACE_BOX_MIN) issues.push('face_too_small')
  if (metrics.yaw > YAW_MAX) issues.push('not_frontal')
  return { faces, metrics, skinHint, issues }
}
