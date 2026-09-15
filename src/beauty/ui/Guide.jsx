import { T, Star } from './theme.jsx'

const TIPS = [
  { icon: '👤', title: '正對鏡頭', text: '兩邊臉一樣多，不要仰頭或低頭' },
  { icon: '☀️', title: '面向光源', text: '自然光或面光最好，避免背光與黃燈' },
  { icon: '💇', title: '露出額頭與下顎線', text: '撥開瀏海、拿掉眼鏡帽子、素顏或淡妝、關閉美顏濾鏡' },
]

export default function Guide({ onNext }) {
  return (
    <div className={T.wrap}>
      <h1 className={T.h1}><Star />拍照前三件事<Star /></h1>
      <div className="mt-5 space-y-3">
        {TIPS.map((t) => (
          <div key={t.title} className={`${T.card} flex items-center gap-4`}>
            <div className="text-3xl">{t.icon}</div>
            <div>
              <p className="font-medium">{t.title}</p>
              <p className={T.sub}>{t.text}</p>
            </div>
          </div>
        ))}
      </div>
      <p className={`${T.sub} mt-4`}>距離約一臂長，讓臉佔畫面三分之一以上。</p>
      <div className={T.bar}><button className={T.btn} onClick={onNext}>我準備好了</button></div>
    </div>
  )
}
