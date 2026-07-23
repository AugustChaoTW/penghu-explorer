// 完成度追蹤：存在 localStorage，依小孩分開記錄
const Progress = (() => {
  const KEY = 'penghu-explorer-progress';

  function loadAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch {
      return {};
    }
  }

  function saveAll(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function key(tripId, locationId) {
    return `${tripId}:${locationId}`;
  }

  function markDone(kidId, tripId, locationId) {
    if (!kidId) return;
    const all = loadAll();
    all[kidId] = all[kidId] || {};
    all[kidId][key(tripId, locationId)] = true;
    saveAll(all);
  }

  function isDone(kidId, tripId, locationId) {
    if (!kidId) return false;
    const all = loadAll();
    return !!(all[kidId] && all[kidId][key(tripId, locationId)]);
  }

  // 給一組地點，回傳完成數
  function countDone(kidId, tripId, locations) {
    if (!kidId) return 0;
    return locations.reduce((n, loc) => n + (isDone(kidId, tripId, loc.id) ? 1 : 0), 0);
  }

  return { markDone, isDone, countDone };
})();
