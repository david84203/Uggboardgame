// 六臉型 → 腮紅 / 修容 / 打亮位置對照表（03 文件 3.2 節、05 文件 §7.1 的唯一來源）。
// 這裡改，圖層 id 與提示詞都要跟著改。位置由程式決定，AI 不參與。

export const BASE = {
  round: {
    blush: { placement: 'cheekbone_diagonal', shape: 'oval_diagonal' },
    contour: ['cheek_hollow', 'jawline', 'hairline_sides'],
    highlight: ['forehead_center', 'chin_center', 'nose_bridge'],
    line: '腮紅由蘋果肌斜刷向太陽穴，拉出縱向線條；上下打亮讓臉型看起來更修長。',
  },
  square: {
    blush: { placement: 'apple_center', shape: 'round' },
    contour: ['jaw_corners', 'forehead_sides', 'temples'],
    highlight: ['cheekbone_top', 'forehead_center', 'chin_center'],
    line: '修容集中在下顎角與額角這四個角落柔化稜角，腮紅用圓刷增加柔和感。',
  },
  oval: {
    blush: { placement: 'apple_outer', shape: 'oval_diagonal' },
    contour: ['cheek_hollow'],
    highlight: ['cheekbone_top', 'under_brow', 'cupid_bow'],
    line: '比例已經很均衡，修容只輕掃顴骨下方，重點放在打亮提升立體感。',
  },
  diamond: {
    blush: { placement: 'under_eye_wide', shape: 'horizontal_band' },
    contour: ['temples', 'cheek_hollow', 'chin_tip'],
    highlight: ['forehead_center', 'chin_center', 'inner_eye'],
    line: '用打亮補足額頭與下巴的寬度，修容收在顴骨最寬處，整體更柔和。',
  },
  heart: {
    blush: { placement: 'horizontal_mid', shape: 'horizontal_band' },
    contour: ['temples', 'forehead_sides', 'chin_tip'],
    highlight: ['chin_center', 'cheekbone_top'],
    line: '額頭兩側收窄、下巴打亮放寬，平衡上寬下尖的比例。',
  },
  oblong: {
    blush: { placement: 'horizontal_mid', shape: 'horizontal_band' },
    contour: ['hairline_top', 'chin_tip'],
    highlight: ['cheekbone_top', 'under_brow'],
    line: '髮際線與下巴修容縮短臉長，腮紅橫向平刷增加寬度。',
  },
}

const uniq = (arr) => [...new Set(arr)]

/**
 * 依比例特性微調（05 文件 §7.1 的微調規則）。回傳 { blush, contour, highlight, notes[] }。
 * notes 是每一條微調的理由，報告會顯示。
 */
export function resolvePlacements(faceShape, proportions = {}) {
  const base = BASE[faceShape] ?? BASE.oval
  let blush = { ...base.blush }
  let contour = [...base.contour]
  let highlight = [...base.highlight]
  const notes = []

  if (proportions.midface === 'long' && faceShape !== 'oblong') {
    blush = { placement: 'horizontal_mid', shape: 'horizontal_band' }
    notes.push('你的中庭偏長，腮紅改成臉頰中段橫向刷，視覺上縮短中庭。')
  }
  if (proportions.cheekbone === 'flat' && !highlight.includes('cheekbone_top')) {
    highlight.push('cheekbone_top')
    notes.push('顴骨線條平順，加上顴骨上方打亮，立體感會出來。')
  }
  if (proportions.brow_eye_gap === 'wide' && !highlight.includes('under_brow')) {
    highlight.push('under_brow')
    notes.push('眉眼距離較寬，眉骨下方打亮能讓眼睛更有神。')
  }
  if (proportions.lower_face === 'short') {
    contour = contour.filter((z) => z !== 'chin_tip' && z !== 'jawline')
    if (!highlight.includes('chin_center')) highlight.push('chin_center')
    notes.push('下庭偏短，下巴不做修容改打亮，避免臉看起來更短。')
  }
  if (proportions.eye_spacing === 'wide') {
    highlight = highlight.filter((z) => z !== 'inner_eye')
    notes.push('眼距偏寬，眼頭不打亮，眼妝重點放在眼頭加深。')
  } else if (proportions.eye_spacing === 'narrow' && !highlight.includes('inner_eye')) {
    highlight.push('inner_eye')
    notes.push('眼距偏窄，眼頭打亮能拉開兩眼距離。')
  }

  return { blush, contour: uniq(contour), highlight: uniq(highlight), notes, line: base.line }
}
