// 色票：冷暖色調 × 明度 × 彩度 → 腮紅 / 唇 / 眼影 / 服裝。全部固定表，AI 不給色碼。
// 命名只用顏色名，不出現任何色彩分類系統名稱。

const P = (name, hex) => ({ name, hex })

const MAKEUP = {
  warm: {
    blush: { light: [P('珊瑚粉', '#F4A28C'), P('蜜桃', '#F7B39B')], medium: [P('珊瑚', '#EE8A6E'), P('杏橘', '#E9946A')], deep: [P('磚紅', '#C9614A'), P('楓葉', '#B95A3F')] },
    lip: { light: [P('蜜桃粉', '#F09A86'), P('珊瑚粉', '#EF8C7A')], medium: [P('珊瑚橘', '#E2725B'), P('杏紅', '#D8674F')], deep: [P('磚紅', '#B5473A'), P('南瓜紅', '#B84A2E')] },
    eye: { light: [P('杏桃', '#F3C8AE'), P('淺金棕', '#D9B48F')], medium: [P('焦糖', '#C8956A'), P('金棕', '#B8865B')], deep: [P('可可棕', '#8E5B3E'), P('橄欖', '#7D7A4E')] },
  },
  cool: {
    blush: { light: [P('藕粉', '#E9B8C6'), P('灰粉', '#E3B4BE')], medium: [P('玫瑰粉', '#DE8FA4'), P('冷粉', '#E58AB0')], deep: [P('莓果', '#B8557A'), P('酒紅', '#9E4A66')] },
    lip: { light: [P('藕粉', '#D9A0B2'), P('玫瑰豆沙', '#C98A98')], medium: [P('玫瑰', '#C86B87'), P('冷粉紅', '#D4648C')], deep: [P('莓果', '#A24A6E'), P('酒紅', '#8B3A57')] },
    eye: { light: [P('灰粉', '#E1C3CC'), P('淺藕紫', '#D3BFD4')], medium: [P('藕紫', '#B497B6'), P('霧灰', '#A9A3AE')], deep: [P('深紫', '#6E4E7A'), P('銀灰', '#8F8F99')] },
  },
  neutral_warm: {
    blush: { light: [P('裸杏', '#F0C2AE'), P('蜜桃棕', '#E8B49E')], medium: [P('豆沙', '#D89A8E'), P('玫瑰棕', '#CF8E80')], deep: [P('楓糖', '#BE7560'), P('紅棕', '#B06553')] },
    lip: { light: [P('裸杏', '#E6AE9C'), P('奶茶', '#D8A28E')], medium: [P('豆沙', '#C88776'), P('玫瑰棕', '#C07A6A')], deep: [P('紅棕', '#A85A4C'), P('楓糖紅', '#A3503F')] },
    eye: { light: [P('奶杏', '#EED3BD'), P('淺駝', '#D9C1A6')], medium: [P('杏棕', '#C9A385'), P('駝棕', '#B89272')], deep: [P('深棕', '#7F5A45'), P('墨綠', '#4F5F4E')] },
  },
  neutral_cool: {
    blush: { light: [P('裸粉', '#EBC0C0'), P('乾燥玫瑰', '#E2B2B4')], medium: [P('豆沙粉', '#D69A9C'), P('灰玫瑰', '#C99396')], deep: [P('莓果棕', '#B06A72'), P('玫瑰紅', '#A85C66')] },
    lip: { light: [P('裸粉', '#DFA9AB'), P('乾燥玫瑰', '#D19A9E')], medium: [P('豆沙粉', '#C48487'), P('灰玫瑰', '#BB7C82')], deep: [P('莓果棕', '#9F5A63'), P('玫瑰紅', '#9A505B')] },
    eye: { light: [P('裸粉', '#E9CFCF'), P('淺灰紫', '#D4C7D2')], medium: [P('灰玫瑰', '#B79399'), P('藕灰', '#A5949E')], deep: [P('深灰棕', '#6F5A5E'), P('藏青', '#3F4A63')] },
  },
}

