// 記住使用者上次瀏覽到哪，reload 後自動回到原位
const AppState = (() => {
  const KEY = 'penghu-explorer-last-state';

  function save(s) {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch { /* 存不進去就算了，不影響使用 */ }
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY));
    } catch {
      return null;
    }
  }

  return { save, load };
})();
