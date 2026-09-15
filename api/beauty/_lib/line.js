// LINE ID Token 驗證：不信任客端傳來的 userId，一律用 LINE 的 verify 端點換出 sub。
const VERIFY_URL = 'https://api.line.me/oauth2/v2.1/verify'

export async function verifyIdToken(idToken) {
  const clientId = process.env.LINE_LOGIN_CHANNEL_ID
  if (!clientId) throw Object.assign(new Error('LINE_LOGIN_CHANNEL_ID not set'), { status: 500 })
  if (!idToken) throw Object.assign(new Error('missing id token'), { status: 401 })
  const body = new URLSearchParams({ id_token: idToken, client_id: clientId })
  const res = await fetch(VERIFY_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json.sub) throw Object.assign(new Error(json.error_description || 'invalid id token'), { status: 401 })
  return { uid: json.sub, name: json.name ?? null, picture: json.picture ?? null }
}

/**
 * 本機開發或內部測試：DEV_BYPASS_TOKEN 設定後，客端傳同一個字串可跳過 LINE 驗證。
 * 正式環境不要設定這個變數。
 */
export async function authenticate(idToken) {
  const bypass = process.env.DEV_BYPASS_TOKEN
  if (bypass && idToken === bypass) return { uid: 'dev-user', name: 'Dev', picture: null }
  return verifyIdToken(idToken)
}
