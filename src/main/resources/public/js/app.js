/* ===================================================
   MediaVault - Single Page Application (中文界面)
   =================================================== */

const API = '/api';
let currentRoute = '/';
let allMedia = [];
let allTags = [];
let activeTagFilter = null;
let pendingTagFilter = null;
let searchDebounceTimer = null;
let currentRating = 0;
let editingMediaId = null;
let dragSrcEl = null;
let dragListId = null;
let draftMedia = null;
let step2Tags = [];
const AUTOCOMPLETE_HIDE_DELAY = 150; // ms to wait before hiding dropdown (allows click events to fire)
let step2ActiveStyle = 'simple';
let step2PreviewActive = false;
let currentListName = ''; // cached for export
let dashboardModules = loadDashboardModules();

// ===== Helpers =====
function typeLabel(type) {
  const map = { movie: '电影', tv: '电视剧', book: '书籍', game: '游戏' };
  return map[type] || type;
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function emptyState(icon, title, text) {
  return `<div class="empty-state">
    <div class="empty-state-icon">${icon}</div>
    <div class="empty-state-title">${title}</div>
    <div class="empty-state-text">${text}</div>
  </div>`;
}

// ===== Markdown Renderer =====
function renderMarkdown(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const result = [];
  let inUl = false;
  let inOl = false;

  for (const line of lines) {
    const isLi  = line.match(/^[-*] (.+)/);
    const isOli = line.match(/^\d+\. (.+)/);

    if (!isLi  && inUl) { result.push('</ul>'); inUl = false; }
    if (!isOli && inOl) { result.push('</ol>'); inOl = false; }

    const m3 = line.match(/^### (.+)/);
    const m2 = line.match(/^## (.+)/);
    const m1 = line.match(/^# (.+)/);
    const mq = line.match(/^> (.+)/);
    const mhr = line.match(/^---+$/);

    if (m3)      result.push(`<h3>${inlineMd(m3[1])}</h3>`);
    else if (m2) result.push(`<h2>${inlineMd(m2[1])}</h2>`);
    else if (m1) result.push(`<h1>${inlineMd(m1[1])}</h1>`);
    else if (mq) result.push(`<blockquote>${inlineMd(mq[1])}</blockquote>`);
    else if (isLi) {
      if (!inUl) { result.push('<ul>'); inUl = true; }
      result.push(`<li>${inlineMd(isLi[1])}</li>`);
    } else if (isOli) {
      if (!inOl) { result.push('<ol>'); inOl = true; }
      result.push(`<li>${inlineMd(isOli[1])}</li>`);
    } else if (mhr) {
      result.push('<hr>');
    } else if (line.trim() === '') {
      result.push('<p></p>');
    } else {
      result.push(`<p>${inlineMd(line)}</p>`);
    }
  }

  if (inUl) result.push('</ul>');
  if (inOl) result.push('</ol>');
  return result.join('');
}

function inlineMd(text) {
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%">');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  return text;
}

function parseScores(review) {
  if (!review) return { review: '', scores: {} };
  const match = review.match(/^SCORES:(\{[^}]*\})\n?/);
  if (match) {
    try {
      const scores = JSON.parse(match[1]);
      return { review: review.slice(match[0].length), scores };
    } catch (_) { /* ignore */ }
  }
  return { review, scores: {} };
}

// ===== Theme =====
const savedTheme = localStorage.getItem('theme') || 'light';
document.body.classList.toggle('dark-mode', savedTheme === 'dark');
updateThemeIcons(savedTheme);

// Apply saved color theme on startup
const savedColorTheme = localStorage.getItem('color_theme') || 'default';
if (savedColorTheme !== 'default') {
  document.body.classList.add('theme-' + savedColorTheme);
}
updateColorThemeDots(savedColorTheme);

function updateThemeIcons(theme) {
  const icon = theme === 'dark' ? '☀️' : '🌙';
  const el1 = document.getElementById('themeIcon');
  const el2 = document.getElementById('themeToggleMobile');
  if (el1) el1.textContent = icon;
  if (el2) el2.textContent = icon;
}

function updateColorThemeDots(name) {
  ['default', 'warm', 'green', 'rose'].forEach(t => {
    const dot = document.getElementById('dot-' + t);
    if (dot) dot.classList.toggle('active', t === name);
  });
}

function setColorTheme(name) {
  document.body.classList.remove('theme-warm', 'theme-green', 'theme-rose');
  if (name !== 'default') document.body.classList.add('theme-' + name);
  localStorage.setItem('color_theme', name);
  updateColorThemeDots(name);
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  const theme = isDark ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
  updateThemeIcons(theme);
}

document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
document.getElementById('themeToggleMobile')?.addEventListener('click', toggleTheme);

// ===== Mobile Sidebar =====
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');

hamburger?.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (sidebar.classList.contains('open') &&
      !sidebar.contains(e.target) && e.target !== hamburger) {
    sidebar.classList.remove('open');
  }
});

// ===== Modal =====
const modalOverlay = document.getElementById('modalOverlay');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');

function openModal(content) {
  modalBody.innerHTML = content;
  modalOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalOverlay.classList.remove('active');
  document.body.style.overflow = '';
  editingMediaId = null;
  currentRating = 0;
}

modalClose?.addEventListener('click', closeModal);
modalOverlay?.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ===== Toast Notifications =====
function toast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  t.innerHTML = `<span>${icons[type] || ''}</span> <span>${message}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

// ===== API Helpers =====
async function apiGet(path) {
  const res = await fetch(API + path);
  if (!res.ok) throw new Error(`请求失败：${res.status}`);
  return res.json();
}

async function apiPost(path, data) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `请求失败：${res.status}`);
  return json;
}

async function apiPut(path, data) {
  const res = await fetch(API + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `请求失败：${res.status}`);
  return json;
}

async function apiDelete(path) {
  const res = await fetch(API + path, { method: 'DELETE' });
  if (res.status === 204) return null;
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `请求失败：${res.status}`);
  return json;
}

// ===== Routing =====
function getRoute() {
  return window.location.hash.slice(1) || '/';
}

function navigate(route) {
  window.location.hash = route;
}

window.addEventListener('hashchange', render);

async function render() {
  const route = getRoute();
  currentRoute = route;
  activeTagFilter = pendingTagFilter;
  pendingTagFilter = null;

  document.querySelectorAll('.nav-link').forEach(a => {
    const r = a.getAttribute('data-route');
    a.classList.toggle('active', route === r || (r !== '/' && route.startsWith(r)));
  });

  sidebar.classList.remove('open');

  const app = document.getElementById('app');
  app.innerHTML = `<div class="loading"><div class="spinner"></div> 加载中…</div>`;

  try {
    if (route === '/') {
      await renderDashboard();
    } else if (route === '/movies') {
      await renderMediaList('movie', '🎥 电影');
    } else if (route === '/tv') {
      await renderMediaList('tv', '📺 电视剧');
    } else if (route === '/books') {
      await renderMediaList('book', '📚 书籍');
    } else if (route === '/games') {
      await renderMediaList('game', '🎮 游戏');
    } else if (route === '/lists') {
      await renderLists();
    } else if (route.startsWith('/lists/')) {
      const id = route.split('/')[2];
      await renderListDetail(id);
    } else if (route === '/tags') {
      await renderTags();
    } else {
      app.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">页面未找到</div><a href="#/" class="btn btn-primary mt-2">返回主页</a></div>`;
    }
  } catch (e) {
    app.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">出错了</div><div class="empty-state-text">${e.message}</div></div>`;
  }
}

