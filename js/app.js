// 主流程：路由 + 各頁事件
(async () => {
  const state = { kid: null, location: null, lastWork: null };
  let editorReady = false;

  const res = await fetch('data/locations.json');
  const { locations } = await res.json();

  const views = ['home', 'learn', 'create', 'done'];
  function show(view) {
    views.forEach(v => document.getElementById('view-' + v).classList.toggle('hidden', v !== view));
    window.scrollTo(0, 0);
    if ('speechSynthesis' in window) speechSynthesis.cancel();
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
    });
    kidWrap.appendChild(btn);
  });

  // --- 首頁：地點卡片 ---
  const cardWrap = document.getElementById('location-cards');
  locations.forEach(loc => {
    const card = document.createElement('button');
    card.className = 'location-card';
    card.innerHTML = `
      <img src="${loc.image}" alt="${loc.name}" loading="lazy">
      <div class="card-body">
        <div class="theme">${loc.theme}</div>
        <h3>${loc.name}</h3>
      </div>`;
    card.addEventListener('click', () => openLocation(loc));
    cardWrap.appendChild(card);
  });

  function openLocation(loc) {
    if (!state.kid) {
      alert('先選你是誰喔！');
      return;
    }
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

    addSection(`${state.location.theme}主題`, state.location.emojis);
    addSection('更多表情', CONFIG.commonEmojis);
  }

  // --- 完成作品 ---
  document.getElementById('btn-save').addEventListener('click', async () => {
    const png = Editor.toPNG();
    const work = {
      kid: state.kid.name,
      location: state.location.name,
      locationId: state.location.id,
      image: png.split(',')[1], // base64 only
      json: Editor.toJSON(),
      createdAt: new Date().toISOString()
    };
    state.lastWork = { png, work };

    document.getElementById('done-preview').src = png;
    show('done');

    const result = await Uploader.submit(work);
    document.getElementById('done-status').textContent = result.message;
  });

  // --- 下載 ---
  document.getElementById('btn-download').addEventListener('click', () => {
    if (!state.lastWork) return;
    const a = document.createElement('a');
    a.href = state.lastWork.png;
    a.download = `${state.lastWork.work.locationId}-${state.kid.name}-${Date.now()}.png`;
    a.click();
  });

  // --- ?location=001 直達（QR Code 用）---
  const wanted = new URLSearchParams(location.search).get('location');
  if (wanted) {
    const loc = locations.find(l => l.id === wanted);
    if (loc) {
      state.kid = state.kid || CONFIG.kids[0]; // 直達時預設第一位，仍可回首頁改
      openLocation(loc);
    }
  }

  Uploader.flush();
})();
