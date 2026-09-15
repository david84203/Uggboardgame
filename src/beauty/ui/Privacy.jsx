import { T, Star } from './theme.jsx'
export default function Privacy() {
  return (
    <div className={T.wrap}>
      <h1 className={T.h1}><Star />隱私說明<Star /></h1>
      <div className={`${T.card} mt-4 space-y-3 text-sm leading-relaxed`}>
        <p><b>蒐集目的</b>：提供 AI 妝容與風格診斷、後續的保養與課程建議。</p>
        <p><b>蒐集項目</b>：你上傳的一張臉部照片、LINE 顯示名稱與頭像、你勾選的風格與膚況、分析結果（文字）。</p>
        <p><b>照片處理</b>：照片會傳送至境外的 AI 服務進行分析，分析完成後立即刪除，不儲存原圖，也不用於訓練模型。</p>
        <p><b>保存期間</b>：文字結果與標籤保存至你要求刪除為止，最長 24 個月。</p>
        <p><b>你的權利</b>：可隨時透過官方帳號要求查詢、更正或刪除資料。</p>
        <p><b>聯絡</b>：LINE 官方帳號「于涵 Han」。</p>
      </div>
    </div>
  )
}