// ===== Dashboard Modules =====
function loadDashboardModules() {
  try {
    const saved = localStorage.getItem('dashboard_modules');
    if (saved) return JSON.parse(saved);
  } catch (_) { /* ignore */ }
  return [
    { id: 'stats',  label: '数据统计',    visible: true },
    { id: 'recent', label: '最近添加',    visible: true },
    { id: 'random', label: '随机推荐',    visible: true },
    { id: 'lists',  label: '我的片单预览', visible: true }
  ];
}

function saveDashboardModules() {
  localStorage.setItem('dashboard_modules', JSON.stringify(dashboardModules));
}

// ===== Dashboard =====
async function renderDashboard() {
  const [media, lists, tags] = await Promise.all([
    apiGet('/media'),
    apiGet('/lists'),
    apiGet('/tags')
  ]);
  allMedia = media;
  allTags = tags;

  const counts = { movie: 0, tv: 0, book: 0, game: 0 };
  media.forEach(m => { if (counts[m.type] !== undefined) counts[m.type]++; });

  const modulesHtml = dashboardModules
    .filter(mod => mod.visible)
    .map(mod => `<div class="dashboard-module">${renderModule(mod.id, { media, lists, tags, counts })}</div>`)
    .join('');

  document.getElementById('app').innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🏠 主页</h1>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-secondary" onclick="openDashboardConfig()">⚙️ 配置模块</button>
        <button class="btn btn-primary" onclick="openAddMediaStep1()">➕ 添加媒体</button>
      </div>
    </div>
    ${modulesHtml || `<div class="empty-state">
      <div class="empty-state-icon">⚙️</div>
      <div class="empty-state-title">所有模块已隐藏</div>
      <button class="btn btn-secondary" onclick="openDashboardConfig()">配置模块</button>
    </div>`}
  `;
}

function renderModule(moduleId, data) {
  const { media, lists, counts } = data;
  if (moduleId === 'stats') {
    return `
      <h2 class="section-title">数据统计</h2>
      <div class="stats-grid">
        ${statCard('🎥', counts.movie, '电影', '#/movies')}
        ${statCard('📺', counts.tv, '电视剧', '#/tv')}
        ${statCard('📚', counts.book, '书籍', '#/books')}
        ${statCard('🎮', counts.game, '游戏', '#/games')}
        ${statCard('📋', lists.length, '片单', '#/lists')}
        ${statCard('🏷️', data.tags.length, '标签', '#/tags')}
      </div>`;
  }
  if (moduleId === 'recent') {
    const recent = media.slice(0, 6);
    return `
      <h2 class="section-title">最近添加</h2>
      ${recent.length
        ? `<div class="media-grid">${recent.map(m => mediaCard(m)).join('')}</div>`
        : `<div class="empty-state">
            <div class="empty-state-icon">📽️</div>
            <div class="empty-state-title">您的媒体库为空</div>
            <button class="btn btn-primary" onclick="openAddMediaStep1()">➕ 添加第一条记录</button>
          </div>`}`;
  }
  if (moduleId === 'random') {
    if (!media.length) return `<h2 class="section-title">随机推荐</h2><p style="color:var(--text-secondary)">暂无媒体可推荐。</p>`;
    const m = media[Math.floor(Math.random() * media.length)];
    const typePlaceholder = { movie: '🎥', tv: '📺', book: '📚', game: '🎮' };
    const cover = m.coverUrl
      ? `<img class="random-spotlight-cover" src="${escHtml(m.coverUrl)}" alt="${escHtml(m.title)}" onerror="this.outerHTML='<div class=\\'random-spotlight-placeholder\\'>${typePlaceholder[m.type] || '📄'}</div>'">`
      : `<div class="random-spotlight-placeholder">${typePlaceholder[m.type] || '📄'}</div>`;
    return `
      <h2 class="section-title">随机推荐</h2>
      <div class="random-spotlight" onclick="showMediaDetail(${m.id})" style="cursor:pointer;">
        ${cover}
        <div class="random-spotlight-info">
          <div class="random-spotlight-title">${escHtml(m.title)}</div>
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
            <span class="badge badge-${m.type}">${typeLabel(m.type)}</span>
            ${m.year ? `<span style="color:var(--text-secondary);font-size:13px;">${m.year}</span>` : ''}
          </div>
          ${m.rating ? `<div class="stars">${renderStars(m.rating)}</div>` : ''}
          ${m.genre ? `<div style="font-size:13px;color:var(--text-secondary);margin-top:6px;">${escHtml(m.genre)}</div>` : ''}
          ${m.description ? `<div style="font-size:13px;margin-top:8px;color:var(--text-secondary);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${escHtml(m.description)}</div>` : ''}
        </div>
      </div>`;
  }
  if (moduleId === 'lists') {
    const preview = lists.slice(0, 4);
    return `
      <h2 class="section-title">我的片单预览</h2>
      ${preview.length
        ? `<div class="lists-preview-grid">${preview.map(l => `
            <div class="list-preview-card" onclick="navigate('/lists/${l.id}')">
              <div class="list-preview-card-name">📋 ${escHtml(l.name)}</div>
              ${l.description ? `<div class="list-preview-card-desc">${escHtml(l.description)}</div>` : ''}
            </div>`).join('')}</div>
          <div style="margin-top:10px;"><a href="#/lists" style="font-size:13px;color:var(--accent);">查看全部片单 →</a></div>`
        : `<p style="color:var(--text-secondary);">暂无片单。<a href="#/lists" style="color:var(--accent);">创建片单</a></p>`}`;
  }
  return '';
}

function openDashboardConfig() {
  const renderConfigRows = () => dashboardModules.map((mod, idx) => `
    <div class="module-config-row" draggable="true" data-idx="${idx}" data-id="${escHtml(mod.id)}">
      <span class="mod-handle">⠿</span>
      <span class="mod-label">${escHtml(mod.label)}</span>
      <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
        <input type="checkbox" class="mod-visible-cb" data-id="${escHtml(mod.id)}" ${mod.visible ? 'checked' : ''}>
        <span style="font-size:13px;color:var(--text-secondary);">显示</span>
      </label>
    </div>`).join('');

  openModal(`
    <h2 style="margin-bottom:16px;font-size:20px;font-weight:700;">⚙️ 配置仪表盘模块</h2>
    <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">拖拽行可调整顺序，勾选框控制显示。</p>
    <div id="moduleConfigList">${renderConfigRows()}</div>
    <div class="form-actions" style="margin-top:16px;">
      <button class="btn btn-ghost" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" onclick="saveDashboardModules();closeModal();renderDashboard()">确定</button>
    </div>
  `);

  // Event delegation for visibility checkboxes
  const container = document.getElementById('moduleConfigList');
  if (!container) return;

  container.addEventListener('change', (e) => {
    if (e.target.classList.contains('mod-visible-cb')) {
      const modId = e.target.dataset.id;
      const mod = dashboardModules.find(m => m.id === modId);
      if (mod) mod.visible = e.target.checked;
    }
  });

  let dragging = null;

  container.addEventListener('dragstart', (e) => {
    dragging = e.target.closest('.module-config-row');
    if (dragging) {
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => { if (dragging) dragging.style.opacity = '0.4'; }, 0);
    }
  });

  container.addEventListener('dragend', () => {
    if (dragging) dragging.style.opacity = '';
    container.querySelectorAll('.module-config-row').forEach(r => r.classList.remove('drag-over'));
    dragging = null;
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.target.closest('.module-config-row');
    container.querySelectorAll('.module-config-row').forEach(r => r.classList.remove('drag-over'));
    if (target && target !== dragging) target.classList.add('drag-over');
  });

  container.addEventListener('drop', (e) => {
    e.preventDefault();
    const target = e.target.closest('.module-config-row');
    container.querySelectorAll('.module-config-row').forEach(r => r.classList.remove('drag-over'));
    if (!target || !dragging || target === dragging) return;

    const rows = [...container.querySelectorAll('.module-config-row')];
    const fromIdx = rows.indexOf(dragging);
    const toIdx = rows.indexOf(target);

    // Reorder dashboardModules array
    const [moved] = dashboardModules.splice(fromIdx, 1);
    dashboardModules.splice(toIdx, 0, moved);

    // Re-render config rows; drag events remain bound to container, inline onchange handlers are re-created
    container.innerHTML = renderConfigRows();
  });
}

function statCard(icon, number, label, href) {
  return `<a href="${href}" class="stat-card" style="text-decoration:none;color:inherit;">
    <div class="stat-icon">${icon}</div>
    <div class="stat-number">${number}</div>
    <div class="stat-label">${label}</div>
  </a>`;
}

// ===== Media List =====
async function renderMediaList(type, title) {
  const typeNameMap = { movie: '电影', tv: '电视剧', book: '书籍', game: '游戏' };
  let url = `/media?type=${type}`;
  if (activeTagFilter) url += `&tag=${encodeURIComponent(activeTagFilter)}`;
  const media = await apiGet(url);
  allMedia = media;
  const tags = await apiGet('/tags');
  allTags = tags;

  document.getElementById('app').innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${title}</h1>
      <button class="btn btn-primary" onclick="openAddMediaStep1('${type}')">➕ 添加${typeNameMap[type] || type}</button>
    </div>
    <div class="filters-bar">
      <div class="search-box">
        <span>🔍</span>
        <input type="text" id="searchInput" placeholder="搜索${title.replace(/[🎥📺📚🎮]\s/, '')}…" />
      </div>
      <div class="tag-filter" id="tagFilter">
        <span class="tag-chip ${!activeTagFilter ? 'active' : ''}" onclick="filterByTag(null, this)">全部</span>
        ${tags.map(t => `<span class="tag-chip ${activeTagFilter === t.name ? 'active' : ''}" onclick="filterByTag('${escHtml(t.name)}', this)">${escHtml(t.name)}</span>`).join('')}
      </div>
    </div>
    <div class="media-grid" id="mediaGrid">
      ${media.length ? media.map(m => mediaCard(m)).join('') : emptyState('📭', '暂无内容', `添加您的第一条${typeNameMap[type]}！`)}
    </div>
  `;

  document.getElementById('searchInput')?.addEventListener('input', (e) => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => filterMedia(type, e.target.value), 300);
  });
}

