/* ===================================================
   MediaVault - Single Page Application
   =================================================== */

const API = '/api';
let currentRoute = '/';
let allMedia = [];
let allTags = [];
let activeTagFilter = null;
let searchDebounceTimer = null;
let currentRating = 0;
let editingMediaId = null;
let dragSrcEl = null;
let dragListId = null;

// ===== Theme =====
const savedTheme = localStorage.getItem('theme') || 'light';
document.body.classList.toggle('dark-mode', savedTheme === 'dark');
updateThemeIcons(savedTheme);

function updateThemeIcons(theme) {
  const icon = theme === 'dark' ? '☀️' : '🌙';
  const el1 = document.getElementById('themeIcon');
  const el2 = document.getElementById('themeToggleMobile');
  if (el1) el1.textContent = icon;
  if (el2) el2.textContent = icon;
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
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

async function apiPost(path, data) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Request failed: ${res.status}`);
  return json;
}

async function apiPut(path, data) {
  const res = await fetch(API + path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Request failed: ${res.status}`);
  return json;
}

async function apiDelete(path) {
  const res = await fetch(API + path, { method: 'DELETE' });
  if (res.status === 204) return null;
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Request failed: ${res.status}`);
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
  activeTagFilter = null;

  document.querySelectorAll('.nav-link').forEach(a => {
    const r = a.getAttribute('data-route');
    a.classList.toggle('active', route === r || (r !== '/' && route.startsWith(r)));
  });

  sidebar.classList.remove('open');

  const app = document.getElementById('app');
  app.innerHTML = `<div class="loading"><div class="spinner"></div> Loading…</div>`;

  try {
    if (route === '/') {
      await renderDashboard();
    } else if (route === '/movies') {
      await renderMediaList('movie', '🎥 Movies');
    } else if (route === '/tv') {
      await renderMediaList('tv', '📺 TV Shows');
    } else if (route === '/books') {
      await renderMediaList('book', '📚 Books');
    } else if (route === '/games') {
      await renderMediaList('game', '🎮 Games');
    } else if (route === '/lists') {
      await renderLists();
    } else if (route.startsWith('/lists/')) {
      const id = route.split('/')[2];
      await renderListDetail(id);
    } else if (route === '/tags') {
      await renderTags();
    } else {
      app.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">Page not found</div><a href="#/" class="btn btn-primary mt-2">Go Home</a></div>`;
    }
  } catch (e) {
    app.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Error</div><div class="empty-state-text">${e.message}</div></div>`;
  }
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
  const recent = media.slice(0, 6);

  document.getElementById('app').innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🏠 Dashboard</h1>
      <button class="btn btn-primary" onclick="openAddMediaModal()">
        ➕ Add Media
      </button>
    </div>
    <div class="stats-grid">
      ${statCard('🎥', counts.movie, 'Movies', '#/movies')}
      ${statCard('📺', counts.tv, 'TV Shows', '#/tv')}
      ${statCard('📚', counts.book, 'Books', '#/books')}
      ${statCard('🎮', counts.game, 'Games', '#/games')}
      ${statCard('📋', lists.length, 'Lists', '#/lists')}
      ${statCard('🏷️', tags.length, 'Tags', '#/tags')}
    </div>
    ${recent.length ? `
    <h2 class="section-title">Recently Added</h2>
    <div class="media-grid">
      ${recent.map(m => mediaCard(m)).join('')}
    </div>
    ` : `<div class="empty-state">
      <div class="empty-state-icon">📽️</div>
      <div class="empty-state-title">Your library is empty</div>
      <div class="empty-state-text">Start by adding your first movie, book, game, or TV show.</div>
      <button class="btn btn-primary" onclick="openAddMediaModal()">➕ Add Your First Item</button>
    </div>`}
  `;
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
  const media = await apiGet(`/media?type=${type}`);
  allMedia = media;
  const tags = await apiGet('/tags');
  allTags = tags;

  document.getElementById('app').innerHTML = `
    <div class="page-header">
      <h1 class="page-title">${title}</h1>
      <button class="btn btn-primary" onclick="openAddMediaModal('${type}')">➕ Add ${type.charAt(0).toUpperCase()+type.slice(1)}</button>
    </div>
    <div class="filters-bar">
      <div class="search-box">
        <span>🔍</span>
        <input type="text" id="searchInput" placeholder="Search ${title.toLowerCase()}…" />
      </div>
      <div class="tag-filter" id="tagFilter">
        <span class="tag-chip active" onclick="filterByTag(null, this)">All</span>
        ${tags.map(t => `<span class="tag-chip" onclick="filterByTag('${escHtml(t.name)}', this)">${escHtml(t.name)}</span>`).join('')}
      </div>
    </div>
    <div class="media-grid" id="mediaGrid">
      ${media.length ? media.map(m => mediaCard(m)).join('') : emptyState('📭', 'No items yet', `Add your first ${type}!`)}
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
  if (grid) grid.innerHTML = media.length ? media.map(m => mediaCard(m)).join('') : emptyState('🔍', 'No results', 'Try a different search or filter');
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
        <span class="badge badge-${m.type}">${m.type}</span>
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

  const tags = m.tags ? m.tags.split(',').filter(t=>t.trim()) : [];
  const typeSpecific = (() => {
    if (m.type === 'movie' || m.type === 'tv') return m.director ? `<div class="detail-section"><div class="detail-section-label">Director</div><div class="detail-section-value">${escHtml(m.director)}</div></div>` : '';
    if (m.type === 'book') return m.author ? `<div class="detail-section"><div class="detail-section-label">Author</div><div class="detail-section-value">${escHtml(m.author)}</div></div>` : '';
    if (m.type === 'game') return m.platform ? `<div class="detail-section"><div class="detail-section-label">Platform</div><div class="detail-section-value">${escHtml(m.platform)}</div></div>` : '';
    return '';
  })();

  openModal(`
    <div class="detail-header">
      <div class="detail-cover">${cover}</div>
      <div class="detail-info">
        <div class="detail-title">${escHtml(m.title)}</div>
        <div class="detail-meta">
          <span class="badge badge-${m.type}">${m.type.toUpperCase()}</span>
          ${m.year ? `<span class="detail-year">${m.year}</span>` : ''}
        </div>
        ${m.rating ? `<div class="detail-rating"><div class="stars">${renderStars(m.rating)}</div><span style="color:var(--text-secondary);font-size:13px">${m.rating.toFixed(1)}/5</span></div>` : ''}
        ${m.genre ? `<div class="detail-section"><div class="detail-section-label">Genre</div><div class="detail-section-value">${escHtml(m.genre)}</div></div>` : ''}
        ${typeSpecific}
      </div>
    </div>
    ${m.description ? `<div class="detail-section"><div class="detail-section-label">Description</div><div class="detail-section-value">${escHtml(m.description)}</div></div>` : ''}
    ${m.review ? `<div class="detail-section"><div class="detail-section-label">My Review</div><div class="detail-section-value">${escHtml(m.review)}</div></div>` : ''}
    ${tags.length ? `<div class="detail-section"><div class="detail-section-label">Tags</div><div class="detail-tags">${tags.map(t => `<span class="tag-chip">${escHtml(t.trim())}</span>`).join('')}</div></div>` : ''}
    <div class="detail-actions">
      <button class="btn btn-secondary" onclick="openEditMediaModal(${m.id})">✏️ Edit</button>
      <button class="btn btn-danger" data-id="${m.id}" data-title="${escHtml(m.title)}" onclick="deleteMediaFromBtn(this)">🗑️ Delete</button>
    </div>
  `);
}

// ===== Add / Edit Media Modal =====
function openAddMediaModal(defaultType) {
  editingMediaId = null;
  currentRating = 0;
  openModal(buildMediaForm(null, defaultType));
  setupFormHandlers();
}

async function openEditMediaModal(id) {
  const m = await apiGet(`/media/${id}`);
  editingMediaId = id;
  currentRating = m.rating || 0;
  openModal(buildMediaForm(m));
  setupFormHandlers();
}

function buildMediaForm(m, defaultType) {
  const type = m?.type || defaultType || 'movie';
  const typeOptions = ['movie','tv','book','game'].map(t =>
    `<option value="${t}" ${type===t?'selected':''}>${t.charAt(0).toUpperCase()+t.slice(1)}</option>`
  ).join('');

  return `
    <h2 style="margin-bottom:20px;font-size:20px;font-weight:700;">
      ${m ? '✏️ Edit Media' : '➕ Add Media'}
    </h2>
    <div class="fetch-area">
      <div class="form-group">
        <label class="form-label">Auto-Fetch by Title</label>
        <input type="text" class="form-input" id="fetchTitle" placeholder="Enter title to fetch info…" value="${escHtml(m?.title||'')}">
      </div>
      <button class="btn btn-secondary" onclick="autoFetch()" id="fetchBtn">🔍 Fetch</button>
    </div>
    <div class="fetching-indicator" id="fetchingIndicator">
      <div class="spinner"></div> Fetching…
    </div>
    <form id="mediaForm" onsubmit="submitMediaForm(event)">
      <div class="form-grid">
        <div class="form-group" style="grid-column:span 2">
          <label class="form-label">Title *</label>
          <input type="text" class="form-input" id="fTitle" value="${escHtml(m?.title||'')}" required placeholder="Enter title">
        </div>
        <div class="form-group">
          <label class="form-label">Type *</label>
          <select class="form-select" id="fType" onchange="updateTypeFields(this.value)">${typeOptions}</select>
        </div>
        <div class="form-group">
          <label class="form-label">Year</label>
          <input type="number" class="form-input" id="fYear" value="${m?.year||''}" min="1800" max="2100" placeholder="e.g. 2024">
        </div>
        <div class="form-group" style="grid-column:span 2">
          <label class="form-label">Cover Image URL</label>
          <input type="url" class="form-input" id="fCoverUrl" value="${escHtml(m?.coverUrl||'')}" placeholder="https://…">
        </div>
        <div class="form-group" id="directorGroup" style="${(type==='movie'||type==='tv')?'':'display:none;'}">
          <label class="form-label">Director</label>
          <input type="text" class="form-input" id="fDirector" value="${escHtml(m?.director||'')}" placeholder="Director name">
        </div>
        <div class="form-group" id="authorGroup" style="${type==='book'?'':'display:none;'}">
          <label class="form-label">Author</label>
          <input type="text" class="form-input" id="fAuthor" value="${escHtml(m?.author||'')}" placeholder="Author name">
        </div>
        <div class="form-group" id="platformGroup" style="${type==='game'?'':'display:none;'}">
          <label class="form-label">Platform</label>
          <input type="text" class="form-input" id="fPlatform" value="${escHtml(m?.platform||'')}" placeholder="PC, PlayStation, Xbox…">
        </div>
        <div class="form-group">
          <label class="form-label">Genre</label>
          <input type="text" class="form-input" id="fGenre" value="${escHtml(m?.genre||'')}" placeholder="Action, Drama, RPG…">
        </div>
        <div class="form-group" style="grid-column:span 2">
          <label class="form-label">My Rating</label>
          <div class="star-picker" id="starPicker">
            ${[1,2,3,4,5].map(i => `<button type="button" class="star ${(m?.rating||0)>=i?'filled':''}" data-val="${i}" onclick="setRating(${i})">★</button>`).join('')}
          </div>
        </div>
        <div class="form-group" style="grid-column:span 2">
          <label class="form-label">Description</label>
          <textarea class="form-textarea" id="fDescription" placeholder="Synopsis or description…">${escHtml(m?.description||'')}</textarea>
        </div>
        <div class="form-group" style="grid-column:span 2">
          <label class="form-label">My Review</label>
          <textarea class="form-textarea" id="fReview" placeholder="Write your review…">${escHtml(m?.review||'')}</textarea>
        </div>
        <div class="form-group" style="grid-column:span 2">
          <label class="form-label">Tags (comma separated)</label>
          <input type="text" class="form-input" id="fTags" value="${escHtml(m?.tags||'')}" placeholder="action, sci-fi, classic…">
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">💾 ${m ? 'Save Changes' : 'Add Media'}</button>
      </div>
    </form>
  `;
}

function setupFormHandlers() {
  const type = document.getElementById('fType')?.value;
  if (type) updateTypeFields(type);
}

function updateTypeFields(type) {
  const dg = document.getElementById('directorGroup');
  const ag = document.getElementById('authorGroup');
  const pg = document.getElementById('platformGroup');
  if (dg) dg.style.display = (type==='movie'||type==='tv') ? '' : 'none';
  if (ag) ag.style.display = type==='book' ? '' : 'none';
  if (pg) pg.style.display = type==='game' ? '' : 'none';
}

function setRating(val) {
  currentRating = val;
  document.querySelectorAll('#starPicker .star').forEach(s => {
    s.classList.toggle('filled', parseInt(s.dataset.val) <= val);
  });
}

async function autoFetch() {
  const title = document.getElementById('fetchTitle')?.value;
  const type = document.getElementById('fType')?.value || 'movie';
  if (!title?.trim()) { toast('Enter a title to fetch', 'warning'); return; }

  const indicator = document.getElementById('fetchingIndicator');
  const btn = document.getElementById('fetchBtn');
  if (indicator) indicator.classList.add('active');
  if (btn) btn.disabled = true;

  try {
    const m = await apiPost('/fetch', { title: title.trim(), type });
    if (m.title) document.getElementById('fTitle').value = m.title;
    if (m.coverUrl) document.getElementById('fCoverUrl').value = m.coverUrl;
    if (m.description) document.getElementById('fDescription').value = m.description;
    if (m.year) document.getElementById('fYear').value = m.year;
    if (m.genre) document.getElementById('fGenre').value = m.genre;
    if (m.director) document.getElementById('fDirector').value = m.director;
    if (m.author) document.getElementById('fAuthor').value = m.author;
    if (m.platform) document.getElementById('fPlatform').value = m.platform;
    if (m.rating) setRating(Math.round(m.rating));
    toast('Info fetched successfully!', 'success');
  } catch (e) {
    toast('Could not fetch info. Fill manually.', 'warning');
  } finally {
    if (indicator) indicator.classList.remove('active');
    if (btn) btn.disabled = false;
  }
}

async function submitMediaForm(e) {
  e.preventDefault();
  const data = {
    title: document.getElementById('fTitle').value,
    type: document.getElementById('fType').value,
    coverUrl: document.getElementById('fCoverUrl').value || null,
    year: parseInt(document.getElementById('fYear').value) || null,
    description: document.getElementById('fDescription').value || null,
    review: document.getElementById('fReview').value || null,
    director: document.getElementById('fDirector').value || null,
    author: document.getElementById('fAuthor').value || null,
    platform: document.getElementById('fPlatform').value || null,
    genre: document.getElementById('fGenre').value || null,
    tags: document.getElementById('fTags').value || null,
    rating: currentRating > 0 ? currentRating : null
  };

  try {
    if (editingMediaId) {
      await apiPut(`/media/${editingMediaId}`, data);
      toast('Media updated!', 'success');
    } else {
      await apiPost('/media', data);
      toast('Media added!', 'success');
    }
    closeModal();
    render();
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function deleteMedia(id, title) {
  if (!confirm(`Delete "${title}"?`)) return;
  try {
    await apiDelete(`/media/${id}`);
    toast('Media deleted', 'success');
    closeModal();
    render();
  } catch (e) {
    toast(e.message, 'error');
  }
}

function deleteMediaFromBtn(btn) {
  deleteMedia(btn.dataset.id, btn.dataset.title);
}

// ===== Lists =====
async function renderLists() {
  const lists = await apiGet('/lists');
  document.getElementById('app').innerHTML = `
    <div class="page-header">
      <h1 class="page-title">📋 My Lists</h1>
      <button class="btn btn-primary" onclick="openCreateListModal()">➕ New List</button>
    </div>
    ${lists.length ? `<div class="lists-grid">${lists.map(l => listCard(l)).join('')}</div>`
      : emptyState('📋', 'No lists yet', 'Create a list to organize your media collection.')}
  `;
}

function listCard(l) {
  return `<div class="list-card" onclick="navigate('/lists/${l.id}')">
    <div class="list-card-name">📋 ${escHtml(l.name)}</div>
    ${l.description ? `<div class="list-card-desc">${escHtml(l.description)}</div>` : ''}
    <div class="list-card-count">View items →</div>
  </div>`;
}

function openCreateListModal() {
  openModal(`
    <h2 style="margin-bottom:20px;font-size:20px;font-weight:700;">➕ Create New List</h2>
    <form onsubmit="submitCreateList(event)">
      <div class="form-group">
        <label class="form-label">List Name *</label>
        <input type="text" class="form-input" id="lName" required placeholder="My Watchlist">
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" id="lDesc" placeholder="What's this list for?"></textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Create List</button>
      </div>
    </form>
  `);
}

async function submitCreateList(e) {
  e.preventDefault();
  try {
    await apiPost('/lists', {
      name: document.getElementById('lName').value,
      description: document.getElementById('lDesc').value || null
    });
    toast('List created!', 'success');
    closeModal();
    render();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// ===== List Detail =====
async function renderListDetail(id) {
  const list = await apiGet(`/lists/${id}`);
  const items = list.items || [];

  document.getElementById('app').innerHTML = `
    <div class="page-header">
      <div>
        <a href="#/lists" class="btn btn-ghost btn-sm" style="margin-bottom:8px;">← Back to Lists</a>
        <h1 class="page-title">📋 ${escHtml(list.name)}</h1>
        ${list.description ? `<p class="text-muted" style="margin-top:4px;">${escHtml(list.description)}</p>` : ''}
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" onclick="openAddToListModal(${id})">➕ Add Item</button>
        <button class="btn btn-secondary btn-sm" data-id="${id}" data-name="${escHtml(list.name)}" data-desc="${escHtml(list.description||'')}" onclick="openEditListModalFromBtn(this)">✏️ Edit</button>
        <button class="btn btn-danger btn-sm" data-id="${id}" data-name="${escHtml(list.name)}" onclick="deleteListFromBtn(this)">🗑️ Delete</button>
      </div>
    </div>
    ${items.length ? `
    <p class="text-muted mb-1" style="font-size:13px;">Drag items to reorder</p>
    <div class="list-items-container" id="listItems">
      ${items.map((item, idx) => listItemRow(item, id, idx)).join('')}
    </div>` : emptyState('📭', 'Empty list', 'Add some media to this list!')}
  `;

  setupDragAndDrop(id);
}

function listItemRow(item, listId, idx) {
  const m = item.media;
  const typePlaceholder = { movie: '🎥', tv: '📺', book: '📚', game: '🎮' };
  const cover = m.coverUrl
    ? `<img class="list-item-cover" src="${escHtml(m.coverUrl)}" onerror="this.outerHTML='<div class=\\'list-item-placeholder\\'>${typePlaceholder[m.type]||'📄'}</div>'">`
    : `<div class="list-item-placeholder">${typePlaceholder[m.type]||'📄'}</div>`;
  return `<div class="list-item-row" draggable="true" data-media-id="${m.id}" data-order="${item.sortOrder}">
    <span class="drag-handle">⠿</span>
    ${cover}
    <div class="list-item-info">
      <div class="list-item-title">${escHtml(m.title)}</div>
      <div class="list-item-meta"><span class="badge badge-${m.type}">${m.type}</span> ${m.year||''}</div>
    </div>
    <button class="btn btn-ghost btn-sm btn-icon" onclick="viewFromList(${m.id})" title="View">👁️</button>
    <button class="btn btn-ghost btn-sm btn-icon" onclick="removeFromList(${listId}, ${m.id})" title="Remove">✕</button>
  </div>`;
}

function viewFromList(id) {
  showMediaDetail(id);
}

async function removeFromList(listId, mediaId) {
  try {
    await apiDelete(`/lists/${listId}/items/${mediaId}`);
    toast('Removed from list', 'success');
    renderListDetail(listId);
  } catch (e) {
    toast(e.message, 'error');
  }
}

async function deleteList(id, name) {
  if (!confirm(`Delete list "${name}"?`)) return;
  try {
    await apiDelete(`/lists/${id}`);
    toast('List deleted', 'success');
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
    <h2 style="margin-bottom:20px;font-size:20px;font-weight:700;">✏️ Edit List</h2>
    <form onsubmit="submitEditList(event, ${id})">
      <div class="form-group">
        <label class="form-label">List Name *</label>
        <input type="text" class="form-input" id="lName" required value="${escHtml(name)}">
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-textarea" id="lDesc">${escHtml(desc)}</textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-primary">Save</button>
      </div>
    </form>
  `);
}

