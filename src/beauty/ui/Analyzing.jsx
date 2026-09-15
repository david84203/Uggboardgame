import { useEffect, useState } from 'react'
import { T, Star } from './theme.jsx'

const STEPS = ['正在看你的臉型輪廓…', '正在判斷冷暖底色…', '正在幫你挑腮紅位置…', '快好了，正在整理報告']

export default function Analyzing({ error, onRetry }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((x) => Math.min(x + 1, STEPS.length - 1)), 2500)
    return () => clearInterval(t)
  }, [])
  return (
    <div className={`${T.wrap} flex min-h-[70vh] flex-col items-center justify-center text-center`}>
      {error ? (
        <>
          <h1 className={T.h1}>分析沒有成功</h1>
          <p className={`${T.sub} mt-3`}>{error}</p>
          <button className={`${T.btn} mt-6`} onClick={onRetry}>再試一次</button>
        </>
      ) : (
        <>
          <div className="mb-6 h-10 w-10 animate-spin rounded-full border-4 border-[#E6DACB] border-t-[#4A3728]" />
          <h1 className={T.h1}><Star />{STEPS[i]}<Star /></h1>
          <p className={`${T.sub} mt-3`}>通常 5 到 12 秒</p>
        </>
      )}
    </div>
  )
}
