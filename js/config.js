// 全站設定 — 部署 Apps Script 後把 URL 填進來
const CONFIG = {
  // Apps Script Web App URL（部署後貼上，空字串 = 不上傳，只提供下載）
  uploadUrl: 'https://script.google.com/macros/s/AKfycbxaoMCQs-g6C298tjxyICM8XSkjK_LAidUXr6lDfMRun3xe-zDvIMTnsMx1GpDp8SEQ/exec',
  // 與 apps-script/Code.gs 內 TOKEN 一致的共享密鑰
  uploadToken: 'penghu-family-2026',
  // 家裡的小孩名單
  kids: [
    { id: 'momo', name: 'Momo', emoji: '👧' },
    { id: 'coco', name: 'Coco', emoji: '👧' },
    { id: 'dodo', name: 'Dodo', emoji: '👦' },
    { id: 'aug', name: 'Aug', emoji: '🧑' }
  ],
  // 匯出圖片最長邊
  exportMaxSize: 1600,
  // 每個地點通用的額外表情（顯示在主題表情下方）
  commonEmojis: [
    '😀', '😍', '🥳', '😮', '🤔', '😎',
    '❤️', '⭐', '👍', '👏', '🎉', '✨',
    '☀️', '🌈', '☁️', '💧', '🔥', '🌸'
  ]
};
