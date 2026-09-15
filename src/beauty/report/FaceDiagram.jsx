// 臉部圖解：6 個臉型底圖 + 依 placements 顯示的區塊。座標系 600×720，眼睛連線 y≈300。
// 這是第一版程式繪製的示意圖，設計師之後可用同 id 的 SVG 圖層替換。

const OUTLINE = {
  round:   'M300 78 C420 78 470 180 470 320 C470 470 400 640 300 648 C200 640 130 470 130 320 C130 180 180 78 300 78 Z',
  square:  'M300 78 C420 80 462 150 462 300 C462 470 445 600 400 640 C360 660 240 660 200 640 C155 600 138 470 138 300 C138 150 180 80 300 78 Z',
  oval:    'M300 70 C405 70 452 170 452 310 C452 470 390 645 300 660 C210 645 148 470 148 310 C148 170 195 70 300 70 Z',
  diamond: 'M300 74 C375 74 420 170 465 320 C440 470 370 640 300 664 C230 640 160 470 135 320 C180 170 225 74 300 74 Z',
  heart:   'M300 74 C420 74 470 150 470 300 C470 440 380 620 300 664 C220 620 130 440 130 300 C130 150 180 74 300 74 Z',
  oblong:  'M300 60 C395 60 440 150 440 310 C440 480 390 660 300 680 C210 660 160 480 160 310 C160 150 205 60 300 60 Z',
}

const BLUSH = {
  apple_center: [[215, 385, 45, 38, 0], [385, 385, 45, 38, 0]],
  apple_outer: [[195, 380, 48, 36, 0], [405, 380, 48, 36, 0]],
  cheekbone_high: [[185, 345, 50, 30, -10], [415, 345, 50, 30, 10]],
  cheekbone_diagonal: [[185, 360, 62, 32, -35], [415, 360, 62, 32, 35]],
  under_eye_wide: [[220, 358, 60, 28, 0], [380, 358, 60, 28, 0]],
  horizontal_mid: [[195, 385, 70, 28, 0], [405, 385, 70, 28, 0]],
}
const CONTOUR = {
  temples: [[150, 200, 30, 55, 0], [450, 200, 30, 55, 0]],
  hairline_top: [[300, 95, 170, 30, 0]],
  hairline_sides: [[165, 140, 40, 45, 0], [435, 140, 40, 45, 0]],
  cheek_hollow: [[172, 420, 55, 26, -30], [428, 420, 55, 26, 30]],
  jaw_corners: [[165, 560, 40, 45, 0], [435, 560, 40, 45, 0]],
  jawline: [[205, 600, 60, 22, -40], [395, 600, 60, 22, 40]],
  chin_tip: [[300, 655, 60, 25, 0]],
  nose_sides: [[283, 360, 8, 45, 0], [317, 360, 8, 45, 0]],
  forehead_sides: [[160, 150, 45, 60, 0], [440, 150, 45, 60, 0]],
}
const HIGHLIGHT = {
  forehead_center: [[300, 190, 45, 60, 0]],
  cheekbone_top: [[190, 330, 50, 20, -20], [410, 330, 50, 20, 20]],
  under_brow: [[215, 262, 50, 12, 0], [385, 262, 50, 12, 0]],
  nose_bridge: [[300, 330, 12, 70, 0]],
  cupid_bow: [[300, 455, 22, 10, 0]],
  chin_center: [[300, 610, 40, 28, 0]],
  inner_eye: [[262, 305, 14, 12, 0], [338, 305, 14, 12, 0]],
}

function Zone({ shapes, fill, opacity, id }) {
  return (
    <g id={id} filter="url(#soft)" opacity={opacity}>
      {shapes.map(([cx, cy, rx, ry, rot], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} transform={`rotate(${rot} ${cx} ${cy})`} />
      ))}
    </g>
  )
}

export default function FaceDiagram({ faceShape = 'oval', placements, blushHex = '#E9A0A0', layers = { blush: true, contour: true, highlight: true }, className = '' }) {
  const outline = OUTLINE[faceShape] ?? OUTLINE.oval
  return (
    <svg viewBox="0 0 600 720" className={className} role="img" aria-label="腮紅、修容、打亮位置示意">
      <defs>
        <filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" /></filter>
        <clipPath id="faceClip"><path d={outline} /></clipPath>
      </defs>
      <path d={outline} fill="#FBF1E8" stroke="#C9B29B" strokeWidth="3" />
      {/* 五官線稿 */}
      <g fill="none" stroke="#9C7E66" strokeWidth="3" strokeLinecap="round">
        <path d="M185 258 Q225 238 262 255" /><path d="M338 255 Q375 238 415 258" />
        <path d="M195 300 Q225 280 258 300 Q225 320 195 300 Z" /><path d="M342 300 Q375 280 405 300 Q375 320 342 300 Z" />
        <path d="M300 330 L292 405 Q300 415 308 405 Z" />
        <path d="M262 478 Q300 462 338 478 Q300 500 262 478 Z" />
      </g>
      <g fill="#6B4E3D"><circle cx="226" cy="300" r="8" /><circle cx="374" cy="300" r="8" /></g>
      <g clipPath="url(#faceClip)">
        {layers.contour && placements?.contour?.map((z) => CONTOUR[z] && <Zone key={z} id={`contour_${z}`} shapes={CONTOUR[z]} fill="#A67C5B" opacity="0.5" />)}
        {layers.blush && placements?.blush?.placement && BLUSH[placements.blush.placement] && (
          <Zone id={`blush_${placements.blush.placement}`} shapes={BLUSH[placements.blush.placement]} fill={blushHex} opacity="0.62" />
        )}
        {layers.highlight && placements?.highlight?.map((z) => HIGHLIGHT[z] && <Zone key={z} id={`highlight_${z}`} shapes={HIGHLIGHT[z]} fill="#FFF6DC" opacity="0.95" />)}
      </g>
    </svg>
  )
}
