# 🏝️ 澎湖小小探險家（penghu-explorer）

給小孩用的戶外探索學習 Web App（Pilot）。
純靜態網站（HTML/CSS/JS + Konva.js），可部署到 GitHub Pages；作品上傳走 Google Apps Script → 家長的 Google Drive。

## Pilot 地點（3 個 UAT case）

| id | 地點 | 主題 | 直達網址 |
|---|---|---|---|
| 001 | 澎湖天后宮 | 人文歷史 | `index.html?location=001` |
| 002 | 南寮古厝 | 傳統村落 | `index.html?location=002` |
| 003 | 奎壁山摩西分海 | 潮汐地質 | `index.html?location=003` |

## 使用流程

1. 選「你是誰」（小孩名單在 `js/config.js`）
2. 選地點 → 閱讀教材（故事、冷知識、照片、任務）
3. 開始探索 → 拍照或空白畫布
4. 畫畫 ✏️ / Emoji 😀 / 文字 🔤 / Undo ↩️
5. 完成作品 → 上傳到 Drive（未設定時可下載到裝置）

## 本機測試

```bash
cd penghu-explorer
python3 -m http.server 8000
# 開 http://localhost:8000
```

不能用 `file://` 直接開（fetch locations.json 會被擋）。

## 部署 GitHub Pages

1. push 到 GitHub repo
2. Settings → Pages → Deploy from branch → main / root（或 `/penghu-explorer` 子目錄結構自行調整）
3. 網址：`https://<user>.github.io/<repo>/`

## 啟用 Drive 上傳

1. 到 [script.google.com](https://script.google.com) 建新專案，貼上 `apps-script/Code.gs`
2. 修改 `TOKEN`（同步改 `js/config.js` 的 `uploadToken`）
3. Deploy → Web app → Execute as: **Me** / Who has access: **Anyone**
4. 複製 Web app URL 填入 `js/config.js` 的 `uploadUrl`
5. 作品會存到 Drive `澎湖探索作品/<地點>/<小孩>/時間戳.png` + 同名 `.json`

沒網路時作品自動暫存（IndexedDB），恢復連線自動補傳。

## 目錄結構

```text
index.html          單頁應用（首頁/教材/創作/完成 四個 view）
css/style.css
js/
  config.js         上傳 URL、token、小孩名單
  app.js            路由與主流程
  learn.js          教材頁渲染
  canvas.js         Konva 畫布（畫筆/橡皮擦/Emoji/文字/Undo）
  upload.js         上傳 + 失敗轉佇列
  queue.js          IndexedDB 離線佇列
data/locations.json 三地點教材資料
images/<id>/        教材圖（授權見 CREDITS.md）
vendor/konva.min.js
apps-script/Code.gs Apps Script 上傳端點（備份，部署在 Google）
```

## UAT 檢查清單

- [ ] 三地點教材頁圖文正常顯示（手機直式）
- [ ] 「唸給我聽」可朗讀故事
- [ ] 拍照/選照片進畫布，照片鋪滿背景
- [ ] 手指可畫線、換色、橡皮擦、Undo、清空
- [ ] Emoji 點選置入，可拖曳/縮放/旋轉
- [ ] 文字工具可輸入中文
- [ ] 完成作品 → 預覽 + 下載 PNG 成功
- [ ] 設定 uploadUrl 後作品出現在 Drive
- [ ] 飛航模式完成作品 → 恢復網路自動補傳
- [ ] `?location=002` QR 直達教材頁
