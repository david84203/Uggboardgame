import { useState } from 'react'
import { T, Star } from './theme.jsx'

export default function Welcome({ profile, onNext }) {
  const [agree, setAgree] = useState(false)
  return (
    <div className={T.wrap}>
      <p className={T.sub}>{profile?.displayName ? `${profile.displayName}，你好` : '你好'}</p>
      <h1 className={`${T.h1} mt-1`}><Star />一張自拍，找到你的命定妝容<Star /></h1>
      <p className={`${T.sub} mt-3 leading-relaxed`}>AI 分析臉型、五官量感、冷暖色調與膚質，Han 幫你把腮紅、修容、打亮的畫法畫給你看，再給你適合的口紅、眼影與服裝顏色。</p>
      <div className={`${T.card} mt-5 space-y-2 text-sm`}>
        <p>・全程約 90 秒，免費</p>
        <p>・照片只用於本次分析，分析完即刪除原圖</p>
        <p>・只保留文字結果，隨時可以請我們刪除</p>
      </div>
      <label className="mt-5 flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-[#4A3728]" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>我同意照片僅用於本次分析，分析後即刪除原圖，只保留文字結果與標籤。<a className="underline" href="/beauty/privacy" onClick={(e) => e.stopPropagation()}>隱私說明</a></span>
      </label>
      <div className={T.bar}><button className={T.btn} disabled={!agree} onClick={onNext}>開始</button></div>
    </div>
  )
}
