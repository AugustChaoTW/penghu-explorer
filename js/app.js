// 主流程：路由 + 各頁事件
(async () => {
  const state = { trip: null, kid: null, location: null, lastWork: null };
  let editorReady = false;

  const TRIP_FILES = ['data/trips/penghu.json', 'data/trips/europe.json'];
  const trips = await Promise.all(
    TRIP_FILES.map(path => fetch(path).then(r => r.json()))
  );

  const views = ['home', 'learn', 'create', 'done'];
  function show(view) {
    views.forEach(v => document.getElementById('view-' + v).classList.toggle('hidden', v !== view));
    window.scrollTo(0, 0);
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    if (view === 'home') refreshVisibleCards();
  }

  // --- 首頁：小孩按鈕 ---
  const kidWrap = document.getElementById('kid-buttons');
  CONFIG.kids.forEach(kid => {
    const btn = document.createElement('button');
    btn.className = 'kid-btn';
    btn.textContent = `${kid.emoji} ${kid.name}`;
    btn.addEventListener('click', () => {
      state.kid = kid;
      kidWrap.querySelectorAll('.kid-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      refreshVisibleCards();
    });
    kidWrap.appendChild(btn);
  });

  // --- 首頁：三階段導覽 —— 旅程 → 國家（若有）→ 地點 ---
  const tripWrap = document.getElementById('trip-cards');
  const tripPicker = document.getElementById('trip-picker');
  const countryPicker = document.getElementById('country-picker');
  const countryTitle = document.getElementById('country-picker-title');
  const countryWrap = document.getElementById('country-cards');
  const locationPicker = document.getElementById('location-picker');
  const locationTitle = document.getElementById('location-picker-title');
  const locationProgress = document.getElementById('location-picker-progress');
  const cardWrap = document.getElementById('location-cards');

  let lastCountryTrip = null;
  let lastLocations = null;

  function showStage(stage) {
    tripPicker.classList.toggle('hidden', stage !== 'trip');
    countryPicker.classList.toggle('hidden', stage !== 'country');
    locationPicker.classList.toggle('hidden', stage !== 'location');
  }

  function refreshVisibleCards() {
    renderTripCards();
    if (!countryPicker.classList.contains('hidden') && lastCountryTrip) {
      renderCountryCards(lastCountryTrip);
    }
    if (!locationPicker.classList.contains('hidden') && lastLocations) {
      renderLocationCards(lastLocations);
    }
  }

  function progressBadge(done, total) {
    if (!state.kid || total === 0) return '';
    return `<div class="progress-count">${done === total ? '🌟' : '⭐'} ${done}/${total} 已完成</div>`;
  }

  function renderTripCards() {
    tripWrap.innerHTML = '';
    trips.forEach(trip => {
      const done = Progress.countDone(state.kid && state.kid.id, trip.id, trip.locations);
      const card = document.createElement('button');
      card.className = 'trip-card';
      card.innerHTML = `
        ${trip.image ? `<img src="${trip.image}" alt="${trip.name}" loading="lazy">` : ''}
        <div class="trip-card-body">
          <h3>${trip.name}</h3>
          ${trip.dateRange ? `<div class="trip-date">${trip.dateRange}</div>` : ''}
          <div class="trip-count">${trip.locations.length} 個地點</div>
          ${progressBadge(done, trip.locations.length)}
        </div>`;
      card.addEventListener('click', () => selectTrip(trip));
      tripWrap.appendChild(card);
    });
  }
  renderTripCards();

  function selectTrip(trip) {
    state.trip = trip;
    if (trip.parts && trip.parts.length) {
      lastCountryTrip = trip;
      renderCountryCards(trip);
      countryTitle.textContent = `${trip.name}：要去哪個國家？`;
      showStage('country');
    } else {
      locationTitle.textContent = trip.name;
      renderLocationCards(trip.locations);
      showStage('location');
    }
  }

  function renderCountryCards(trip) {
    countryWrap.innerHTML = '';
    trip.parts.forEach(part => {
      const partKey = `${part.flag} ${part.name}`;
      const partLocations = trip.locations.filter(l => l.part === partKey);
      const done = Progress.countDone(state.kid && state.kid.id, trip.id, partLocations);
      const card = document.createElement('button');
      card.className = 'trip-card';
      card.innerHTML = `
        ${part.image ? `<img src="${part.image}" alt="${part.name}" loading="lazy">` : ''}
        <div class="trip-card-body">
          <h3>${part.flag} ${part.name}</h3>
          ${part.subtitle ? `<div class="trip-date">${part.subtitle}</div>` : ''}
          <div class="trip-count">${partLocations.length} 個地點</div>
          ${progressBadge(done, partLocations.length)}
        </div>`;
      card.addEventListener('click', () => {
        locationTitle.textContent = `${part.flag} ${part.name}`;
        renderLocationCards(partLocations);
        showStage('location');
      });
      countryWrap.appendChild(card);
    });
  }

  function renderLocationCards(locations) {
    lastLocations = locations;
    cardWrap.innerHTML = '';

    const doneCount = Progress.countDone(state.kid && state.kid.id, state.trip.id, locations);
    locationProgress.textContent = state.kid ? `${state.kid.emoji} ${state.kid.name}：${doneCount}/${locations.length} 已完成` : '';

    locations.forEach(loc => {
      const isDone = Progress.isDone(state.kid && state.kid.id, state.trip.id, loc.id);
      const card = document.createElement('button');
      card.className = 'location-card' + (isDone ? ' is-done' : '');
      const label = loc.theme || (loc.badge && loc.badge.name) || '';
      const titlePrefix = loc.chapterTitle ? `${loc.chapterTitle}　` : '';
      card.innerHTML = `
        ${isDone ? '<div class="done-check">✅</div>' : ''}
        ${loc.image ? `<img src="${loc.image}" alt="${loc.name}" loading="lazy">` : '<div class="location-card-noimg">🗺️</div>'}
        <div class="card-body">
          ${label ? `<div class="theme">${label}</div>` : ''}
          <h3>${titlePrefix}${loc.name}</h3>
        </div>`;
      card.addEventListener('click', () => openLocation(loc, state.trip));
      cardWrap.appendChild(card);
    });
  }

  document.getElementById('btn-back-trips').addEventListener('click', () => {
    renderTripCards();
    showStage('trip');
  });

  document.getElementById('btn-back-up').addEventListener('click', () => {
    if (state.trip && state.trip.parts && state.trip.parts.length) {
      showStage('country');
    } else {
      showStage('trip');
    }
  });

  function openLocation(loc, trip) {
    if (!state.kid) {
      alert('先選你是誰喔！');
      return;
    }
    state.trip = trip || state.trip;
    state.location = loc;
    Learn.render(loc);
    show('learn');
  }

  // --- 返回按鈕 ---
  document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => show(btn.dataset.goto));
  });

  // --- 教材 → 創作 ---
  document.getElementById('btn-start-create').addEventListener('click', () => {
    document.getElementById('create-title').textContent = `${state.kid.emoji} ${state.location.name}`;
    document.getElementById('photo-step').classList.remove('hidden');
    document.getElementById('editor').classList.add('hidden');
    show('create');
  });

  // --- 拍照 / 選照片 ---
  document.getElementById('photo-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => startEditor(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  document.getElementById('btn-blank-canvas').addEventListener('click', () => startEditor(null));

  async function startEditor(imageDataUrl) {
    document.getElementById('photo-step').classList.add('hidden');
    document.getElementById('editor').classList.remove('hidden');

    if (!editorReady) {
      Editor.init(document.getElementById('stage-container'));
      editorReady = true;
    }
    Editor.reset();
    if (imageDataUrl) await Editor.setBackground(imageDataUrl);
    const dateStr = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
    Editor.setStamp(`📍 ${state.location.name} ・ ${state.kid.name} ・ ${dateStr}`);
    buildEmojiPanel();
  }

  // --- 工具列 ---
  const emojiPanel = document.getElementById('emoji-panel');

  document.querySelectorAll('.tool[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.tool;
      document.querySelectorAll('.tool[data-tool]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      emojiPanel.classList.toggle('hidden', t !== 'emoji');

      if (t === 'text') {
        const str = prompt('要寫什麼字呢？');
        if (str) Editor.addText(str);
        Editor.setTool('select');
      } else {
        Editor.setTool(t);
      }
    });
  });

  document.getElementById('btn-undo').addEventListener('click', () => Editor.undo());
  document.getElementById('btn-clear').addEventListener('click', () => {
    if (confirm('全部清掉重畫嗎？')) Editor.reset();
  });

  document.querySelectorAll('.color').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Editor.setColor(btn.dataset.color);
    });
  });

  function buildEmojiPanel() {
    emojiPanel.innerHTML = '';

    function addSection(label, chars) {
      const heading = document.createElement('div');
      heading.className = 'emoji-section-label';
      heading.textContent = label;
      emojiPanel.appendChild(heading);

      const grid = document.createElement('div');
      grid.className = 'emoji-grid';
      chars.forEach(char => {
        const btn = document.createElement('button');
        btn.textContent = char;
        btn.addEventListener('click', () => Editor.addEmoji(char));
        grid.appendChild(btn);
      });
      emojiPanel.appendChild(grid);
    }

    const loc = state.location;
    if (loc.emojis && loc.emojis.length) {
      const label = loc.theme || (loc.badge && loc.badge.name) || '主題';
      addSection(`${label}主題`, loc.emojis);
    }
    addSection('更多表情', CONFIG.commonEmojis);
  }

  // --- 完成作品 ---
  document.getElementById('btn-save').addEventListener('click', async () => {
    const png = Editor.toPNG();
    const work = {
      kid: state.kid.name,
      location: state.location.name,
      locationId: `${state.trip ? state.trip.id + '-' : ''}${state.location.id}`,
      image: png.split(',')[1], // base64 only
      json: Editor.toJSON(),
      createdAt: new Date().toISOString()
    };
    state.lastWork = { png, work };
    Progress.markDone(state.kid.id, state.trip.id, state.location.id);

    document.getElementById('done-preview').src = png;
    const viewBtn = document.getElementById('btn-view-online');
    viewBtn.classList.add('hidden');
    show('done');

    const result = await Uploader.submit(work);
    document.getElementById('done-status').textContent = result.message;
    if (result.url) {
      viewBtn.href = result.url;
      viewBtn.classList.remove('hidden');
    }
  });

  // --- 下載 ---
  document.getElementById('btn-download').addEventListener('click', () => {
    if (!state.lastWork) return;
    const a = document.createElement('a');
    a.href = state.lastWork.png;
    a.download = `${state.lastWork.work.locationId}-${state.kid.name}-${Date.now()}.png`;
    a.click();
  });

  // --- ?trip=xxx&location=001 直達（QR Code 用）；只給 location 時預設澎湖（向下相容舊 QR）---
  const params = new URLSearchParams(location.search);
  const wantedLocation = params.get('location');
  if (wantedLocation) {
    const wantedTripId = params.get('trip');
    const trip = wantedTripId
      ? trips.find(t => t.id === wantedTripId)
      : trips.find(t => t.locations.some(l => l.id === wantedLocation)) || trips[0];
    const loc = trip && trip.locations.find(l => l.id === wantedLocation);
    if (trip && loc) {
      state.kid = state.kid || CONFIG.kids[0]; // 直達時預設第一位，仍可回首頁改
      openLocation(loc, trip);
    }
  }

  Uploader.flush();
})();
