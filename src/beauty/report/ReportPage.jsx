import { useMemo, useRef, useState } from 'react'
import { T, Star } from '../ui/theme.jsx'
import FaceDiagram from './FaceDiagram.jsx'
import { buildFlex } from './flex.js'
import { renderShareCard } from '../share/shareCard.js'
import { oaMessageUrl, openUrl, sendToChat, HAN_OA_ID } from '../liff/useLiff.js'
import { track } from '../api.js'
import { FACE_SHAPE } from '../rules/labels.js'

function Swatches({ list, size = 'h-9 w-9' }) {
  return (
    <div className="flex flex-wrap gap-3">
      {list.map((p) => (
        <div key={p.hex + p.name} className="flex flex-col items-center gap-1 text-[11px] text-[#7A6555]">
          <span className={`${size} rounded-full ring-1 ring-black/10`} style={{ background: p.hex }} />
          {p.name}
        </div>
      ))}
    </div>
  )
}

export default function ReportPage({ analysisId, report, products = [], onRestart }) {
  const { text, ai, placements, palettes, brief } = report
  const [layers, setLayers] = useState({ blush: true, contour: true, highlight: true })
  const [fb, setFb] = useState(null)
  const [shareUrl, setShareUrl] = useState(null)
  const [busy, setBusy] = useState(null)
  const svgRef = useRef(null)

  const reportUrl = `${window.location.origin}/beauty/report/${analysisId}`
  const classText = `我想預約彩妝課 💄\n【AI 診斷精簡版】\n${brief}`
  const photoText = `我想預約拍照 📷\n想拍：證件照 / 形象照 / 個人寫真（請留一個）\n【AI 診斷精簡版】\n${brief}\n適合色：${palettes.clothing.recommended.slice(0, 2).map((p) => p.name).join('、')}`
  const productText = `我想了解這幾件 🛍️\n${products.map((p) => `・${p.name}`).join('\n')}\n【AI 診斷精簡版】\n${brief}`
  const urls = useMemo(() => ({ class: oaMessageUrl(classText), photo: oaMessageUrl(photoText), product: oaMessageUrl(productText) }), [brief, products.length])

  const cta = (intent, url) => {
    if (!url) return
    track('cta_click', { analysisId, payload: { intent } })
    openUrl(url)
  }
  const toggle = (k) => { setLayers((l) => ({ ...l, [k]: !l[k] })); track('layer_toggle', { analysisId, payload: { layer: k } }) }

  async function toChat() {
    setBusy('chat')
    try {
      await sendToChat([buildFlex(report, { reportUrl, classUrl: urls.class, productUrl: urls.product })])
      track('send_to_chat', { analysisId })
      alert('已傳到聊天室')
    } catch (e) {
      alert('請從 LINE 開啟本頁才能傳到聊天室')
    } finally { setBusy(null) }
  }
  async function share() {
    setBusy('share')
    try {
      const markup = svgRef.current ? new XMLSerializer().serializeToString(svgRef.current.querySelector('svg')) : null
      const url = await renderShareCard(report, { faceSvgMarkup: markup, addFriendUrl: HAN_OA_ID ? `https://line.me/R/ti/p/${HAN_OA_ID}` : null, oaId: HAN_OA_ID })
      setShareUrl(url)
      track('share_card', { analysisId })
    } finally { setBusy(null) }
  }

  return (
    <div className={T.wrap}>
      <p className={`${T.sub} text-center`}>✦ AI 妝容診斷 ✦</p>
      <h1 className={`${T.h1} mt-1 text-center`}>{text.headline}</h1>
      <p className={`${T.sub} mt-1 text-center`}>{report.tags.join('・')}</p>
      {text.personal && <p className={`${T.card} mt-4 leading-relaxed`}>{text.personal}</p>}
      {report.partial && <p className="mt-3 rounded-xl bg-[#FFF4E0] p-3 text-xs text-[#8A6A3B]">這張照片有濃妝或濾鏡，色彩與膚質判斷僅供參考，想更準可以用素顏照再測一次。</p>}

      <section className="mt-7">
        <h2 className={T.h2}><Star />臉型與量感</h2>
        <p className="mt-2 leading-relaxed">{text.face}。{text.volume}</p>
        {ai.face_shape.evidence?.length > 0 && <p className={`${T.sub} mt-1`}>依據：{ai.face_shape.evidence.join('；')}</p>}
        {ai.face_shape.secondary && ai.face_shape.confidence < 0.6 && (
          <p className={`${T.sub} mt-1`}>也可以參考{FACE_SHAPE[ai.face_shape.secondary]}的畫法。</p>
        )}
      </section>

      <section className="mt-7">
        <h2 className={T.h2}><Star />腮紅、修容、打亮怎麼畫</h2>
        <div ref={svgRef} className={`${T.card} mt-3 p-2`}>
          <FaceDiagram faceShape={ai.face_shape.primary} placements={placements} blushHex={palettes.blush.primary.hex} layers={layers} className="w-full" />
        </div>
        <div className="mt-3 flex gap-2">
          {[['blush', '腮紅'], ['contour', '修容'], ['highlight', '打亮']].map(([k, v]) => (
            <button key={k} className={`${T.chip} ${layers[k] ? T.chipOn : T.chipOff}`} onClick={() => toggle(k)}>{v}</button>
          ))}
        </div>
        <p className="mt-3 leading-relaxed">{text.placementLine}</p>
        <ul className="mt-2 space-y-1 text-sm">
          <li>・{text.blush}</li><li>・{text.contour}</li><li>・{text.highlight}</li>
          {text.placementNotes.map((n) => <li key={n} className={T.sub}>・{n}</li>)}
        </ul>
      </section>

      <section className="mt-7">
        <h2 className={T.h2}><Star />冷暖色調與妝色</h2>
        <p className="mt-2 leading-relaxed">{text.tone}</p>
        {ai.color_tone.evidence?.length > 0 && <p className={`${T.sub} mt-1`}>依據：{ai.color_tone.evidence.join('；')}</p>}
        <div className={`${T.card} mt-3 space-y-3`}>
          <div><p className={T.sub}>腮紅</p><Swatches list={palettes.blush.palette} /></div>
          <div><p className={T.sub}>唇</p><Swatches list={palettes.lip.palette} /></div>
          <div><p className={T.sub}>眼影</p><Swatches list={palettes.eye.palette} /></div>
        </div>
        <p className="mt-2 text-sm">{text.eyeLip}</p>
        {text.style && <p className="mt-2 leading-relaxed">{text.style}</p>}
      </section>

      <section className="mt-7">
        <h2 className={T.h2}><Star />服裝顏色</h2>
        <div className={`${T.card} mt-3 space-y-3`}>
          <div><p className={T.sub}>適合</p><Swatches list={palettes.clothing.recommended} /></div>
          <div><p className={T.sub}>百搭</p><Swatches list={palettes.clothing.neutrals} /></div>
          <div><p className={T.sub}>容易顯暗沉</p><Swatches list={palettes.clothing.avoid} /></div>
        </div>
        <p className={`${T.sub} mt-2`}>{palettes.clothing.tip}</p>
      </section>

      <section className="mt-7">
        <h2 className={T.h2}><Star />膚質與保養重點</h2>
        <p className="mt-2 leading-relaxed">{text.skin}</p>
      </section>

      {products.length > 0 && (
        <section className="mt-7">
          <h2 className={T.h2}><Star />為你挑的保養與彩妝</h2>
          <p className={`${T.sub} mt-1`}>2 件保養、2 件彩妝，依你的膚質與色調挑選</p>
          <div className="mt-3 space-y-2">
            {products.map((p) => (
              <div key={p.sku} className={`${T.card} flex items-center gap-3`}>
                {p.image ? <img src={p.image} alt="" className="h-14 w-14 rounded-lg object-cover" /> : <div className="h-14 w-14 rounded-lg bg-[#EFE4D6]" />}
                <div className="flex-1">
                  <p className="font-medium">{p.name}</p>
                  <p className={T.sub}>{p.note}</p>
                </div>
                {p.url && <a className="text-sm underline" href={p.url} target="_blank" rel="noreferrer">看商品</a>}
              </div>
            ))}
          </div>
          <button className={`${T.btn} mt-3`} disabled={!urls.product} onClick={() => cta('product', urls.product)}>我想了解這 {products.length} 件</button>
        </section>
      )}

      <section className="mt-7 space-y-3">
        <h2 className={T.h2}><Star />下一步</h2>
        <p className={T.sub}>{FACE_SHAPE[ai.face_shape.primary]}的腮紅畫法，30 分鐘就能上手。先問問時間與價格，不用馬上決定。</p>
        <button className={T.btn} disabled={!urls.class} onClick={() => cta('class', urls.class)}>我想預約彩妝課</button>
        <p className={T.sub}>{palettes.clothing.recommended[0]?.name}是你最上鏡的顏色之一，要不要拍一組？</p>
        <button className={T.btn} disabled={!urls.photo} onClick={() => cta('photo', urls.photo)}>我想預約拍照</button>
        <button className={T.btnGhost} disabled={busy === 'share'} onClick={share}>做成限動分享卡</button>
        {shareUrl && (
          <div className={T.card}>
            <img src={shareUrl} alt="分享卡" className="w-full rounded-xl" />
            <p className={`${T.sub} mt-2`}>長按圖片儲存，貼到 IG 限動。</p>
          </div>
        )}
        <button className={T.btnGhost} disabled={busy === 'chat'} onClick={toChat}>把報告存到 LINE</button>
      </section>

      <section className="mt-8 text-center">
        <p className={T.sub}>這份分析準嗎？</p>
        <div className="mt-2 flex justify-center gap-3">
          {[['up', '👍 很像我'], ['down', '👎 不太像']].map(([k, v]) => (
            <button key={k} className={`${T.chip} ${fb === k ? T.chipOn : T.chipOff}`} onClick={() => { setFb(k); track('feedback', { analysisId, payload: { value: k } }) }}>{v}</button>
          ))}
        </div>
        <p className={`${T.sub} mt-6 text-xs`}>報告編號 {analysisId}</p>
        {onRestart && <button className="mt-3 text-sm underline" onClick={onRestart}>再測一次</button>}
      </section>
    </div>
  )
}