async function submitEditList(e, id) {
  e.preventDefault();
  try {
    await apiPut(`/lists/${id}`, {
      name: document.getElementById('lName').value,
      description: document.getElementById('lDesc').value || null
    });
    toast('List updated!', 'success');
    closeModal();
    renderListDetail(id);
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function openAddToListModal(listId) {
  const media = await apiGet('/media');
  openModal(`
    <h2 style="margin-bottom:16px;font-size:20px;font-weight:700;">➕ Add to List</h2>
    <div class="search-box" style="margin-bottom:12px;">
      <span>🔍</span>
      <input type="text" id="selectorSearch" placeholder="Search media…" oninput="filterSelector(this.value)">
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
    ? `<img class="selector-cover" src="${escHtml(m.coverUrl)}" onerror="this.outerHTML='<div class=\\'selector-placeholder\\'>${typePlaceholder[m.type]||'📄'}</div>'">`
    : `<div class="selector-placeholder">${typePlaceholder[m.type]||'📄'}</div>`;
  return `<div class="media-selector-item" onclick="addToList(${listId}, ${m.id})">
    ${cover}
    <div class="selector-info">
      <div class="selector-title">${escHtml(m.title)}</div>
      <div class="selector-meta"><span class="badge badge-${m.type}">${m.type}</span> ${m.year||''}</div>
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
    toast('Added to list!', 'success');
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
      toast('Reorder failed', 'error');
    }
  });
}

// ===== Tags =====
async function renderTags() {
  const tags = await apiGet('/tags');
  allTags = tags;

  document.getElementById('app').innerHTML = `
    <div class="page-header">
      <h1 class="page-title">🏷️ Tags</h1>
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
    <p class="text-muted" style="font-size:13px;">Tags are created automatically when you add media. Click a tag to browse media with that tag.</p>
    ` : emptyState('🏷️', 'No tags yet', 'Tags are created when you add media items.')}
  `;
}

async function deleteTag(id, name) {
  if (!confirm(`Delete tag "${name}"? It will be removed from all media.`)) return;
  try {
    await apiDelete(`/tags/${id}`);
    toast('Tag deleted', 'success');
    renderTags();
  } catch (e) {
    toast(e.message, 'error');
  }
}

function deleteTagFromBtn(btn) {
  deleteTag(btn.dataset.id, btn.dataset.name);
}

// ===== Utilities =====
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

// Initial render
render();
