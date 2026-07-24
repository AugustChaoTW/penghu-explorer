// Footer 版本號：即時抓 GitHub 最新 commit hash（純前端，無 build step）
(async () => {
  const REPO = 'AugustChaoTW/penghu-explorer';
  const CACHE_KEY = 'penghu-explorer-version-cache';
  const CACHE_TTL_MS = 10 * 60 * 1000; // 10 分鐘內重複載入不重打 API
  const el = document.getElementById('version-info');
  if (!el) return;

  function render(sha, dateStr) {
    const short = sha.slice(0, 7);
    el.innerHTML = `<a href="https://github.com/${REPO}/commit/${sha}" target="_blank" rel="noopener">${short}</a>${dateStr ? ` · ${dateStr}` : ''}`;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      render(cached.sha, cached.date);
      return;
    }

    const res = await fetch(`https://api.github.com/repos/${REPO}/commits/master`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const sha = data.sha;
    const date = formatDate(data.commit.author.date);

    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ sha, date, ts: Date.now() }));
    render(sha, date);
  } catch (err) {
    console.warn('version fetch failed', err);
    el.textContent = '版本資訊暫時無法載入';
  }
})();
