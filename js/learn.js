// 教材頁渲染 — 同時支援澎湖版（story/funFacts/gallery/tasks）
// 與中歐版（intro/quote/badge/tasks 含 checklist/fillIns/reflect/…）schema
const Learn = (() => {

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function speak(paragraphs) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(paragraphs.join('。'));
    utter.lang = 'zh-TW';
    utter.rate = 0.9;
    speechSynthesis.speak(utter);
  }

  // 單一關的朗讀稿：標題/提示/內文/勾選項目/想一想/討論/隱藏挑戰/備註
  function buildTaskScript(t) {
    const parts = [t.title];
    if (t.hint) parts.push(t.hint);
    if (t.body) parts.push(t.body);
    if (t.checklist) parts.push(...t.checklist);
    if (t.options) parts.push('選項有：' + t.options.join('、'));
    if (t.reflect) parts.push('想一想：' + t.reflect);
    if (t.discuss) parts.push(t.discuss);
    if (t.bonus && t.bonus.body) parts.push(t.bonus.label || '隱藏挑戰', t.bonus.body);
    if (t.note) parts.push(t.note);
    return parts;
  }

  // 朗讀稿（教材/任務頁用）：前述 → 第一關 → 第二關 → …
  // 注意：不含 story（睡前故事），那是獨立頁面，活動時間不強迫聽故事
  function buildSpeechScript(loc) {
    const parts = [];

    const intro = Array.isArray(loc.intro) ? loc.intro : (loc.intro ? [loc.intro] : null) || loc.narrative;
    if (intro) parts.push('前述。', ...intro);

    (loc.tasks || []).forEach(t => parts.push(...buildTaskScript(t)));

    return parts;
  }

  function speakButton(script, className) {
    const btn = el('button', className, '🔊');
    btn.type = 'button';
    btn.setAttribute('aria-label', '唸給我聽');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      speak(script);
    });
    return btn;
  }

  function fillInLine(label) {
    const row = el('div', 'fillin-row');
    row.appendChild(el('span', 'fillin-label', label));
    row.appendChild(el('span', 'fillin-blank'));
    return row;
  }

  function checklistBlock(items) {
    const box = el('div', 'checklist');
    items.forEach(text => {
      const row = el('label', 'checklist-item');
      const cb = el('input');
      cb.type = 'checkbox';
      row.appendChild(cb);
      row.appendChild(el('span', null, text));
      box.appendChild(row);
    });
    return box;
  }

  // 中歐版任務卡：body / checklist / fillIns / reflect / discuss / bonus / options / note / drawBox
  function renderWorksheetTask(t) {
    const card = el('div', 'task worksheet-task');
    const titleRow = el('div', 'task-title-row');
    titleRow.appendChild(el('div', 'task-title', t.title));
    titleRow.appendChild(speakButton(buildTaskScript(t), 'btn-speak-task'));
    card.appendChild(titleRow);
    if (t.body) card.appendChild(el('p', 'task-body', t.body));
    if (t.checklist) card.appendChild(checklistBlock(t.checklist));
    if (t.options) {
      const opts = el('div', 'checklist');
      t.options.forEach(text => {
        const row = el('label', 'checklist-item');
        const rb = el('input');
        rb.type = 'radio';
        rb.name = `opt-${Math.random().toString(36).slice(2)}`;
        row.appendChild(rb);
        row.appendChild(el('span', null, text));
        opts.appendChild(row);
      });
      card.appendChild(opts);
    }
    if (t.fillIns) t.fillIns.forEach(label => card.appendChild(fillInLine(label)));
    if (t.drawBox) card.appendChild(el('div', 'draw-box', '✏️ 在這裡畫畫看'));
    if (t.reflect) card.appendChild(el('div', 'task-reflect', `🤔 想一想：${t.reflect}`));
    if (t.discuss) card.appendChild(el('div', 'task-discuss', `💬 ${t.discuss}`));
    if (t.bonus) {
      const bonus = el('div', 'task-bonus');
      bonus.appendChild(el('div', 'task-bonus-label', `🌟 ${t.bonus.label || '隱藏挑戰'}`));
      if (t.bonus.body) bonus.appendChild(el('p', null, t.bonus.body));
      if (t.bonus.fields) t.bonus.fields.forEach(label => bonus.appendChild(fillInLine(label)));
      if (t.bonus.note) bonus.appendChild(el('p', 'task-bonus-note', t.bonus.note));
      card.appendChild(bonus);
    }
    if (t.note) card.appendChild(el('p', 'task-note', t.note));
    return card;
  }

  // 澎湖版任務卡：icon / title / hint
  function renderSimpleTask(t) {
    const card = el('div', 'task');
    const titleRow = el('div', 'task-title-row');
    titleRow.appendChild(el('div', 'task-title', `${t.icon || ''} ${t.title}`));
    titleRow.appendChild(speakButton(buildTaskScript(t), 'btn-speak-task'));
    card.appendChild(titleRow);
    if (t.hint) card.appendChild(el('div', 'task-hint', t.hint));
    return card;
  }

  function renderFamilyChallenge(fc) {
    const box = el('div', 'family-challenge');
    box.appendChild(el('h2', null, '🌟 家庭挑戰'));
    box.appendChild(el('p', null, fc.body));
    if (fc.awards) {
      const awards = el('div', 'awards');
      fc.awards.forEach(name => {
        const row = el('div', 'award-row');
        row.appendChild(el('span', null, `🏆 ${name}`));
        row.appendChild(el('span', 'fillin-blank'));
        awards.appendChild(row);
      });
      box.appendChild(awards);
    }
    return box;
  }

  function renderJournal(journal) {
    const box = el('div', 'journal');
    box.appendChild(el('h2', null, '📖 今日探險日誌'));
    journal.fields.forEach(label => box.appendChild(fillInLine(label + '：')));
    return box;
  }

  function render(loc) {
    const root = document.getElementById('learn-content');
    root.innerHTML = '';

    if (loc.image) {
      const cover = el('img', 'learn-cover');
      cover.src = loc.image;
      cover.alt = loc.name;
      root.appendChild(cover);
    }

    const heading = loc.chapterTitle ? `${loc.chapterTitle}：${loc.name}` : `📍 ${loc.name}`;
    root.appendChild(el('h1', 'learn-title', heading));

    if (loc.place) root.appendChild(el('p', 'learn-place', `📍 ${loc.place}`));
    if (loc.badge && loc.badge.name) root.appendChild(el('p', 'learn-badge', `🏅 徽章：${loc.badge.name}`));
    if (loc.growthTheme) root.appendChild(el('p', 'learn-growth', `🌱 ${loc.growthTheme}`));
    if (loc.link) root.appendChild(el('p', 'learn-link', `🔗 ${loc.link}`));

    if (loc.intro) root.appendChild(el('p', 'learn-intro', loc.intro));
    if (loc.quote) root.appendChild(el('p', 'learn-quote', loc.quote.replace(/\n/g, '<br>')));

    // 朗讀：前述 + 逐關任務（第一關/第二關…）
    const script = buildSpeechScript(loc);
    if (script.length) {
      const speakBtn = el('button', 'btn-speak', '🔊 唸給我聽');
      speakBtn.addEventListener('click', () => speak(script));
      root.appendChild(speakBtn);
    }

    // 中歐前言（陣列）在教材頁顯示一小段就好，完整睡前故事在獨立故事頁
    if (Array.isArray(loc.intro)) {
      const story = el('div', 'story');
      loc.intro.forEach(p => story.appendChild(el('p', null, p)));
      root.appendChild(story);
    }

    if (loc.narrative) {
      root.appendChild(el('h2', null, '📜 最後的故事'));
      const story = el('div', 'story');
      loc.narrative.forEach(p => story.appendChild(el('p', null, p)));
      root.appendChild(story);
    }

    if (loc.gallery) {
      root.appendChild(el('h2', null, '🖼️ 先看看照片'));
      const gallery = el('div', 'gallery');
      loc.gallery.forEach(g => {
        const fig = el('figure');
        const img = el('img');
        img.src = g.image;
        img.alt = g.caption;
        img.loading = 'lazy';
        fig.appendChild(img);
        fig.appendChild(el('figcaption', null, g.caption));
        gallery.appendChild(fig);
      });
      root.appendChild(gallery);
    }

    if (loc.rules) {
      root.appendChild(el('div', 'rules', `⚠️ ${loc.rules}`));
    }

    if (loc.stub) {
      root.appendChild(el('div', 'stub-note', '📝 這一關的任務內容還在準備中，敬請期待！'));
    }

    if (loc.tasks && loc.tasks.length) {
      root.appendChild(el('h2', null, '🔍 今天的任務'));
      const tasks = el('div', 'tasks');
      loc.tasks.forEach(t => {
        tasks.appendChild(t.icon !== undefined || t.hint !== undefined ? renderSimpleTask(t) : renderWorksheetTask(t));
      });
      root.appendChild(tasks);
    }

    if (loc.familyChallenge) root.appendChild(renderFamilyChallenge(loc.familyChallenge));
    if (loc.journal) root.appendChild(renderJournal(loc.journal));

    if (loc.completionChecklist) {
      root.appendChild(el('h2', null, '🌟 我完成了今天的探險'));
      root.appendChild(checklistBlock(loc.completionChecklist));
    }

    if (loc.badgeSpirit) {
      root.appendChild(el('div', 'badge-spirit', `🏅 ${loc.badgeSpirit.replace(/\n/g, '<br>')}`));
    }
  }

  // 獨立故事頁：睡前故事（小說體）+ 故事背後的秘密（歷史小知識）
  // 跟教材/任務頁完全分開，白天探險時不會被強迫看到
  function hasStory(loc) {
    return !!(loc.story && loc.story.length);
  }

  function renderStory(loc) {
    const root = document.getElementById('story-content');
    root.innerHTML = '';

    if (loc.image) {
      const cover = el('img', 'learn-cover');
      cover.src = loc.image;
      cover.alt = loc.name;
      root.appendChild(cover);
    }

    const heading = loc.chapterTitle ? `${loc.chapterTitle}：${loc.name}` : `📍 ${loc.name}`;
    root.appendChild(el('h1', 'learn-title', `📖 ${heading}`));
    if (loc.place) root.appendChild(el('p', 'learn-place', `📍 ${loc.place}`));

    const script = [];
    if (loc.story) script.push(...loc.story);
    if (loc.quote) script.push(loc.quote.replace(/\n/g, '。'));
    if (loc.funFacts) loc.funFacts.forEach(f => script.push(f.text));
    if (loc.storyReflect) script.push('想一想：' + loc.storyReflect);

    if (script.length) {
      const speakBtn = el('button', 'btn-speak', '🔊 唸給我聽');
      speakBtn.addEventListener('click', () => speak(script));
      root.appendChild(speakBtn);
    }

    if (loc.story) {
      const story = el('div', 'story');
      loc.story.forEach(p => story.appendChild(el('p', null, p)));
      root.appendChild(story);
    }

    if (loc.quote) root.appendChild(el('p', 'learn-quote', loc.quote.replace(/\n/g, '<br>')));

    if (loc.funFacts && loc.funFacts.length) {
      root.appendChild(el('h2', null, '🔎 故事背後的秘密'));
      const facts = el('div', 'funfacts');
      loc.funFacts.forEach(f => {
        facts.appendChild(el('div', 'funfact', `<span class="icon">${f.icon || '📜'}</span>${f.text}`));
      });
      root.appendChild(facts);
    }

    if (loc.storyReflect) {
      root.appendChild(el('div', 'task-reflect', `🌟 想一想：${loc.storyReflect}`));
    }

    if (!loc.story && !loc.funFacts) {
      root.appendChild(el('div', 'stub-note', '📝 這一關的故事還在準備中，敬請期待！'));
    }
  }

  return { render, renderStory, hasStory };
})();
