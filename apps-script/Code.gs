// 澎湖小小探險家 — 作品上傳端點
// 部署：Apps Script > Deploy > Web app > Execute as: Me / Who has access: Anyone
// 部署後把 Web app URL 填進前端 js/config.js 的 uploadUrl

const TOKEN = 'penghu-family-2026'; // 與 js/config.js 的 uploadToken 一致
const ROOT_FOLDER = '澎湖探索作品';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.token !== TOKEN) return respond({ ok: false, error: 'bad token' });
    if (!data.image || !data.kid || !data.location) {
      return respond({ ok: false, error: 'missing fields' });
    }

    const folder = getOrCreatePath([ROOT_FOLDER, data.location, data.kid]);
    const stamp = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyyMMdd-HHmmss');

    const png = Utilities.newBlob(
      Utilities.base64Decode(data.image), 'image/png', stamp + '.png');
    const file = folder.createFile(png);
    // 開連結即可查看（不用登入同一個 Google 帳號），方便小孩在自己裝置上點開
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    if (data.json) {
      folder.createFile(stamp + '.json', JSON.stringify(data.json), 'application/json');
    }

    return respond({ ok: true, file: stamp + '.png', url: file.getUrl() });
  } catch (err) {
    return respond({ ok: false, error: String(err) });
  }
}

function getOrCreatePath(names) {
  let parent = DriveApp.getRootFolder();
  names.forEach(name => {
    const found = parent.getFoldersByName(name);
    parent = found.hasNext() ? found.next() : parent.createFolder(name);
  });
  return parent;
}

function respond(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
