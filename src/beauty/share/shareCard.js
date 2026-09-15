// IG 限動分享卡：1080×1920 PNG，不含客人照片。回傳 dataURL。
import QRCode from 'qrcode'

const QUOTES = {
  warm: ['原來我是暖色調，難怪珊瑚色一擦就發光', '暖調認證：焦糖、楓葉、橄欖綠，全部收', '今天起告別冷灰色，大地色是我的主場'],
  cool: ['冷色調的我，玫瑰色才是本命', '藕粉比正紅更像我，AI 說的', '終於知道為什麼駝色讓我看起來累'],
  neutral_warm: ['中性色調，豆沙色怎麼擦都對', '燕麥、灰駝、乾燥玫瑰，我的安全色都在這', '不偏冷不偏暖，只偏好看'],
  neutral_cool: ['中性色調，豆沙色怎麼擦都對', '燕麥、灰駝、乾燥玫瑰，我的安全色都在這', '不偏冷不偏暖，只偏好看'],
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
}

export async function renderShareCard(report, { faceSvgMarkup, addFriendUrl, oaId }) {
  const W = 1080, H = 1920
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#F5EFE6'; ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#4A3728'; ctx.textAlign = 'center'
  ctx.font = '40px "Noto Serif TC", "PingFang TC", serif'; ctx.fillStyle = '#B08968'
  ctx.fillText('✦  AI 妝容診斷  ✦', W / 2, 180)
  ctx.fillStyle = '#4A3728'; ctx.font = 'bold 84px "Noto Serif TC", "PingFang TC", serif'
  ctx.fillText(report.text.headline, W / 2, 300)
  ctx.font = '40px "Noto Sans TC", sans-serif'; ctx.fillStyle = '#7A6555'
  ctx.fillText(report.tags.join('  ・  '), W / 2, 380)

  // 臉部圖解
  if (faceSvgMarkup) {
    const img = new Image()
    const blob = new Blob([faceSvgMarkup], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    await new Promise((res) => { img.onload = res; img.onerror = res; img.src = url })
    ctx.drawImage(img, (W - 620) / 2, 430, 620, 744)
    URL.revokeObjectURL(url)
  }

  // 色票
  const sw = report.palettes
  const items = [['腮紅', sw.blush.primary], ['唇', sw.lip.primary], ['眼影', sw.eye.primary], ...sw.clothing.recommended.slice(0, 3).map((p) => ['服裝', p])]
  const size = 120, gap = 30, startX = (W - (items.length * size + (items.length - 1) * gap)) / 2
  items.forEach(([label, p], i) => {
    const x = startX + i * (size + gap)
    ctx.fillStyle = p.hex; roundRect(ctx, x, 1220, size, size, 24); ctx.fill()
    ctx.fillStyle = '#4A3728'; ctx.font = '28px "Noto Sans TC", sans-serif'
    ctx.fillText(p.name, x + size / 2, 1385); ctx.fillStyle = '#9C8672'; ctx.font = '24px "Noto Sans TC", sans-serif'; ctx.fillText(label, x + size / 2, 1420)
  })

  // 語錄
  const qs = QUOTES[report.ai.color_tone.tone] ?? QUOTES.neutral_warm
  const quote = qs[Math.floor(Math.random() * qs.length)]
  ctx.fillStyle = '#4A3728'; ctx.font = '44px "Noto Serif TC", "PingFang TC", serif'
  ctx.fillText(`「${quote}」`, W / 2, 1540)

  // QR + 文案
  if (addFriendUrl) {
    const qr = await QRCode.toDataURL(addFriendUrl, { margin: 1, width: 220, color: { dark: '#4A3728', light: '#F5EFE6' } })
    const img = new Image(); await new Promise((res) => { img.onload = res; img.src = qr })
    ctx.drawImage(img, W / 2 - 110, 1620, 220, 220)
  }
  ctx.font = '34px "Noto Sans TC", sans-serif'; ctx.fillStyle = '#7A6555'
  ctx.fillText(`你是哪一種色調？掃碼 90 秒找答案${oaId ? `  ${oaId}` : ''}`, W / 2, 1880)
  return c.toDataURL('image/png')
}
