import { useEffect, useState } from 'react'

// 美妝診斷用自己的 LIFF（Han 的 LINE Login channel），與桌遊店的 LIFF 分開。
const LIFF_ID = import.meta.env.VITE_BEAUTY_LIFF_ID
export const HAN_OA_ID = import.meta.env.VITE_HAN_OA_ID || ''

let liffPromise = null
export function getLiff() {
  if (!liffPromise) {
    liffPromise = (async () => {
      const { default: liff } = await import('@line/liff')
      if (!LIFF_ID) throw new Error('no_liff_id')
      await liff.init({ liffId: LIFF_ID })
      return liff
    })()
  }
  return liffPromise
}

export function useLiff() {
  const [state, setState] = useState({ status: 'loading', liff: null, profile: null, inClient: false, error: null })
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const liff = await getLiff()
        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href })
          return
        }
        const profile = await liff.getProfile().catch(() => null)
        if (alive) setState({ status: 'ready', liff, profile, inClient: liff.isInClient(), error: null })
      } catch (e) {
        // 本機開發（沒有 LIFF ID）：進入 dev 模式，API 端用 DEV_BYPASS
        if (alive) setState({ status: e?.message === 'no_liff_id' ? 'dev' : 'error', liff: null, profile: null, inClient: false, error: e })
      }
    })()
    return () => { alive = false }
  }, [])
  return state
}

export async function getIdToken() {
  try {
    const liff = await getLiff()
    return liff.getIDToken()
  } catch {
    return null
  }
}

/** 開 Han 的官方帳號聊天室並預填文字（LINE oaMessage 格式） */
export function oaMessageUrl(text) {
  if (!HAN_OA_ID) return null
  return `https://line.me/R/oaMessage/${encodeURIComponent(HAN_OA_ID)}/?${encodeURIComponent(text)}`
}

export async function openUrl(url) {
  try {
    const liff = await getLiff()
    if (liff.isInClient()) return liff.openWindow({ url, external: false })
  } catch {}
  window.location.href = url
}

/** 由使用者端把 Flex 傳進聊天室（不耗 OA 額度）。只在 LINE 內 1 對 1 聊天室可用。 */
export async function sendToChat(messages) {
  const liff = await getLiff()
  if (!liff.isInClient()) throw new Error('not_in_client')
  await liff.sendMessages(messages)
}
