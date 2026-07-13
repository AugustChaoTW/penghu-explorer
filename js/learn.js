// 教材頁渲染
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

  function render(loc) {
    const root = document.getElementById('learn-content');
    root.innerHTML = '';

    const cover = el('img', 'learn-cover');
    cover.src = loc.image;
    cover.alt = loc.name;
    root.appendChild(cover);

    root.appendChild(el('h1', 'learn-title', `📍 ${loc.name}`));
    root.appendChild(el('p', 'learn-intro', loc.intro));

    const speakBtn = el('button', 'btn-speak', '🔊 唸給我聽');
    speakBtn.addEventListener('click', () => speak(loc.story));
    root.appendChild(speakBtn);

    const story = el('div', 'story');
    loc.story.forEach(p => story.appendChild(el('p', null, p)));
    root.appendChild(story);

    root.appendChild(el('h2', null, '💡 你知道嗎？'));
    const facts = el('div', 'funfacts');
    loc.funFacts.forEach(f => {
      facts.appendChild(el('div', 'funfact', `<span class="icon">${f.icon}</span>${f.text}`));
    });
    root.appendChild(facts);

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

    if (loc.rules) {
      root.appendChild(el('div', 'rules', `⚠️ ${loc.rules}`));
    }

    root.appendChild(el('h2', null, '🔍 今天的任務'));
    const tasks = el('div', 'tasks');
    loc.tasks.forEach(t => {
      const card = el('div', 'task');
      card.appendChild(el('div', 'task-title', `${t.icon} ${t.title}`));
      card.appendChild(el('div', 'task-hint', t.hint));
      tasks.appendChild(card);
    });
    root.appendChild(tasks);
  }

  return { render };
})();
