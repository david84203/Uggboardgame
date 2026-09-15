import { useState } from 'react'
import { T, Star } from './theme.jsx'
import { STYLE, CONTEXT, SELF_REPORT } from '../rules/labels.js'

export default function StylePicker({ onSubmit, analyzing }) {
  const [styles, setStyles] = useState([])
  const [context, setContext] = useState(null)
  const [selfReport, setSelfReport] = useState([])
  const toggle = (arr, set, k, max) => set(arr.includes(k) ? arr.filter((x) => x !== k) : arr.length >= max ? arr : [...arr, k])

  return (
    <div className={T.wrap}>
      <h1 className={T.h1}><Star />你想要的風格<Star /></h1>
      <p className={`${T.sub} mt-1`}>最多選 3 個{analyzing ? '，AI 已經在分析照片了' : ''}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(STYLE).map(([k, v]) => (
          <button key={k} className={`${T.chip} ${styles.includes(k) ? T.chipOn : T.chipOff}`} onClick={() => toggle(styles, setStyles, k, 3)}>{v}</button>
        ))}
      </div>
      <h2 className={`${T.h2} mt-6`}>主要情境</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {Object.entries(CONTEXT).map(([k, v]) => (
          <button key={k} className={`${T.chip} ${context === k ? T.chipOn : T.chipOff}`} onClick={() => setContext(context === k ? null : k)}>{v}</button>
        ))}
      </div>
      <h2 className={`${T.h2} mt-6`}>最近的膚況（可複選）</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {Object.entries(SELF_REPORT).map(([k, v]) => (
          <button key={k} className={`${T.chip} ${selfReport.includes(k) ? T.chipOn : T.chipOff}`} onClick={() => toggle(selfReport, setSelfReport, k, 4)}>{v}</button>
        ))}
      </div>
      <div className={T.bar}><button className={T.btn} onClick={() => onSubmit({ styles, context, selfReport })}>看我的報告</button></div>
    </div>
  )
}