const CLOTHING = {
  warm: {
    recommended: {
      light: [P('珊瑚', '#F08A76'), P('鵝黃', '#F6D77A'), P('象牙白', '#F5EFE0'), P('蜜桃', '#F7BFA5'), P('淺駝', '#D9C3A5'), P('青草綠', '#9BBF7A')],
      medium: [P('珊瑚', '#F08A76'), P('駝色', '#C8A97E'), P('橄欖綠', '#7E8B4E'), P('焦糖', '#B9834F'), P('象牙白', '#F5EFE0'), P('鐵鏽紅', '#B7563E')],
      deep: [P('鐵鏽紅', '#B7563E'), P('橄欖綠', '#6F7A3F'), P('焦糖', '#A8743F'), P('墨綠', '#3F5A45'), P('駝色', '#C8A97E'), P('芥末黃', '#C9A227')],
    },
    avoid: [P('冷灰', '#9EA3AD'), P('正藍', '#2B5BB5'), P('冰粉', '#F3C9DA'), P('紫紅', '#A0326E')],
    neutrals: [P('象牙白', '#F5EFE0'), P('駝色', '#C8A97E'), P('深棕', '#5C4033')],
    tip: '避雷色不是不能穿，而是大面積時容易讓膚色顯得蠟黃或暗沉；放在下半身或當配件就沒問題。',
  },
  cool: {
    recommended: {
      light: [P('薰衣草', '#B8A9D9'), P('玫瑰粉', '#E8A7B8'), P('薄荷', '#A9DCC8'), P('灰藍', '#8FA9C4'), P('純白', '#FFFFFF'), P('燕麥', '#E6DED2')],
      medium: [P('灰藍', '#7E9BBF'), P('玫瑰粉', '#E8A7B8'), P('薰衣草', '#A997CF'), P('霧灰', '#A8A8B0'), P('純白', '#FFFFFF'), P('莓果', '#9E4A6E')],
      deep: [P('寶藍', '#2F4FA2'), P('莓果', '#8E3F62'), P('藏青', '#2F3A5F'), P('純白', '#FFFFFF'), P('紫紅', '#8E3A6E'), P('炭灰', '#4A4E57')],
    },
    avoid: [P('橘', '#F07A2C'), P('芥末黃', '#C9A227'), P('駝色', '#C8A97E'), P('土黃', '#B8935A')],
    neutrals: [P('純白', '#FFFFFF'), P('霧灰', '#A8A8B0'), P('藏青', '#2F3A5F')],
    tip: '避雷色不是不能穿，而是大面積時容易讓膚色顯得暗沉；放在下半身或當配件就沒問題。',
  },
  neutral_warm: {
    recommended: {
      light: [P('燕麥', '#E6DED2'), P('米白', '#F4EFE6'), P('豆沙', '#D6A59B'), P('淺駝', '#D9C3A5'), P('乾燥玫瑰', '#D8A3A6'), P('鼠尾草綠', '#A7B5A0')],
      medium: [P('燕麥', '#E6DED2'), P('灰駝', '#BBAA95'), P('豆沙', '#D6A59B'), P('墨綠', '#4A5D4E'), P('米白', '#F4EFE6'), P('楓糖', '#B57A5A')],
      deep: [P('墨綠', '#3F5245'), P('藏青', '#2F3A5F'), P('楓糖', '#A86A4C'), P('灰駝', '#A99881'), P('米白', '#F4EFE6'), P('可可', '#6B4A3A')],
    },
    avoid: [P('螢光色', '#C8FF00'), P('高飽和橘', '#FF6A00'), P('亮紫', '#8A2BE2'), P('大面積純黑', '#000000')],
    neutrals: [P('燕麥', '#E6DED2'), P('灰駝', '#BBAA95'), P('墨綠', '#4A5D4E')],
    tip: '中性色調的優勢是安全色很多；避雷的是極端鮮豔的顏色，大面積會搶過膚色。',
  },
  neutral_cool: {
    recommended: {
      light: [P('燕麥', '#E6DED2'), P('米白', '#F4EFE6'), P('乾燥玫瑰', '#D8A3A6'), P('灰藍', '#9FB3C8'), P('裸粉', '#E9C4C4'), P('灰紫', '#B7A9C1')],
      medium: [P('燕麥', '#E6DED2'), P('灰駝', '#BBAA95'), P('乾燥玫瑰', '#D8A3A6'), P('藏青', '#2F3A5F'), P('霧灰', '#A8A8B0'), P('豆沙粉', '#CF9A9C')],
      deep: [P('藏青', '#2F3A5F'), P('莓果棕', '#8E5561'), P('炭灰', '#4A4E57'), P('墨綠', '#3F5245'), P('米白', '#F4EFE6'), P('灰紫', '#7E6F8A')],
    },
    avoid: [P('螢光色', '#C8FF00'), P('高飽和橘', '#FF6A00'), P('亮紫', '#8A2BE2'), P('土黃', '#B8935A')],
    neutrals: [P('燕麥', '#E6DED2'), P('霧灰', '#A8A8B0'), P('藏青', '#2F3A5F')],
    tip: '中性色調的優勢是安全色很多；避雷的是極端鮮豔的顏色，大面積會搶過膚色。',
  },
}

const FINISH_BY_STYLE = {
  korean_bare: 'tint', jp_soft_matte: 'satin', sharp_intellectual: 'satin', sweet_cool: 'matte',
  western_sculpted: 'satin', french_lazy: 'satin', kdrama_lead: 'satin', office: 'satin', date: 'glossy', id_photo: 'satin',
}

/** 依色調與軸給色票。chroma 為 muted 時用同組的第二個（偏灰棕）色作主色。 */
export function resolvePalettes({ tone = 'neutral_warm', value = 'medium', chroma = 'medium' }, styles = []) {
  const mk = MAKEUP[tone] ?? MAKEUP.neutral_warm
  const pick = (arr) => (chroma === 'muted' ? [arr[1], arr[0]] : [arr[0], arr[1]])
  const blush = pick(mk.blush[value] ?? mk.blush.medium)
  const lip = pick(mk.lip[value] ?? mk.lip.medium)
  const eye = pick(mk.eye[value] ?? mk.eye.medium)
  const cl = CLOTHING[tone] ?? CLOTHING.neutral_warm
  const finish = FINISH_BY_STYLE[styles[0]] ?? 'satin'
  return {
    blush: { primary: blush[0], palette: blush },
    lip: { primary: lip[0], palette: lip, finish },
    eye: { primary: eye[0], palette: eye },
    clothing: {
      recommended: cl.recommended[value] ?? cl.recommended.medium,
      avoid: cl.avoid,
      neutrals: cl.neutrals,
      tip: cl.tip,
    },
  }
}
