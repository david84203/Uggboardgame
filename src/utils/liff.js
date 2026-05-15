let liffInstance = null;
let initPromise = null;

export function initLiff() {
  const liffId = import.meta.env.VITE_LIFF_ID;
  if (!liffId) return Promise.resolve();
  initPromise = (async () => {
    try {
      const { default: liff } = await import('@line/liff');
      await liff.init({ liffId });
      liffInstance = liff;
    } catch (e) {
      console.warn('LIFF init failed:', e);
    }
  })();
  return initPromise;
}

export function isInLIFF() {
  return liffInstance?.isInClient() ?? false;
}

export async function getLiffProfile() {
  if (initPromise) await initPromise;
  if (!liffInstance?.isInClient()) return null;
  try {
    return await liffInstance.getProfile();
  } catch {
    return null;
  }
}

// 從 LINE 內開外部瀏覽器，非 LINE 環境則開新分頁
export function openExternal(url) {
  if (liffInstance?.isInClient()) {
    liffInstance.openWindow({ url, external: true });
  } else {
    window.open(url, '_blank');
  }
}
