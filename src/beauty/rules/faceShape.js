// 臉型：由客端特徵點量測出的幾何數值，用規則算出候選臉型與分數。
// AI 只在候選中做最終判定（並可依照片推翻，但要寫依據）。
//
// metrics（皆為比例，無單位）：
//   ratio   臉長 / 臉寬（髮際線到下巴 / 顴骨最寬）
//   fw      額寬 / 顴寬
//   jw      下顎寬 / 顴寬
//   jawAngle 下顎角角度（度）；越小越有稜角，越大越圓順
//   chin    下巴尖銳度 0（圓）到 1（尖）

// 目標值與容許寬度（高斯分數），由 05 文件 §3 的分類規則轉成數字。
const PROFILES = {
  round:   { ratio: [1.07, 0.10], fw: [0.97, 0.06], jw: [0.95, 0.07], jawAngle: [158, 12], chin: [0.15, 0.2] },
  square:  { ratio: [1.10, 0.10], fw: [0.97, 0.06], jw: [0.97, 0.06], jawAngle: [132, 12], chin: [0.15, 0.2] },
  oval:    { ratio: [1.38, 0.12], fw: [0.91, 0.06], jw: [0.83, 0.07], jawAngle: [148, 12], chin: [0.40, 0.2] },
  diamond: { ratio: [1.35, 0.14], fw: [0.80, 0.06], jw: [0.76, 0.07], jawAngle: [142, 14], chin: [0.65, 0.2] },
  heart:   { ratio: [1.30, 0.14], fw: [1.00, 0.06], jw: [0.74, 0.07], jawAngle: [140, 14], chin: [0.75, 0.2] },
  oblong:  { ratio: [1.58, 0.12], fw: [0.95, 0.07], jw: [0.90, 0.08], jawAngle: [148, 14], chin: [0.35, 0.25] },
}

const WEIGHTS = { ratio: 1.6, fw: 1.2, jw: 1.2, jawAngle: 0.8, chin: 0.6 }

function gauss(x, [mu, sigma]) {
  const z = (x - mu) / sigma
  return Math.exp(-0.5 * z * z)
}

/** 回傳依分數排序的候選 [{ shape, score }]，score 0–1。metrics 缺項時只用有的欄位。 */
export function scoreFaceShapes(metrics) {
  const out = []
  for (const [shape, prof] of Object.entries(PROFILES)) {
    let num = 0
    let den = 0
    for (const [k, w] of Object.entries(WEIGHTS)) {
      const v = metrics?.[k]
      if (typeof v !== 'number' || Number.isNaN(v)) continue
      num += w * gauss(v, prof[k])
      den += w
    }
    out.push({ shape, score: den ? num / den : 0 })
  }
  out.sort((a, b) => b.score - a.score)
  return out
}

/** 給 AI 的候選：前兩名與分數差，讓提示詞能寫「若兩者接近，以下顎線形狀決定」。 */
export function faceShapeHint(metrics) {
  const ranked = scoreFaceShapes(metrics)
  const [a, b] = ranked
  return {
    ranked,
    primary: a?.shape ?? null,
    secondary: b?.shape ?? null,
    margin: a && b ? +(a.score - b.score).toFixed(3) : null,
  }
}

/** 三庭五眼等比例特性：由數值直接分類，不經 AI。 */
export function classifyProportions(m) {
  const band = (v, lo, hi, [below, mid, above]) => (v == null ? mid : v < lo ? below : v > hi ? above : mid)
  return {
    // 兩眼內眼角距 / 單眼寬；標準約 1.0
    eye_spacing: band(m?.eyeSpacing, 0.9, 1.15, ['narrow', 'standard', 'wide']),
    // 中庭（眉心到鼻底）/ 全臉長；標準約 1/3
    midface: band(m?.midface, 0.31, 0.36, ['short', 'standard', 'long']),
    // 下庭（鼻底到下巴）/ 全臉長
    lower_face: band(m?.lowerFace, 0.30, 0.36, ['short', 'standard', 'long']),
    // 顴骨突出度：顴寬 / 下顎寬 與 顴寬 / 額寬 的平均超出量
    cheekbone: band(m?.cheekbone, 1.05, 1.22, ['flat', 'standard', 'prominent']),
    // 眉毛下緣到眼睛上緣 / 眼睛高度
    brow_eye_gap: band(m?.browEyeGap, 0.7, 1.15, ['narrow', 'standard', 'wide']),
  }
}
