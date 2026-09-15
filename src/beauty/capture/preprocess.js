// 檔案 → 修正方向、長邊 1024、JPEG 0.82 的 canvas 與 base64。
export const MAX_SIDE = 1024
export const JPEG_QUALITY = 0.82

export async function fileToCanvas(file, maxSide = MAX_SIDE) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  return canvas
}

export function canvasToJpegBase64(canvas, quality = JPEG_QUALITY) {
  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  return dataUrl.slice(dataUrl.indexOf(',') + 1)
}

export function canvasToBlob(canvas, quality = JPEG_QUALITY) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}
