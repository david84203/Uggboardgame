// 所有 enum 的繁體中文標籤。報告、Flex、分享卡、預填文字都從這裡取字，避免各處措辭不一。
export const FACE_SHAPE = {
  round: '圓臉',
  square: '方臉',
  oval: '鵝蛋臉',
  diamond: '菱形臉',
  heart: '心形臉',
  oblong: '長臉',
}

export const VOLUME = { light: '淡顏', medium: '中間量感', bold: '濃顏' }

export const TONE = {
  warm: '暖色調',
  cool: '冷色調',
  neutral_warm: '中性偏暖',
  neutral_cool: '中性偏冷',
}

export const VALUE = { light: '偏亮', medium: '中等', deep: '偏深' }
export const CHROMA = { clear: '鮮明', medium: '中等', muted: '柔霧' }

export const SKIN = { oily: '油性肌', dry: '乾性肌', combination: '混合肌', normal: '中性肌' }

export const OBSERVATION = {
  redness: '泛紅',
  pores: '毛孔',
  dullness: '暗沉',
  shine: '油光',
  dark_circles: '黑眼圈',
  dry_patches: '乾燥',
  acne: '痘痘或痘印',
  uneven_tone: '膚色不均',
}

export const PROPORTION = {
  eye_spacing: { wide: '眼距偏寬', standard: '眼距標準', narrow: '眼距偏窄' },
  midface: { long: '中庭偏長', standard: '中庭標準', short: '中庭偏短' },
  lower_face: { long: '下庭偏長', standard: '下庭標準', short: '下庭偏短' },
  cheekbone: { prominent: '顴骨明顯', standard: '顴骨適中', flat: '顴骨平順' },
  brow_eye_gap: { wide: '眉眼距離寬', standard: '眉眼距離標準', narrow: '眉眼距離窄' },
}

export const BLUSH_PLACEMENT = {
  apple_center: '蘋果肌正中央',
  apple_outer: '蘋果肌外側',
  cheekbone_high: '顴骨上方',
  cheekbone_diagonal: '蘋果肌斜向太陽穴',
  under_eye_wide: '眼下偏內側、橫向',
  horizontal_mid: '臉頰中段橫向',
}

export const BLUSH_SHAPE = {
  round: '圓形',
  oval_diagonal: '斜向橢圓',
  horizontal_band: '橫向帶狀',
  c_shape: 'C 字形',
}

export const CONTOUR_ZONE = {
  temples: '太陽穴',
  hairline_top: '髮際線上緣',
  hairline_sides: '髮際線兩側',
  cheek_hollow: '顴骨下凹陷處',
  jaw_corners: '下顎角',
  jawline: '下顎線',
  chin_tip: '下巴尖',
  nose_sides: '鼻翼兩側',
  forehead_sides: '額頭兩側',
}

export const HIGHLIGHT_ZONE = {
  forehead_center: '額頭中央',
  cheekbone_top: '顴骨上方',
  under_brow: '眉骨下方',
  nose_bridge: '鼻樑',
  cupid_bow: '唇峰',
  chin_center: '下巴中央',
  inner_eye: '眼頭',
}

export const STYLE = {
  korean_bare: '韓系清透裸妝',
  sharp_intellectual: '俐落知性',
  sweet_cool: '甜酷',
  jp_soft_matte: '日系柔霧',
  western_sculpted: '歐美立體',
  french_lazy: '法式慵懶',
  kdrama_lead: '韓劇女主',
  office: '職場通勤',
  date: '約會',
  id_photo: '證件照 / 形象照',
}

export const CONTEXT = { daily: '日常', work: '上班', date: '約會', photo: '拍照', wedding_guest: '婚禮賓客' }

export const SELF_REPORT = { oily_tzone: 'T 區出油', dry: '乾燥', redness: '容易泛紅', acne: '長痘' }

export const LIP_FINISH = { matte: '霧面', satin: '緞面', glossy: '光澤', tint: '染唇感' }

export const QUALITY_ISSUE = {
  no_face: '沒有偵測到臉，請正對鏡頭再拍一次',
  multiple_faces: '畫面裡只能有你一個人',
  not_frontal: '請正對鏡頭，讓兩邊臉一樣多',
  occluded: '請露出額頭與下顎線，拿掉眼鏡或帽子',
  too_dark: '光線不太夠，面向窗戶或開燈再拍一次',
  too_bright: '太亮了，避開直射光源',
  blurry: '照片有點糊，拿穩手機再拍一次',
  heavy_makeup: '這張照片有濃妝或濾鏡，色彩與膚質判斷僅供參考',
  low_resolution: '再靠近一點，讓臉佔畫面三分之一以上',
  face_too_small: '再靠近一點，讓臉佔畫面三分之一以上',
}
