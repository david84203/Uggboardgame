// 把 AI 的分類結果 + 客端量測 → 完整報告。後端呼叫，結果存進 Firestore，前端只渲染。
import { classifyProportions } from './faceShape.js'
import { resolvePlacements } from './placements.js'
import { resolvePalettes } from './palettes.js'
import * as copy from './copy.js'

export const REPORT_VERSION = '1.0'

export function buildReport({ ai, metrics, styles = [], context = null, selfReport = [], analysisId }) {
  const proportions = classifyProportions(metrics)
  const placements = resolvePlacements(ai.face_shape.primary, proportions)
  const palettes = resolvePalettes(ai.color_tone.tone ? { tone: ai.color_tone.tone, ...ai.color_tone.axes } : {}, styles)
  const partial = ai.quality.issues.includes('heavy_makeup')

  const report = {
    version: REPORT_VERSION,
    analysisId,
    styles,
    context,
    selfReport,
    partial,
    ai,
    proportions,
    placements,
    palettes,
    text: {
      headline: copy.headline(ai),
      face: copy.faceShapeLine(ai),
      volume: copy.volumeLine(ai, proportions),
      tone: copy.toneLine(ai),
      skin: copy.skinLine(ai),
      blush: copy.blushTip(placements, palettes),
      contour: copy.contourTip(placements),
      highlight: copy.highlightTip(placements),
      eyeLip: copy.eyeLipTip(palettes),
      personal: ai.notes?.personal_line ?? '',
      style: ai.notes?.style_line ?? '',
      placementLine: placements.line,
      placementNotes: placements.notes,
    },
    tags: copy.tags(ai, styles),
  }
  report.brief = copy.briefSummary(report)
  return report
}

/** Firestore users.tags 用的機器標籤 */
export function machineTags(report) {
  const { ai, styles } = report
  return [
    `face:${ai.face_shape.primary}`,
    `tone:${ai.color_tone.tone}`,
    `volume:${ai.feature_volume.level}`,
    `skin:${ai.skin.type}`,
    ...styles.map((s) => `style:${s}`),
    'stage:analyzed',
  ]
}
