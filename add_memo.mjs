const res = await fetch(
  'https://firestore.googleapis.com/v1/projects/project-hub-410cd/databases/(default)/documents/items',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        type: { stringValue: 'memo' },
        projectId: { stringValue: 'ugg-app' },
        content: { stringValue: '待補歷史租借資料：Lu 有一批 5/17 前的手寫收據，輸入到 Firestore 後記得確認遊戲名稱與 Sheet 完全一致（曾發生「奧秘小鎮」→「奧秘小隊」名稱不符導致計數為 0 的問題）' },
        status: { stringValue: 'open' },
        createdAt: { timestampValue: new Date().toISOString() }
      }
    })
  }
)
const data = await res.json()
if (data.name) {
  console.log('新增備忘成功，ID:', data.name.split('/').pop())
} else {
  console.error('失敗:', JSON.stringify(data))
}
