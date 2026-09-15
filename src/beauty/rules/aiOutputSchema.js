// AI 唯一需要回傳的東西：五個分類 + 兩句話。其餘全由規則推導。
// 同一份 schema 給 Structured Output（伺服端保證）與後端二次驗證。
export const AI_OUTPUT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['quality', 'face_shape', 'feature_volume', 'color_tone', 'skin', 'notes'],
  properties: {
    quality: {
      type: 'object',
      additionalProperties: false,
      required: ['ok', 'issues'],
      properties: {
        ok: { type: 'boolean' },
        issues: {
          type: 'array',
          items: { type: 'string', enum: ['no_face', 'multiple_faces', 'not_frontal', 'occluded', 'too_dark', 'too_bright', 'blurry', 'heavy_makeup', 'low_resolution'] },
        },
      },
    },
    face_shape: {
      type: 'object',
      additionalProperties: false,
      required: ['primary', 'secondary', 'confidence', 'evidence'],
      properties: {
        primary: { type: 'string', enum: ['round', 'square', 'oval', 'diamond', 'heart', 'oblong'] },
        secondary: { type: ['string', 'null'], enum: ['round', 'square', 'oval', 'diamond', 'heart', 'oblong', null] },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        evidence: { type: 'array', maxItems: 3, items: { type: 'string' } },
      },
    },
    feature_volume: {
      type: 'object',
      additionalProperties: false,
      required: ['level', 'confidence'],
      properties: {
        level: { type: 'string', enum: ['light', 'medium', 'bold'] },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
      },
    },
    color_tone: {
      type: 'object',
      additionalProperties: false,
      required: ['tone', 'confidence', 'axes', 'evidence'],
      properties: {
        tone: { type: 'string', enum: ['warm', 'cool', 'neutral_warm', 'neutral_cool'] },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        axes: {
          type: 'object',
          additionalProperties: false,
          required: ['value', 'chroma'],
          properties: {
            value: { type: 'string', enum: ['light', 'medium', 'deep'] },
            chroma: { type: 'string', enum: ['clear', 'medium', 'muted'] },
          },
        },
        evidence: { type: 'array', maxItems: 3, items: { type: 'string' } },
      },
    },
    skin: {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'confidence', 'observations', 'care_focus'],
      properties: {
        type: { type: 'string', enum: ['oily', 'dry', 'combination', 'normal'] },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        observations: { type: 'array', items: { type: 'string', enum: ['redness', 'pores', 'dullness', 'shine', 'dark_circles', 'dry_patches', 'acne', 'uneven_tone'] } },
        care_focus: { type: 'array', maxItems: 3, items: { type: 'string' } },
      },
    },
    notes: {
      type: 'object',
      additionalProperties: false,
      required: ['personal_line', 'style_line'],
      properties: {
        personal_line: { type: 'string', description: '40 到 70 字，描述這張臉最有特色、最值得強調的一點，溫暖具體' },
        style_line: { type: 'string', description: '60 到 100 字，依客人勾選的風格說明怎麼調整成適合她的版本' },
      },
    },
  },
}
