// 傳到聊天室的 Flex Message（由使用者端送出，不耗 OA 額度）
export function buildFlex(report, { reportUrl, classUrl, productUrl }) {
  const { text, tags } = report
  const buttons = [
    reportUrl && { type: 'button', style: 'primary', color: '#4A3728', action: { type: 'uri', label: '看完整報告', uri: reportUrl } },
    classUrl && { type: 'button', style: 'secondary', action: { type: 'uri', label: '我想預約彩妝課', uri: classUrl } },
    productUrl && { type: 'button', style: 'secondary', action: { type: 'uri', label: '我想了解推薦商品', uri: productUrl } },
  ].filter(Boolean)
  return {
    type: 'flex',
    altText: `我的妝容診斷：${text.headline}`,
    contents: {
      type: 'bubble',
      styles: { body: { backgroundColor: '#F5EFE6' }, footer: { backgroundColor: '#F5EFE6' } },
      body: {
        type: 'box', layout: 'vertical', spacing: 'md',
        contents: [
          { type: 'text', text: '✦ AI 妝容診斷 ✦', size: 'xs', color: '#B08968', align: 'center' },
          { type: 'text', text: text.headline, weight: 'bold', size: 'lg', color: '#4A3728', wrap: true },
          { type: 'text', text: tags.join('・'), size: 'sm', color: '#7A6555', wrap: true },
          { type: 'separator', color: '#E6DACB' },
          { type: 'text', text: text.face, size: 'sm', color: '#4A3728', wrap: true },
          { type: 'text', text: text.tone, size: 'sm', color: '#4A3728', wrap: true },
          { type: 'text', text: text.personal || text.placementLine, size: 'sm', color: '#4A3728', wrap: true },
        ],
      },
      footer: buttons.length ? { type: 'box', layout: 'vertical', spacing: 'sm', contents: buttons } : undefined,
    },
  }
}
