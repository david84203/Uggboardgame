let liffInstance = null;

export async function initLiff() {
  const liffId = import.meta.env.VITE_LIFF_ID;
  if (!liffId) return;
  try {
    const { default: liff } = await import('@line/liff');
    await liff.init({ liffId });
    liffInstance = liff;
  } catch (e) {
    console.warn('LIFF init failed:', e);
  }
}

export function isInLIFF() {
  return liffInstance?.isInClient() ?? false;
}

// 從 LINE 內開外部瀏覽器，非 LINE 環境則開新分頁
export function openExternal(url) {
  if (liffInstance?.isInClient()) {
    liffInstance.openWindow({ url, external: true });
  } else {
    window.open(url, '_blank');
  }
}
