// 純像素層的品質檢查：亮度、模糊。臉的部分由 measure.js 用特徵點判斷。
export const BRIGHTNESS_MIN = 60
export const BRIGHTNESS_MAX = 200
export const BLUR_MIN = 80

function grayOf(ctx, x, y, w, h) {
  const { data } = ctx.getImageData(x, y, w, h)
  const g = new Float32Array(w * h)
  for (let i = 0, j = 0; i < data.length; i += 4, j++) g[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
  return g
}

/** box：{x,y,w,h}（像素），沒有就用整張。回傳 { brightness, blur } */
export function measureQuality(canvas, box) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const b = box ?? { x: 0, y: 0, w: canvas.width, h: canvas.height }
  const x = Math.max(0, Math.floor(b.x)), y = Math.max(0, Math.floor(b.y))
  const w = Math.min(canvas.width - x, Math.floor(b.w)), h = Math.min(canvas.height - y, Math.floor(b.h))
  const g = grayOf(ctx, x, y, w, h)

  let sum = 0
  for (let i = 0; i < g.length; i++) sum += g[i]
  const brightness = sum / g.length

  // Laplacian 變異數，先把區域縮到約 256px 寬以穩定門檻
  const step = Math.max(1, Math.round(w / 256))
  const lw = Math.floor(w / step), lh = Math.floor(h / step)
  const s = new Float32Array(lw * lh)
  for (let yy = 0; yy < lh; yy++) for (let xx = 0; xx < lw; xx++) s[yy * lw + xx] = g[yy * step * w + xx * step]
  let mean = 0, n = 0
  const lap = new Float32Array(lw * lh)
  for (let yy = 1; yy < lh - 1; yy++) {
    for (let xx = 1; xx < lw - 1; xx++) {
      const i = yy * lw + xx
      const v = 4 * s[i] - s[i - 1] - s[i + 1] - s[i - lw] - s[i + lw]
      lap[i] = v
      mean += v
      n++
    }
  }
  mean /= n || 1
  let varSum = 0
  for (let yy = 1; yy < lh - 1; yy++) for (let xx = 1; xx < lw - 1; xx++) { const d = lap[yy * lw + xx] - mean; varSum += d * d }
  const blur = varSum / (n || 1)

  return { brightness: Math.round(brightness), blur: Math.round(blur) }
}

export function qualityIssues({ brightness, blur }) {
  const issues = []
  if (brightness < BRIGHTNESS_MIN) issues.push('too_dark')
  if (brightness > BRIGHTNESS_MAX) issues.push('too_bright')
  if (blur < BLUR_MIN) issues.push('blurry')
  return issues
}
