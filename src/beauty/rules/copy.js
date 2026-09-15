// 報告文字模板。AI 只提供 notes.personal_line 與 notes.style_line 兩句，其餘由這裡組。
import { FACE_SHAPE, VOLUME, TONE, VALUE, CHROMA, SKIN, OBSERVATION, PROPORTION, BLUSH_PLACEMENT, BLUSH_SHAPE, CONTOUR_ZONE, HIGHLIGHT_ZONE, STYLE, LIP_FINISH } from './labels.js'

/** 依信心度決定措辭：確定 / 偏向 / 介於兩者之間 */
export function hedge(label, confidence, secondaryLabel) {
  if (confidence >= 0.75) return `你是${label}`
  if (confidence >= 0.6) return `你偏向${label}`
  if (secondaryLabel) return `你介於${label}與${secondaryLabel}之間，這次以${label}的畫法為主`
  return `你偏向${label}`
}

const TONE_HEADLINE = {
  warm: { light: '清透暖調', medium: '溫潤暖調', deep: '濃郁暖調' },
  cool: { light: '清透冷調', medium: '柔和冷調', deep: '深邃冷調' },
  neutral_warm: { light: '柔霧奶茶', medium: '溫柔中性偏暖', deep: '沉穩中性偏暖' },
  neutral_cool: { light: '柔霧裸粉', medium: '溫柔中性偏冷', deep: '沉穩中性偏冷' },
}
const VOLUME_HEADLINE = { light: '清淡系', medium: '均衡系', bold: '立體系' }

export function headline(ai) {
  const t = TONE_HEADLINE[ai.color_tone.tone]?.[ai.color_tone.axes.value] ?? '溫柔中性'
  return `${t}${VOLUME_HEADLINE[ai.feature_volume.level] ?? ''}`
}

export function faceShapeLine(ai) {
  const primary = FACE_SHAPE[ai.face_shape.primary]
  const secondary = ai.face_shape.secondary ? FACE_SHAPE[ai.face_shape.secondary] : null
  return hedge(primary, ai.face_shape.confidence, secondary)
}

export function toneLine(ai) {
  const t = TONE[ai.color_tone.tone]
  const v = VALUE[ai.color_tone.axes.value]
  const c = CHROMA[ai.color_tone.axes.chroma]
  const base = hedge(t, ai.color_tone.confidence)
  return `${base}，膚色${v}、對比${c}。`
}

export function volumeLine(ai, proportions) {
  const v = VOLUME[ai.feature_volume.level]
  const props = Object.entries(proportions)
    .filter(([, val]) => val !== 'standard')
    .map(([k, val]) => PROPORTION[k][val])
  const extra = props.length ? `，${props.join('、')}` : '，五官比例接近標準'
  return `五官量感屬於${v}${extra}。`
}

export function skinLine(ai) {
  const s = SKIN[ai.skin.type]
  const obs = (ai.skin.observations || []).map((o) => OBSERVATION[o]).filter(Boolean)
  const obsText = obs.length ? `，照片上看得到${obs.join('、')}` : ''
  const focus = (ai.skin.care_focus || []).slice(0, 3).join('、')
  return `照片初判為${s}${obsText}。保養重點：${focus || '維持現況、注意防曬'}。這是照片初判，不是醫療診斷。`
}

export function blushTip(placements, palettes) {
  const p = BLUSH_PLACEMENT[placements.blush.placement]
  const s = BLUSH_SHAPE[placements.blush.shape]
  return `腮紅刷在${p}，形狀${s}，顏色選${palettes.blush.primary.name}，靠外側那一端收淡。`
}

export function contourTip(placements) {
  const zones = placements.contour.map((z) => CONTOUR_ZONE[z]).join('、')
  return zones ? `修容放在${zones}，用比膚色深一到兩階的冷棕色，邊緣暈開到看不出交界。` : '你的臉型不需要特別修容，保持乾淨的底妝即可。'
}

export function highlightTip(placements) {
  const zones = placements.highlight.map((z) => HIGHLIGHT_ZONE[z]).join('、')
  return `打亮點在${zones}，用細緻微光而非閃片，範圍小一點更自然。`
}

export function eyeLipTip(palettes) {
  const e = palettes.eye.palette.map((c) => c.name).join('、')
  const l = palettes.lip.palette.map((c) => c.name).join('、')
  return `眼影走${e}，唇色選${l}，質地${LIP_FINISH[palettes.lip.finish]}。`
}

export function styleNames(styles = []) {
  return styles.map((s) => STYLE[s]).filter(Boolean)
}

/** 分享卡與 Flex 用的短標籤 */
export function tags(ai, styles = []) {
  const out = [FACE_SHAPE[ai.face_shape.primary], VOLUME[ai.feature_volume.level], TONE[ai.color_tone.tone]]
  const s = styleNames(styles)[0]
  if (s) out.push(s)
  return out.filter(Boolean)
}

/** 預約 / 詢問時預填到 LINE 的精簡報告 */
export function briefSummary(report) {
  const { ai, styles, analysisId } = report
  const st = styleNames(styles).join('、') || '未選'
  return [
    `臉型：${FACE_SHAPE[ai.face_shape.primary]}｜量感：${VOLUME[ai.feature_volume.level]}`,
    `色調：${TONE[ai.color_tone.tone]}（${VALUE[ai.color_tone.axes.value]}・${CHROMA[ai.color_tone.axes.chroma]}）`,
    `膚質：${SKIN[ai.skin.type]}`,
    `想要的風格：${st}`,
    `報告編號：${analysisId}`,
  ].join('\n')
}