function filterByTag(tag, el) {
  activeTagFilter = tag;
  document.querySelectorAll('.tag-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  const search = document.getElementById('searchInput')?.value || '';
  const type = currentRoute.replace('/', '');
  filterMedia(type, search);
}

async function filterMedia(type, search) {
  let url = `/media?type=${type}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (activeTagFilter) url += `&tag=${encodeURIComponent(activeTagFilter)}`;
  const media = await apiGet(url);
  const grid = document.getElementById('mediaGrid');
  if (grid) grid.innerHTML = media.length ? media.map(m => mediaCard(m)).join('') : emptyState('🔍', '无搜索结果', '请尝试不同的搜索或筛选条件');
}

// Sets a tag name to be applied as a filter on the next render triggered by navigation.
// Called from the Tags page alongside navigate() so the pending filter is picked up by render().
function filterByTagGlobal(tagName) {
  pendingTagFilter = tagName;
}

// ===== Media Card =====
function mediaCard(m) {
  const typePlaceholder = { movie: '🎥', tv: '📺', book: '📚', game: '🎮' };
  const cover = m.coverUrl
    ? `<img class="card-cover" src="${escHtml(m.coverUrl)}" alt="${escHtml(m.title)}" onerror="this.outerHTML='<div class=\\'card-cover-placeholder\\'>${typePlaceholder[m.type] || '📄'}</div>'">`
    : `<div class="card-cover-placeholder">${typePlaceholder[m.type] || '📄'}</div>`;

  return `<div class="media-card" onclick="showMediaDetail(${m.id})">
    ${cover}
    <div class="card-info">
      <div class="card-title">${escHtml(m.title)}</div>
      <div class="card-meta">
        <span class="badge badge-${m.type}">${typeLabel(m.type)}</span>
        ${m.year ? `<span>${m.year}</span>` : ''}
      </div>
      ${m.rating ? `<div class="stars">${renderStars(m.rating)}</div>` : ''}
    </div>
  </div>`;
}

function renderStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) html += '<span>★</span>';
    else if (i - 0.5 <= rating) html += '<span>½</span>';
    else html += '<span class="empty">★</span>';
  }
  return html;
}

// ===== Media Detail =====
async function showMediaDetail(id) {
  const m = await apiGet(`/media/${id}`);
  const typePlaceholder = { movie: '🎥', tv: '📺', book: '📚', game: '🎮' };
  const cover = m.coverUrl
    ? `<img src="${escHtml(m.coverUrl)}" style="width:100%;display:block;" onerror="this.outerHTML='<div style=\\'font-size:60px;text-align:center;padding:20px;\\'>${typePlaceholder[m.type] || '📄'}</div>'">`
    : `<div class="detail-cover-placeholder">${typePlaceholder[m.type] || '📄'}</div>`;

  const tags = m.tags ? m.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const typeSpecific = (() => {
    if (m.type === 'movie' || m.type === 'tv') return m.director ? `<div class="detail-section"><div class="detail-section-label">导演</div><div class="detail-section-value">${escHtml(m.director)}</div></div>` : '';
    if (m.type === 'book') return m.author ? `<div class="detail-section"><div class="detail-section-label">作者</div><div class="detail-section-value">${escHtml(m.author)}</div></div>` : '';
    if (m.type === 'game') return m.platform ? `<div class="detail-section"><div class="detail-section-label">平台</div><div class="detail-section-value">${escHtml(m.platform)}</div></div>` : '';
    return '';
  })();

  const { review: cleanedReview } = parseScores(m.review);

  openModal(`
    <div class="detail-header">
      <div class="detail-cover">${cover}</div>
      <div class="detail-info">
        <div class="detail-title">${escHtml(m.title)}</div>
        <div class="detail-meta">
          <span class="badge badge-${m.type}">${typeLabel(m.type)}</span>
          ${m.year ? `<span class="detail-year">${m.year}</span>` : ''}
        </div>
        ${m.rating ? `<div class="detail-rating"><div class="stars">${renderStars(m.rating)}</div><span style="color:var(--text-secondary);font-size:13px">${m.rating.toFixed(1)}/5</span></div>` : ''}
        ${m.genre ? `<div class="detail-section"><div class="detail-section-label">类型</div><div class="detail-section-value">${escHtml(m.genre)}</div></div>` : ''}
        ${typeSpecific}
      </div>
    </div>
    ${m.description ? `<div class="detail-section"><div class="detail-section-label">简介</div><div class="detail-section-value">${escHtml(m.description)}</div></div>` : ''}
    ${cleanedReview ? `<div class="detail-section"><div class="detail-section-label">我的点评</div><div class="detail-section-value">${escHtml(cleanedReview)}</div></div>` : ''}
    ${tags.length ? `<div class="detail-section"><div class="detail-section-label">标签</div><div class="detail-tags">${tags.map(t => `<span class="tag-chip">${escHtml(t.trim())}</span>`).join('')}</div></div>` : ''}
    <div class="detail-actions">
      <button class="btn btn-secondary" onclick="openEditStep1(${m.id})">✏️ 编辑</button>
      <button class="btn btn-danger" data-id="${m.id}" data-title="${escHtml(m.title)}" onclick="deleteMediaFromBtn(this)">🗑️ 删除</button>
    </div>
  `);
}

async function openEditStep1(id) {
  try {
    const m = await apiGet(`/media/${id}`);
    closeModal();
    openAddMediaStep1(null, m);
  } catch (e) {
    toast(e.message, 'error');
  }
}

// ===== Step 1 Modal =====
function openAddMediaStep1(defaultType, existingMedia) {
  editingMediaId = existingMedia?.id || null;
  draftMedia = existingMedia ? { ...existingMedia } : null;
  currentRating = existingMedia?.rating || 0;
  openModal(buildStep1Form(existingMedia, defaultType));
  setupStep1Handlers();
}

function buildStep1Form(m, defaultType) {
  const type = m?.type || defaultType || 'movie';
  const typeOptions = [
    { val: 'movie', label: '电影' },
    { val: 'tv',    label: '电视剧' },
    { val: 'book',  label: '书籍' },
    { val: 'game',  label: '游戏' }
  ].map(t => `<option value="${t.val}" ${type === t.val ? 'selected' : ''}>${t.label}</option>`).join('');

  return `
    <h2 style="margin-bottom:4px;font-size:20px;font-weight:700;">
      ${m ? '✏️ 编辑媒体' : '➕ 添加媒体'}
    </h2>
    <div class="step-indicator" style="margin-bottom:16px;">步骤 1 / 2 — 基本信息</div>
    <div class="fetch-area">
      <div class="form-group">
        <label class="form-label">按标题自动抓取</label>
        <input type="text" class="form-input" id="fetchTitle" placeholder="输入标题以自动抓取信息…" value="${escHtml(m?.title || '')}">
      </div>
      <button class="btn btn-secondary" onclick="autoFetch()" id="fetchBtn">🔍 抓取</button>
    </div>
    <div class="fetching-indicator" id="fetchingIndicator">
      <div class="spinner"></div> 抓取中…
    </div>
    <div class="form-grid">
      <div class="form-group" style="grid-column:span 2">
        <label class="form-label">标题 *</label>
        <input type="text" class="form-input" id="fTitle" value="${escHtml(m?.title || '')}" required placeholder="输入标题">
      </div>
      <div class="form-group">
        <label class="form-label">类型 *</label>
        <select class="form-select" id="fType" onchange="updateTypeFields(this.value)">${typeOptions}</select>
      </div>
      <div class="form-group">
        <label class="form-label">年份</label>
        <input type="number" class="form-input" id="fYear" value="${m?.year || ''}" min="1800" max="2100" placeholder="例：2024">
      </div>
      <div class="form-group" style="grid-column:span 2">
        <label class="form-label">封面图片URL</label>
        <input type="url" class="form-input" id="fCoverUrl" value="${escHtml(m?.coverUrl || '')}" placeholder="https://…">
      </div>
      <div class="form-group" id="directorGroup" style="${(type === 'movie' || type === 'tv') ? '' : 'display:none;'}">
        <label class="form-label">导演</label>
        <input type="text" class="form-input" id="fDirector" value="${escHtml(m?.director || '')}" placeholder="导演姓名">
      </div>
      <div class="form-group" id="authorGroup" style="${type === 'book' ? '' : 'display:none;'}">
        <label class="form-label">作者</label>
        <input type="text" class="form-input" id="fAuthor" value="${escHtml(m?.author || '')}" placeholder="作者姓名">
      </div>
      <div class="form-group" id="platformGroup" style="${type === 'game' ? '' : 'display:none;'}">
        <label class="form-label">平台</label>
        <input type="text" class="form-input" id="fPlatform" value="${escHtml(m?.platform || '')}" placeholder="PC、PlayStation、Xbox…">
      </div>
      <div class="form-group">
        <label class="form-label">类型/题材</label>
        <input type="text" class="form-input" id="fGenre" value="${escHtml(m?.genre || '')}" placeholder="动作、戏剧、RPG…">
      </div>
      <div class="form-group" style="grid-column:span 2">
        <label class="form-label">简介</label>
        <textarea class="form-textarea" id="fDescription" placeholder="内容简介…">${escHtml(m?.description || '')}</textarea>
      </div>
    </div>
    <div class="form-actions">
      <button type="button" class="btn btn-ghost" onclick="closeModal()">取消</button>
      <button type="button" class="btn btn-primary" onclick="goToStep2()">下一步：写点评 →</button>
    </div>
  `;
}

function setupStep1Handlers() {
  const type = document.getElementById('fType')?.value;
  if (type) updateTypeFields(type);
}

function updateTypeFields(type) {
  const dg = document.getElementById('directorGroup');
  const ag = document.getElementById('authorGroup');
  const pg = document.getElementById('platformGroup');
  if (dg) dg.style.display = (type === 'movie' || type === 'tv') ? '' : 'none';
  if (ag) ag.style.display = type === 'book' ? '' : 'none';
  if (pg) pg.style.display = type === 'game' ? '' : 'none';
}

function goToStep2() {
  const title = document.getElementById('fTitle')?.value?.trim();
  if (!title) { toast('请输入标题', 'warning'); return; }

  draftMedia = {
    ...draftMedia,
    title,
    type:        document.getElementById('fType').value,
    year:        parseInt(document.getElementById('fYear').value) || null,
    coverUrl:    document.getElementById('fCoverUrl').value || null,
    director:    document.getElementById('fDirector')?.value || null,
    author:      document.getElementById('fAuthor')?.value || null,
    platform:    document.getElementById('fPlatform')?.value || null,
    genre:       document.getElementById('fGenre').value || null,
    description: document.getElementById('fDescription').value || null
  };

  closeModal();
  renderStep2Editor();
}

// ===== Auto-Fetch =====
async function autoFetch() {
  const title = document.getElementById('fetchTitle')?.value;
  const type = document.getElementById('fType')?.value || 'movie';
  if (!title?.trim()) { toast('请输入标题', 'warning'); return; }

  const indicator = document.getElementById('fetchingIndicator');
  const btn = document.getElementById('fetchBtn');
  if (indicator) indicator.classList.add('active');
  if (btn) btn.disabled = true;

  try {
    const m = await apiPost('/fetch', { title: title.trim(), type });
    if (m.title)       document.getElementById('fTitle').value = m.title;
    if (m.coverUrl)    document.getElementById('fCoverUrl').value = m.coverUrl;
    if (m.description) document.getElementById('fDescription').value = m.description;
    if (m.year)        document.getElementById('fYear').value = m.year;
    if (m.genre)       document.getElementById('fGenre').value = m.genre;
    if (m.director)    document.getElementById('fDirector').value = m.director;
    if (m.author)      document.getElementById('fAuthor').value = m.author;
    if (m.platform)    document.getElementById('fPlatform').value = m.platform;
    if (m.rating)      currentRating = Math.round(m.rating);
    toast('信息抓取成功！', 'success');
  } catch (e) {
    toast('无法抓取信息，请手动填写。', 'warning');
  } finally {
    if (indicator) indicator.classList.remove('active');
    if (btn) btn.disabled = false;
  }
}

// ===== Delete Media =====
async function deleteMedia(id, title) {
  if (!confirm(`确定要删除「${title}」吗？`)) return;
  try {
    await apiDelete(`/media/${id}`);
    toast('已删除', 'success');
    closeModal();
    render();
  } catch (e) {
    toast(e.message, 'error');
  }
}

function deleteMediaFromBtn(btn) {
  deleteMedia(btn.dataset.id, btn.dataset.title);
}

// ===== Step 2 Editor =====
function renderStep2Editor() {
  const { review: existingReview, scores } = parseScores(draftMedia?.review || '');
  step2Tags = draftMedia?.tags ? draftMedia.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  step2ActiveStyle = 'simple';
  step2PreviewActive = false;
  currentRating = draftMedia?.rating || currentRating || 0;

  document.getElementById('app').innerHTML = `
    <div class="editor-page">
      <div class="page-header">
        <div>
          <div class="step-indicator">步骤 2 / 2 — 写点评</div>
          <h1 class="page-title">✍️ ${escHtml(draftMedia?.title || '')}</h1>
        </div>
        <button class="btn btn-primary" onclick="submitStep2()">✅ 提交条目</button>
      </div>

      <div class="editor-layout">
        <div class="editor-pane">
          <div class="editor-toolbar">
            <button class="toolbar-btn" onclick="insertMd('**','**')" title="粗体"><strong>B</strong></button>
            <button class="toolbar-btn" onclick="insertMd('*','*')" title="斜体"><em>I</em></button>
            <button class="toolbar-btn" onclick="insertMdLine('# ')" title="一级标题">H1</button>
            <button class="toolbar-btn" onclick="insertMdLine('## ')" title="二级标题">H2</button>
            <button class="toolbar-btn" onclick="insertMdLine('- ')" title="列表项">≡</button>
            <button class="toolbar-btn" onclick="insertMdLine('> ')" title="引用">❝</button>
            <button class="toolbar-btn" onclick="insertImageMd()" title="插入图片">🖼️</button>
            <span class="toolbar-sep"></span>
            <button class="toolbar-btn" id="previewToggle" onclick="togglePreview()">👁 预览</button>
          </div>
          <textarea class="md-textarea" id="mdEditor" placeholder="写下您的点评…（支持 Markdown 格式）">${escHtml(existingReview)}</textarea>
          <div class="md-preview style-simple" id="mdPreview" style="display:none;"></div>
        </div>

        <div class="editor-sidebar">
          <div class="sidebar-section">
            <div class="sidebar-section-title">⭐ 我的评分</div>
            <div class="star-picker" id="step2Stars">
              ${[1,2,3,4,5].map(i => `<button type="button" class="star ${currentRating >= i ? 'filled' : ''}" data-val="${i}" onclick="setStep2Rating(${i})">★</button>`).join('')}
            </div>
            <div class="sub-scores">
              <div class="sub-score-item">
                <label class="sub-score-label">剧情</label>
                <input type="number" class="form-input sub-score-input" id="scorePlot" min="0" max="10" step="0.1" placeholder="0-10" value="${scores.plot != null ? scores.plot : ''}">
              </div>
              <div class="sub-score-item">
                <label class="sub-score-label">呈现</label>
                <input type="number" class="form-input sub-score-input" id="scorePresentation" min="0" max="10" step="0.1" placeholder="0-10" value="${scores.presentation != null ? scores.presentation : ''}">
              </div>
              <div class="sub-score-item">
                <label class="sub-score-label">整体</label>
                <input type="number" class="form-input sub-score-input" id="scoreOverall" min="0" max="10" step="0.1" placeholder="0-10" value="${scores.overall != null ? scores.overall : ''}">
              </div>
            </div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-section-title">🏷️ 标签</div>
            <div class="tag-input-container">
              <div class="tag-bubbles" id="tagBubbles"></div>
              <input type="text" class="form-input" id="tagInputField" placeholder="输入标签，回车添加…" autocomplete="off">
              <div class="tag-autocomplete" id="tagAutocomplete" style="display:none;"></div>
            </div>
          </div>

          <div class="sidebar-section">
            <div class="sidebar-section-title">🎨 排版风格</div>
            <div class="style-cards">
              <div class="style-card active" data-style="simple" onclick="selectStyle('simple')">
                <div class="style-card-name">简洁</div>
                <div class="style-card-desc">清晰简明</div>
              </div>
              <div class="style-card" data-style="literary" onclick="selectStyle('literary')">
                <div class="style-card-name">文艺</div>
                <div class="style-card-desc">衬线优美</div>
              </div>
              <div class="style-card" data-style="academic" onclick="selectStyle('academic')">
                <div class="style-card-name">学术</div>
                <div class="style-card-desc">等宽严谨</div>
              </div>
            </div>
          </div>

          ${draftMedia?.coverUrl ? `
          <div class="sidebar-section">
            <div class="sidebar-section-title">📷 封面预览</div>
            <img src="${escHtml(draftMedia.coverUrl)}" style="width:100%;border-radius:8px;object-fit:cover;" onerror="this.parentElement.style.display='none'">
          </div>
          ` : ''}
        </div>
      </div>

      <div class="editor-action-bar">
        <button class="btn btn-ghost" onclick="cancelStep2()">← 取消</button>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-secondary" onclick="saveDraft()">💾 保存草稿</button>
          <button class="btn btn-primary" onclick="submitStep2()">✅ 提交条目</button>
        </div>
      </div>
    </div>
  `;

  renderTagBubbles();
  setupTagInput();
}

function setStep2Rating(val) {
  currentRating = val;
  document.querySelectorAll('#step2Stars .star').forEach(s => {
    s.classList.toggle('filled', parseInt(s.dataset.val) <= val);
  });
}

function insertMd(before, after) {
  const ta = document.getElementById('mdEditor');
  if (!ta) return;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = ta.value.substring(start, end);
  ta.value = ta.value.substring(0, start) + before + selected + after + ta.value.substring(end);
  ta.selectionStart = start + before.length;
  ta.selectionEnd = start + before.length + selected.length;
  ta.focus();
}

function insertMdLine(prefix) {
  const ta = document.getElementById('mdEditor');
  if (!ta) return;
  const start = ta.selectionStart;
  const lineStart = ta.value.lastIndexOf('\n', start - 1) + 1;
  ta.value = ta.value.substring(0, lineStart) + prefix + ta.value.substring(lineStart);
  ta.selectionStart = ta.selectionEnd = start + prefix.length;
  ta.focus();
}

function insertImageMd() {
  const url = prompt('输入图片URL：');
  if (url) {
    const ta = document.getElementById('mdEditor');
    if (ta) {
      const pos = ta.selectionStart;
      const ins = `![图片](${url})`;
      ta.value = ta.value.substring(0, pos) + ins + ta.value.substring(pos);
      ta.selectionStart = ta.selectionEnd = pos + ins.length;
      ta.focus();
    }
  }
}

function togglePreview() {
  step2PreviewActive = !step2PreviewActive;
  const ta = document.getElementById('mdEditor');
  const preview = document.getElementById('mdPreview');
  const btn = document.getElementById('previewToggle');
  if (!ta || !preview || !btn) return;

  if (step2PreviewActive) {
    preview.innerHTML = renderMarkdown(ta.value);
    preview.className = `md-preview style-${step2ActiveStyle}`;
    preview.style.display = '';
    ta.style.display = 'none';
    btn.textContent = '✏️ 编辑';
  } else {
    preview.style.display = 'none';
    ta.style.display = '';
    btn.innerHTML = '👁 预览';
  }
}

function selectStyle(style) {
  step2ActiveStyle = style;
  document.querySelectorAll('.style-card').forEach(c => {
    c.classList.toggle('active', c.dataset.style === style);
  });
  const preview = document.getElementById('mdPreview');
  if (preview) preview.className = `md-preview style-${style}`;
}

function renderTagBubbles() {
  const container = document.getElementById('tagBubbles');
  if (!container) return;
  container.innerHTML = step2Tags.map(t =>
    `<span class="tag-bubble">${escHtml(t)} <button onclick="removeTag(this)" data-tag="${escHtml(t)}">✕</button></span>`
  ).join('');
}

function addTag(name) {
  name = name.trim().toLowerCase();
  if (!name || step2Tags.includes(name)) return;
  step2Tags.push(name);
  renderTagBubbles();
}

function removeTag(btn) {
  const name = btn.dataset.tag.toLowerCase();
  step2Tags = step2Tags.filter(t => t !== name);
  renderTagBubbles();
}

function setupTagInput() {
  const input = document.getElementById('tagInputField');
  const autocomplete = document.getElementById('tagAutocomplete');
  if (!input) return;

  let autocompleteHideTimer = null;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.value.replace(/,/g, '').trim();
      if (val) addTag(val);
      input.value = '';
      if (autocomplete) autocomplete.style.display = 'none';
    } else if (e.key === 'Escape') {
      if (autocomplete) autocomplete.style.display = 'none';
    }
  });

  input.addEventListener('input', () => {
    const val = input.value.trim();
    if (!val || !autocomplete) {
      if (autocomplete) autocomplete.style.display = 'none';
      return;
    }
    const matches = allTags
      .filter(t => t.name.toLowerCase().includes(val.toLowerCase()) && !step2Tags.includes(t.name.toLowerCase()))
      .slice(0, 8);
    if (matches.length === 0) { autocomplete.style.display = 'none'; return; }
    autocomplete.innerHTML = matches.map(t =>
      `<div class="tag-ac-item" data-tag="${escHtml(t.name)}" onmousedown="handleTagAcClick(event, this)">${escHtml(t.name)}</div>`
    ).join('');
    autocomplete.style.display = '';
  });

  input.addEventListener('focus', () => {
    if (autocompleteHideTimer) { clearTimeout(autocompleteHideTimer); autocompleteHideTimer = null; }
  });

  input.addEventListener('blur', () => {
    autocompleteHideTimer = setTimeout(() => { if (autocomplete) autocomplete.style.display = 'none'; }, AUTOCOMPLETE_HIDE_DELAY);
  });
}

function handleTagAcClick(e, el) {
  e.preventDefault();
  addTag(el.dataset.tag);
  const input = document.getElementById('tagInputField');
  const ac = document.getElementById('tagAutocomplete');
  if (input) { input.value = ''; input.focus(); }
  if (ac) ac.style.display = 'none';
}

function cancelStep2() {
  draftMedia = null;
  step2Tags = [];
  currentRating = 0;
  editingMediaId = null;
  render();
}

function saveDraft() {
  if (!draftMedia) return;
  const review = document.getElementById('mdEditor')?.value || '';
  const draft = {
    ...draftMedia,
    review,
    rating: currentRating || null,
    tags: step2Tags.join(',')
  };
  localStorage.setItem('mediavault_draft', JSON.stringify(draft));
  toast('草稿已保存', 'success');
}

async function submitStep2() {
  if (!draftMedia?.title) { toast('标题不能为空', 'warning'); return; }

  let review = document.getElementById('mdEditor')?.value || '';
  const scorePlot  = document.getElementById('scorePlot')?.value;
  const scorePres  = document.getElementById('scorePresentation')?.value;
  const scoreTotal = document.getElementById('scoreOverall')?.value;

  if (scorePlot || scorePres || scoreTotal) {
    const scores = {};
    const clampScore = v => { const n = parseFloat(v); return (!isNaN(n) && n >= 0 && n <= 10) ? n : undefined; };
    const plot = clampScore(scorePlot); if (plot !== undefined) scores.plot = plot;
    const pres = clampScore(scorePres); if (pres !== undefined) scores.presentation = pres;
    const total = clampScore(scoreTotal); if (total !== undefined) scores.overall = total;
    if (Object.keys(scores).length) review = `SCORES:${JSON.stringify(scores)}\n${review}`;
  }

  const data = {
    title:       draftMedia.title,
    type:        draftMedia.type,
    year:        draftMedia.year || null,
    coverUrl:    draftMedia.coverUrl || null,
    director:    draftMedia.director || null,
    author:      draftMedia.author || null,
    platform:    draftMedia.platform || null,
    genre:       draftMedia.genre || null,
    description: draftMedia.description || null,
    review:      review || null,
    tags:        step2Tags.join(',') || null,
    rating:      currentRating > 0 ? currentRating : null
  };

  try {
    if (editingMediaId) {
      await apiPut(`/media/${editingMediaId}`, data);
      toast('已更新！', 'success');
    } else {
      await apiPost('/media', data);
      toast('已添加！', 'success');
    }
    draftMedia = null;
    step2Tags = [];
    editingMediaId = null;
    currentRating = 0;
    localStorage.removeItem('mediavault_draft');
    render();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ===== Lists =====
async function renderLists() {
  const lists = await apiGet('/lists');
  document.getElementById('app').innerHTML = `
    <div class="page-header">
      <h1 class="page-title">📋 我的片单</h1>
      <button class="btn btn-primary" onclick="openCreateListModal()">➕ 新建片单</button>
    </div>
    ${lists.length ? `<div class="lists-grid">${lists.map(l => listCard(l)).join('')}</div>`
      : emptyState('📋', '暂无片单', '创建片单来整理您的媒体收藏。')}
  `;
}

function listCard(l) {
  return `<div class="list-card" onclick="navigate('/lists/${l.id}')">
    <div class="list-card-name">📋 ${escHtml(l.name)}</div>
    ${l.description ? `<div class="list-card-desc">${escHtml(l.description)}</div>` : ''}
    <div class="list-card-count">查看内容 →</div>
  </div>`;
}

function openCreateListModal() {
  openModal(`
    <h2 style="margin-bottom:20px;font-size:20px;font-weight:700;">➕ 新建片单</h2>
    <form onsubmit="submitCreateList(event)">
      <div class="form-group">
        <label class="form-label">片单名称 *</label>
        <input type="text" class="form-input" id="lName" required placeholder="我的观看清单">
      </div>
      <div class="form-group">
        <label class="form-label">描述</label>
        <textarea class="form-textarea" id="lDesc" placeholder="这个片单用来做什么？"></textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">取消</button>
        <button type="submit" class="btn btn-primary">创建片单</button>
      </div>
    </form>
  `);
}

async function submitCreateList(e) {
  e.preventDefault();
  try {
    await apiPost('/lists', {
      name:        document.getElementById('lName').value,
      description: document.getElementById('lDesc').value || null
    });
    toast('片单已创建！', 'success');
    closeModal();
    render();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ===== List Detail =====
async function renderListDetail(id) {
  const list = await apiGet(`/lists/${id}`);
  currentListName = list.name || '片单';
  const items = list.items || [];

  document.getElementById('app').innerHTML = `
    <div class="page-header">
      <div>
        <a href="#/lists" class="btn btn-ghost btn-sm" style="margin-bottom:8px;">← 返回片单列表</a>
        <h1 class="page-title">📋 ${escHtml(list.name)}</h1>
        ${list.description ? `<p class="text-muted" style="margin-top:4px;">${escHtml(list.description)}</p>` : ''}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" onclick="openAddToListModal(${id})">➕ 添加条目</button>
        <button class="btn btn-secondary btn-sm" data-id="${id}" data-name="${escHtml(list.name)}" data-desc="${escHtml(list.description || '')}" onclick="openEditListModalFromBtn(this)">✏️ 编辑片单</button>
        <button class="btn btn-secondary btn-sm" onclick="exportListImage(${id})">📷 导出图片</button>
        <button class="btn btn-secondary btn-sm" onclick="exportListPDF(${id})">📄 导出PDF</button>
        <button class="btn btn-danger btn-sm" data-id="${id}" data-name="${escHtml(list.name)}" onclick="deleteListFromBtn(this)">🗑️ 删除</button>
      </div>
    </div>
    ${items.length ? `
    <p class="text-muted mb-1" style="font-size:13px;">拖拽条目以重新排序</p>
    <div class="list-items-container" id="listItems" data-export="listExportArea">
      ${items.map((item, idx) => listItemRow(item, id, idx)).join('')}
    </div>` : emptyState('📭', '空片单', '向此片单添加媒体内容！')}
  `;

  setupDragAndDrop(id);
}

function listItemRow(item, listId, idx) {
  const m = item.media;
  const typePlaceholder = { movie: '🎥', tv: '��', book: '📚', game: '🎮' };
  const cover = m.coverUrl
    ? `<img class="list-item-cover" src="${escHtml(m.coverUrl)}" onerror="this.outerHTML='<div class=\\'list-item-placeholder\\'>${typePlaceholder[m.type] || '📄'}</div>'">`
    : `<div class="list-item-placeholder">${typePlaceholder[m.type] || '📄'}</div>`;
  return `<div class="list-item-row" draggable="true" data-media-id="${m.id}" data-order="${item.sortOrder}">
    <span class="drag-handle">⠿</span>
    ${cover}
    <div class="list-item-info">
      <div class="list-item-title">${escHtml(m.title)}</div>
      <div class="list-item-meta"><span class="badge badge-${m.type}">${typeLabel(m.type)}</span> ${m.year || ''}</div>
    </div>
    <button class="btn btn-ghost btn-sm btn-icon" onclick="viewFromList(${m.id})" title="查看">👁️</button>
    <button class="btn btn-ghost btn-sm btn-icon" onclick="removeFromList(${listId}, ${m.id})" title="移除">✕</button>
  </div>`;
}

function viewFromList(id) {
  showMediaDetail(id);
}

async function removeFromList(listId, mediaId) {
  try {
    await apiDelete(`/lists/${listId}/items/${mediaId}`);
    toast('已从片单移除', 'success');
    renderListDetail(listId);
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function deleteList(id, name) {
  if (!confirm(`确定要删除片单「${name}」吗？`)) return;
  try {
    await apiDelete(`/lists/${id}`);
    toast('片单已删除', 'success');
    navigate('/lists');
  } catch (e) {
    toast(e.message, 'error');
  }
}

function deleteListFromBtn(btn) {
  deleteList(btn.dataset.id, btn.dataset.name);
}

function openEditListModalFromBtn(btn) {
  openEditListModal(parseInt(btn.dataset.id), btn.dataset.name, btn.dataset.desc);
}

function openEditListModal(id, name, desc) {
  openModal(`
    <h2 style="margin-bottom:20px;font-size:20px;font-weight:700;">✏️ 编辑片单</h2>
    <form onsubmit="submitEditList(event, ${id})">
      <div class="form-group">
        <label class="form-label">片单名称 *</label>
        <input type="text" class="form-input" id="lName" required value="${escHtml(name)}">
      </div>
      <div class="form-group">
        <label class="form-label">描述</label>
        <textarea class="form-textarea" id="lDesc">${escHtml(desc)}</textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">取消</button>
        <button type="submit" class="btn btn-primary">保存</button>
      </div>
    </form>
  `);
}

async function submitEditList(e, id) {
  e.preventDefault();
  try {
    await apiPut(`/lists/${id}`, {
      name:        document.getElementById('lName').value,
      description: document.getElementById('lDesc').value || null
    });
    toast('片单已更新！', 'success');
    closeModal();
    renderListDetail(id);
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function openAddToListModal(listId) {
  const media = await apiGet('/media');
  openModal(`
    <h2 style="margin-bottom:16px;font-size:20px;font-weight:700;">➕ 添加到片单</h2>
    <div class="search-box" style="margin-bottom:12px;">
      <span>🔍</span>
      <input type="text" id="selectorSearch" placeholder="搜索媒体…" oninput="filterSelector(this.value)">
    </div>
    <div class="media-selector" id="mediaSelector">
      ${media.map(m => selectorItem(m, listId)).join('')}
    </div>
  `);
  window._selectorMedia = media;
  window._selectorListId = listId;
}

function selectorItem(m, listId) {
  const typePlaceholder = { movie: '🎥', tv: '📺', book: '📚', game: '🎮' };
  const cover = m.coverUrl
    ? `<img class="selector-cover" src="${escHtml(m.coverUrl)}" onerror="this.outerHTML='<div class=\\'selector-placeholder\\'>${typePlaceholder[m.type] || '📄'}</div>'">`
    : `<div class="selector-placeholder">${typePlaceholder[m.type] || '📄'}</div>`;
  return `<div class="media-selector-item" onclick="addToList(${listId}, ${m.id})">
    ${cover}
    <div class="selector-info">
      <div class="selector-title">${escHtml(m.title)}</div>
      <div class="selector-meta"><span class="badge badge-${m.type}">${typeLabel(m.type)}</span> ${m.year || ''}</div>
    </div>
  </div>`;
}

function filterSelector(search) {
  const media = window._selectorMedia || [];
  const listId = window._selectorListId;
  const filtered = search ? media.filter(m => m.title.toLowerCase().includes(search.toLowerCase())) : media;
  const el = document.getElementById('mediaSelector');
  if (el) el.innerHTML = filtered.map(m => selectorItem(m, listId)).join('');
}

async function addToList(listId, mediaId) {
  try {
    await apiPost(`/lists/${listId}/items`, { mediaId });
    toast('已添加到片单！', 'success');
    closeModal();
    renderListDetail(listId);
  } catch (e) {
    toast(e.message, 'error');
  }
}

// ===== Drag and Drop for Lists =====
function setupDragAndDrop(listId) {
  const container = document.getElementById('listItems');
  if (!container) return;

  let dragging = null;

  container.addEventListener('dragstart', (e) => {
    dragging = e.target.closest('.list-item-row');
    if (dragging) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', dragging.dataset.mediaId);
      setTimeout(() => dragging.style.opacity = '0.4', 0);
    }
  });

  container.addEventListener('dragend', () => {
    if (dragging) dragging.style.opacity = '';
    document.querySelectorAll('.list-item-row').forEach(r => r.classList.remove('drag-over'));
    dragging = null;
  });

  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.target.closest('.list-item-row');
    document.querySelectorAll('.list-item-row').forEach(r => r.classList.remove('drag-over'));
    if (target && target !== dragging) target.classList.add('drag-over');
  });

  container.addEventListener('drop', async (e) => {
    e.preventDefault();
    const target = e.target.closest('.list-item-row');
    document.querySelectorAll('.list-item-row').forEach(r => r.classList.remove('drag-over'));
    if (!target || !dragging || target === dragging) return;

    const rows = [...container.querySelectorAll('.list-item-row')];
    const fromIdx = rows.indexOf(dragging);
    const toIdx = rows.indexOf(target);
    rows.splice(fromIdx, 1);
    rows.splice(toIdx, 0, dragging);
    rows.forEach(r => container.appendChild(r));

    const reorderData = rows.map((r, idx) => ({
      mediaId: parseInt(r.dataset.mediaId),
      order: idx
    }));

    try {
      await apiPut(`/lists/${listId}/reorder`, reorderData);
    } catch (e) {
      toast('排序保存失败', 'error');
    }
  });
}

// ===== Tags =====
async function renderTags() {
  const tags = await apiGet('/tags');
  allTags = tags;

  document.getElementById('app').innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🏷️ 标签</h1>
    </div>
    ${tags.length ? `
    <div class="tags-grid">
      ${tags.map(t => `
        <div class="tag-item">
          <span onclick="navigate('/movies');filterByTagGlobal('${escHtml(t.name)}')" style="cursor:pointer;">🏷️ ${escHtml(t.name)}</span>
          <button class="tag-delete-btn" data-id="${t.id}" data-name="${escHtml(t.name)}" onclick="deleteTagFromBtn(this)">✕</button>
        </div>
      `).join('')}
    </div>
    <p class="text-muted" style="font-size:13px;">标签在添加媒体时自动创建。点击标签可按标签浏览媒体。</p>
    ` : emptyState('🏷️', '暂无标签', '在添加媒体条目时会自动创建标签。')}
  `;
}

async function deleteTag(id, name) {
  if (!confirm(`确定要删除标签「${name}」吗？删除后将从所有媒体中移除。`)) return;
  try {
    await apiDelete(`/tags/${id}`);
    toast('标签已删除', 'success');
    renderTags();
  } catch (e) {
    toast(e.message, 'error');
  }
}

function deleteTagFromBtn(btn) {
  deleteTag(btn.dataset.id, btn.dataset.name);
}

// ===== List Export =====
async function exportListImage(listId) {
  const el = document.getElementById('listItems');
  if (!el) { toast('没有可导出的内容', 'warning'); return; }
  toast('正在生成图片…', 'info');
  try {
    const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim() || '#f8f9fa';
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: bgColor });
    const link = document.createElement('a');
    link.download = (currentListName || 'playlist') + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast('图片已导出！', 'success');
  } catch (e) {
    console.error('html2canvas error:', e);
    toast('图片导出失败，请检查图片链接或重试', 'error');
  }
}

function exportListPDF(listId) {
  window.open(`/api/lists/${listId}/export`, '_blank');
}

// Initial render
render();
