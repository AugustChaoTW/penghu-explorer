// 上傳：POST 到 Apps Script；失敗或離線時進佇列
const Uploader = (() => {

  async function post(payload) {
    // Content-Type 用 text/plain 避開 CORS preflight（Apps Script 不處理 OPTIONS）
    const res = await fetch(CONFIG.uploadUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!data.ok) throw new Error('server rejected');
    return data;
  }

  // 送出一件作品；回傳狀態字串供 UI 顯示
  async function submit(work) {
    const payload = { ...work, token: CONFIG.uploadToken };

    if (!CONFIG.uploadUrl) {
      return { status: 'no-upload', message: '尚未設定上傳，請用「下載」保存作品。' };
    }
    if (!navigator.onLine) {
      await Queue.add(payload);
      return { status: 'queued', message: '沒有網路，作品已暫存，回到有網路的地方會自動上傳。' };
    }
    try {
      await post(payload);
      return { status: 'uploaded', message: '作品已上傳到爸爸的雲端硬碟！' };
    } catch (err) {
      console.error('upload failed', err);
      await Queue.add(payload);
      return { status: 'queued', message: '上傳失敗，作品已暫存，稍後會自動重試。' };
    }
  }

  // 網路恢復後重送佇列
  async function flush() {
    if (!CONFIG.uploadUrl || !navigator.onLine) return;
    const items = await Queue.all();
    for (const item of items) {
      try {
        await post(item.payload);
        await Queue.remove(item.id);
        console.log('queued upload sent', item.id);
      } catch (err) {
        console.warn('retry later', item.id, err);
        break; // 還是失敗就整批下次再試
      }
    }
  }

  window.addEventListener('online', flush);

  return { submit, flush };
})();
