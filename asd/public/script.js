/* ═══════════════════════════════════════════
   BIOLINK — script.js
═══════════════════════════════════════════ */

// ─── STATE ───────────────────────────────
let currentUser = null;
let audioPlaying = false;
let audioProgress = 35;
let audioInterval = null;

const DEFAULT_PROFILE = {
  username: '',
  email: '',
  password: '',
  uid: 1,
  displayName: '',
  avatar: '🐺',
  bio: ['developer • designer • creator 🚀', 'building cool stuff', 'dm me to collab! 👾'],
  bannerBg: 'linear-gradient(135deg,#1e1033,#0f172a)',
  badges: ['verified'],
  socials: { twitter:'', youtube:'', instagram:'', discord:'', telegram:'', github:'', tiktok:'', steam:'' },
  links: [
    { emoji:'🌐', title:'My Website', url:'https://example.com', subtitle:'example.com' },
    { emoji:'📦', title:'Projects', url:'#', subtitle:'Check out my work' },
    { emoji:'☕', title:'Buy me a coffee', url:'#', subtitle:'Support my work' }
  ],
  songTitle: '',
  songArtist: '',
  dcServerName: '',
  dcMembers: '',
  dcUrl: '#',
  views: 0,
  joined: new Date().getFullYear(),
  dcConnected: false,
};

// ─── STORAGE HELPERS ─────────────────────
function getUsers() {
  try { return JSON.parse(localStorage.getItem('bl_users') || '{}'); } catch { return {}; }
}
function saveUsers(u) { localStorage.setItem('bl_users', JSON.stringify(u)); }
function getSession() {
  try { return localStorage.getItem('bl_session') || null; } catch { return null; }
}
function saveSession(u) { 
  try { localStorage.setItem('bl_session', u); } catch(e) { console.error('Save session failed', e); }
}
function clearSession() { 
  try { localStorage.removeItem('bl_session'); } catch(e) {} 
}

// Get next sequential UID
function getNextUID() {
  const users = getUsers();
  const uids = Object.values(users).map(u => Number(u.uid) || 0).filter(n => !isNaN(n));
  return uids.length ? Math.max(...uids) + 1 : 1;
}

// Format UID with commas for display: 1234567 -> "1,234,567"
function formatUID(n) {
  return Number(n).toLocaleString('en-US');
}

// ─── INIT ─────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  animateHeroStats();
  buildBadgesSection();
  buildSocialsInputs();
  buildTemplates();
  buildCharts();
  updateNavBar();
  updateLiveStats();

  const session = getSession();
  if (session) {
    const users = getUsers();
    if (users[session]) {
      currentUser = session;
      loadDashboard();
      _showPageDirect('dashboard');
    }
  }
});

// ─── UPDATE NAV BAR ──────────────────────
function updateNavBar() {
  const actions = document.getElementById('land-nav-actions');
  if (!actions) return;
  const session = getSession();
  const users = getUsers();

  if (session && users[session]) {
    const p = users[session];
    actions.innerHTML = `
      <div class="nav-user-pill" onclick="showPage('dashboard')">
        <span class="nav-user-avatar">${p.avatar || '🐺'}</span>
        <span class="nav-user-name">${p.username}</span>
      </div>
      <button class="btn btn-primary btn-sm" onclick="showPage('dashboard')">⚡ Dashboard</button>
    `;
  } else {
    actions.innerHTML = `
      <button class="btn btn-ghost btn-sm" onclick="showAuth('login')">Войти</button>
      <button class="btn btn-primary btn-sm" onclick="showAuth('register')">Регистрация</button>
    `;
  }
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
  const nav = document.getElementById('land-nav');
  if (nav) nav.style.background = window.scrollY > 20
    ? 'rgba(10,10,15,0.96)' : 'rgba(10,10,15,0.85)';
});

// ─── PAGE ROUTER ─────────────────────────
function showPage(name) {
  // Protect dashboard from unauthenticated access
  if (name === 'dashboard') {
    const sess = getSession();
    if (!sess) { 
      _showAuthDirect('login'); 
      return; 
    }
    const usrs = getUsers();
    if (!usrs[sess]) { 
      clearSession(); 
      currentUser = null;
      _showAuthDirect('login'); 
      return; 
    }
    // Ensure currentUser is set
    if (!currentUser) currentUser = sess;
  }
  _showPageDirect(name);
}

// Internal: show page without auth check (used by login/register flow)
function _showPageDirect(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + name);
  if (el) el.classList.add('active');
  window.scrollTo(0, 0);
  if (name === 'landing') updateNavBar();
}

// Internal: show auth without triggering dashboard guard
function _showAuthDirect(tab) {
  _showPageDirect('auth');
  setTimeout(() => switchAuthTab(tab), 0);
}

// ─── TOAST ───────────────────────────────
let toastTimer = null;
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  const icons = { success:'✓', error:'✕', info:'ℹ' };
  document.getElementById('toast-icon').textContent = icons[type] || '✓';
  document.getElementById('toast-msg').textContent = msg;
  t.className = 'show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.className = '', 3000);
}

// ─── HERO STATS ANIMATION ────────────────
function animateHeroStats() {
  document.querySelectorAll('.hstat-num').forEach(el => {
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const div = parseFloat(el.dataset.div || 1);
    let cur = 0;
    const steps = 60;
    const inc = target / steps;
    const timer = setInterval(() => {
      cur = Math.min(cur + inc, target);
      const display = div > 1 ? (cur / div).toFixed(1) : Math.floor(cur);
      el.textContent = display + suffix;
      if (cur >= target) clearInterval(timer);
    }, 30);
  });
}

// ─── LIVE STATS (real user count) ────────
function updateLiveStats() {
  const users = getUsers();
  const userCount = Object.keys(users).length;
  const totalViews = Object.values(users).reduce((s, u) => s + (u.views || 0), 0);
  const totalLinks = Object.values(users).reduce((s, u) => s + ((u.links || []).length), 0);

  // Update hero stat for Users (real count)
  const userStatEl = document.querySelector('[data-stat="users"]');
  if (userStatEl) userStatEl.textContent = userCount.toLocaleString();

  // Update counters in hero if exists
  const liveUsersEl = document.getElementById('live-user-count');
  if (liveUsersEl) liveUsersEl.textContent = userCount.toLocaleString();

  const liveViewsEl = document.getElementById('live-views-count');
  if (liveViewsEl) liveViewsEl.textContent = totalViews.toLocaleString();

  // Update footer live count
  const footerCount = document.getElementById('footer-user-count');
  if (footerCount) footerCount.textContent = userCount.toLocaleString();

  // Auth page count
  const authCount = document.getElementById('auth-user-count');
  if (authCount) authCount.textContent = userCount.toLocaleString();
}

// ─── FAQ ─────────────────────────────────
function toggleFaq(item) {
  const open = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!open) item.classList.add('open');
}

// ─── SIDEBAR GROUP TOGGLE ────────────────
function toggleSidebarGroup(name) {
  const items = document.getElementById('sgi-' + name);
  const arrow = document.getElementById('sgh-arrow-' + name);
  const header = document.querySelector('.sidebar-group-header');
  if (!items) return;
  const isOpen = items.style.display !== 'none' && items.style.display !== '';
  if (isOpen) {
    items.style.display = 'none';
    if (arrow) arrow.textContent = '▼';
    if (header) header.classList.remove('open');
  } else {
    items.style.display = 'flex';
    if (arrow) arrow.textContent = '▲';
    if (header) header.classList.add('open');
  }
}

// ─── AUTH HELPERS ────────────────────────
function showAuth(tab) {
  _showAuthDirect(tab);
}

function switchAuthTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('form-login').style.display = tab === 'login' ? 'flex' : 'none';
  document.getElementById('form-register').style.display = tab === 'register' ? 'flex' : 'none';
  // Update live user count on auth page
  const authEl = document.getElementById('auth-user-count');
  if (authEl) authEl.textContent = Object.keys(getUsers()).length.toLocaleString();
}

// ─── AUTH HELPERS EXTENDED ───────────────
function togglePasswordVisibility(id, btn) {
  const inp = document.getElementById(id);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁' : '🙈';
}

function checkUsernameAvail(val) {
  const el = document.getElementById('username-avail');
  if (!el || !val || val.length < 2) { if (el) el.textContent = ''; return; }
  const clean = val.toLowerCase().replace(/[^a-z0-9_]/g,'');
  const users = getUsers();
  if (users[clean]) {
    el.textContent = '✕ Занят';
    el.style.color = '#f43f5e';
  } else {
    el.textContent = '✓ Свободен';
    el.style.color = '#22c55e';
  }
}

function checkPasswordStrength(val) {
  const bar = document.getElementById('pass-strength');
  const fill = document.getElementById('pass-fill');
  const label = document.getElementById('pass-label');
  if (!bar || !fill || !label) return;
  if (!val) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  let score = 0;
  if (val.length >= 6) score++;
  if (val.length >= 10) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^a-zA-Z0-9]/.test(val)) score++;
  if (/[A-Z]/.test(val)) score++;
  const levels = [
    { pct:'20%', color:'#f43f5e', text:'Очень слабый' },
    { pct:'40%', color:'#fb923c', text:'Слабый' },
    { pct:'60%', color:'#fbbf24', text:'Средний' },
    { pct:'80%', color:'#86efac', text:'Хороший' },
    { pct:'100%', color:'#22c55e', text:'Отличный' },
  ];
  const lv = levels[Math.min(score, levels.length) - 1] || levels[0];
  fill.style.width = lv.pct;
  fill.style.background = lv.color;
  label.textContent = lv.text;
  label.style.color = lv.color;
}

function setAuthError(formType, msg) {
  const el = document.getElementById(formType + '-error');
  if (!el) return;
  if (msg) { el.textContent = msg; el.style.display = 'block'; }
  else { el.style.display = 'none'; }
}

// Update auth page user count
function updateAuthCount() {
  const el = document.getElementById('auth-user-count');
  if (!el) return;
  const count = Object.keys(getUsers()).length;
  el.textContent = count.toLocaleString();
}

function updateClaimPreview(val) {
  const p = document.getElementById('claim-preview');
  if (p) p.textContent = 'biolink.app/' + (val || 'yourname');
}

function claimHero() {
  const v = document.getElementById('hero-claim-input').value.trim();
  showAuth('register');
  setTimeout(() => {
    const ru = document.getElementById('reg-username');
    if (ru && v) { ru.value = v; updateClaimPreview(v); }
  }, 100);
}
function claimCta() {
  const v = document.getElementById('cta-claim-input')?.value.trim();
  showAuth('register');
  setTimeout(() => {
    const ru = document.getElementById('reg-username');
    if (ru && v) { ru.value = v; updateClaimPreview(v); }
  }, 100);
}

// ─── REGISTER ────────────────────────────
function doRegister() {
  const username = document.getElementById('reg-username').value.trim().toLowerCase().replace(/[^a-z0-9_]/g,'');
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-pass').value;

  setAuthError('reg', '');
  if (!username) return setAuthError('reg', '⚠ Введите никнейм');
  if (username.length < 3) return setAuthError('reg', '⚠ Никнейм должен быть от 3 символов');
  if (!email || !email.includes('@')) return setAuthError('reg', '⚠ Введите корректный email');
  if (password.length < 6) return setAuthError('reg', '⚠ Пароль должен быть от 6 символов');

  const users = getUsers();
  if (users[username]) return setAuthError('reg', '✕ Этот никнейм уже занят');

  // Sequential UID
  const uid = getNextUID();

  users[username] = {
    ...DEFAULT_PROFILE,
    username, email, password,
    uid,
    displayName: username,
    views: Math.floor(Math.random() * 15) + 3,
    joined: new Date().getFullYear(),
  };

  saveUsers(users);
  saveSession(username);
  currentUser = username;
  loadDashboard();
  updateNavBar();
  updateLiveStats();
  showToast('Добро пожаловать в biolink! 🎉', 'success');
  _showPageDirect('dashboard');
}

// ─── LOGIN ────────────────────────────────
function doLogin() {
  setAuthError('login', '');
  const userInput = document.getElementById('login-user').value.trim().toLowerCase();
  const pass      = document.getElementById('login-pass').value;

  if (!userInput || !pass) return setAuthError('login', '⚠ Заполните все поля');

  const users = getUsers();
  let found = null;
  for (const [un, data] of Object.entries(users)) {
    if ((un === userInput || data.email === userInput) && data.password === pass) {
      found = un; break;
    }
  }

  if (!found) return setAuthError('login', '✕ Неверный логин или пароль');

  saveSession(found);
  currentUser = found;
  loadDashboard();
  updateNavBar();
  showToast('С возвращением! 👋', 'success');
  _showPageDirect('dashboard');
}

// ─── LOGOUT ──────────────────────────────
function doLogout() {
  clearSession();
  currentUser = null;
  updateNavBar();
  showToast('Вы вышли из аккаунта', 'info');
  showPage('landing');
}

// ─── GET/SET USER DATA ───────────────────
function getProfile() {
  if (!currentUser) return { ...DEFAULT_PROFILE };
  const users = getUsers();
  return users[currentUser] || { ...DEFAULT_PROFILE };
}

function setProfile(data) {
  if (!currentUser) return;
  const users = getUsers();
  users[currentUser] = { ...users[currentUser], ...data };
  saveUsers(users);
}

// ─── LOAD DASHBOARD ──────────────────────
function loadDashboard() {
  const p = getProfile();
  const uidFormatted = formatUID(p.uid);

  // Sidebar user card
  document.getElementById('sidebar-uname').textContent = p.username;
  document.getElementById('sidebar-uid-label').textContent = 'UID ' + uidFormatted;
  document.getElementById('sidebar-avatar-el').textContent = p.avatar || '🐺';
  const sghAvatar = document.getElementById('sgh-avatar');
  if (sghAvatar) sghAvatar.textContent = p.avatar || '🐺';

  // Overview top stats
  document.getElementById('ov-username').textContent = p.username;
  document.getElementById('ov-uid').textContent = uidFormatted;
  document.getElementById('ov-views').textContent = p.views;

  // UID subtitle: calculate percentile based on UID
  const users = getUsers();
  const total = Object.keys(users).length || 1;
  const rank = p.uid;
  const pctile = Math.round((rank / Math.max(total, 10)) * 100);
  const uidSub = document.getElementById('ov-uid-sub');
  if (uidSub) uidSub.textContent = `В числе первых ${Math.min(pctile, 99)}%`;

  updateCompletion(p);
  loadCustomizeForm(p);
  loadLinksForm(p);
  loadSocialsForm(p);
  loadBadgesForm(p);
  buildCharts();

  // Overview banner
  const ovbGreeting = document.getElementById('ovb-greeting');
  const ovbUsername = document.getElementById('ovb-username');
  const dashWelcome = document.getElementById('dash-welcome');
  const hour = new Date().getHours();
  const greet = hour < 12 ? '🌅 Доброе утро,' : hour < 18 ? '☀️ Добрый день,' : '🌙 Добрый вечер,';
  if (ovbGreeting) ovbGreeting.textContent = `${greet} @${p.username}!`;
  if (ovbUsername) ovbUsername.textContent = p.username;
  if (dashWelcome) dashWelcome.textContent = `Привет, ${p.username}!`;

  // Settings prefill
  const su = document.getElementById('settings-username');
  const se = document.getElementById('settings-email');
  if (su) su.value = p.username;
  if (se) se.value = p.email;

  // Discord connection
  updateDiscordBox(p);
}

function updateDiscordBox(p) {
  const box = document.getElementById('discord-connect-box');
  const text = document.getElementById('dcb-text');
  if (!box || !text) return;
  if (p.dcConnected) {
    box.style.background = 'rgba(88,101,242,.12)';
    box.style.borderColor = 'rgba(88,101,242,.3)';
    text.textContent = 'Discord подключён';
  } else {
    box.style.background = 'rgba(255,255,255,.04)';
    box.style.borderColor = 'rgba(255,255,255,.1)';
    text.textContent = 'Discord не подключён';
  }
}

// ─── COMPLETION ──────────────────────────
function updateCompletion(p) {
  const checks = {
    'ci-avatar':  !!p.avatar,
    'ci-bio':     p.bio && p.bio.filter(Boolean).length > 0,
    'ci-discord': !!p.dcConnected,
    'ci-socials': p.socials && Object.values(p.socials).some(v => v),
    'ci-links':   p.links && p.links.length > 0,
    'ci-2fa':     false,
  };

  let done = 0;
  for (const [id, val] of Object.entries(checks)) {
    const el = document.getElementById(id);
    const dot = document.getElementById(id + '-dot');
    if (el) el.classList.toggle('done', val);
    if (dot) {
      dot.classList.toggle('done', val);
      dot.textContent = val ? '✓' : '';
    }
    if (val) done++;
  }

  const pct = Math.round((done / Object.keys(checks).length) * 100);
  const pctEl = document.getElementById('comp-pct');
  const barEl = document.getElementById('comp-bar');
  if (pctEl) pctEl.textContent = pct + '% завершено';
  if (barEl) barEl.style.width = pct + '%';

  const warn = document.getElementById('comp-warning');
  if (warn) warn.style.display = pct >= 100 ? 'none' : 'flex';
}

// ─── SWITCH SECTION ──────────────────────
function switchSection(btn) {
  // Deactivate all sidebar items and subitems
  document.querySelectorAll('.sidebar-item, .sidebar-subitem').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const section = btn.dataset.section;
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById('section-' + section);
  if (sec) sec.classList.add('active');

  const titles = {
    overview:'Обзор аккаунта', analytics:'Аналитика', badges:'Значки',
    settings:'Настройки аккаунта', customize:'Настроить профиль', links:'Ссылки',
    socials:'Соцсети', premium:'Премиум', imagehost:'Image Host', templates:'Шаблоны'
  };
  const titleEl = document.getElementById('dash-title');
  if (titleEl) titleEl.textContent = titles[section] || section;
  document.getElementById('dash-content').scrollTop = 0;
}

// ─── SETTINGS ────────────────────────────
function saveUsername() {
  const newName = document.getElementById('settings-username').value.trim().toLowerCase().replace(/[^a-z0-9_]/g,'');
  if (!newName || newName.length < 3) return showToast('Некорректный никнейм', 'error');

  const users = getUsers();
  if (users[newName] && newName !== currentUser) return showToast('Никнейм уже занят', 'error');

  const profile = { ...users[currentUser], username: newName };
  delete users[currentUser];
  users[newName] = profile;
  saveUsers(users);
  saveSession(newName);
  currentUser = newName;
  loadDashboard();
  updateNavBar();
  showToast('Никнейм обновлён!', 'success');
}

function saveEmail() {
  const email = document.getElementById('settings-email').value.trim();
  if (!email.includes('@')) return showToast('Некорректный email', 'error');
  setProfile({ email });
  showToast('Email обновлён!', 'success');
}

function savePassword() {
  const pass = document.getElementById('settings-pass').value;
  if (pass.length < 6) return showToast('Пароль слишком короткий', 'error');
  setProfile({ password: pass });
  document.getElementById('settings-pass').value = '';
  showToast('Пароль обновлён!', 'success');
}

function disconnectDiscord() {
  setProfile({ dcConnected: false });
  updateDiscordBox(getProfile());
  updateCompletion(getProfile());
  showToast('Discord отключён', 'info');
}

function shareProfile() {
  const p = getProfile();
  const url = window.location.href.split('?')[0] + '?user=' + p.username;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => showToast('Ссылка скопирована! 🔗', 'success'));
  } else {
    showToast('biolink.app/' + p.username, 'info');
  }
}

// ─── CUSTOMIZE ───────────────────────────
function loadCustomizeForm(p) {
  const dn = document.getElementById('cust-displayname');
  const bio = document.getElementById('cust-bio');
  const st = document.getElementById('cust-song-title');
  const sa = document.getElementById('cust-song-artist');
  const dcn = document.getElementById('cust-dc-name');
  const dcm = document.getElementById('cust-dc-members');
  const dcu = document.getElementById('cust-dc-url');
  const av = document.getElementById('avatar-emoji-display');
  const avBig = document.getElementById('avatar-preview-big');

  if (dn) dn.value = p.displayName || p.username;
  if (bio) bio.value = Array.isArray(p.bio) ? p.bio.join('\n') : (p.bio || '');
  if (st) st.value = p.songTitle || '';
  if (sa) sa.value = p.songArtist || '';
  if (dcn) dcn.value = p.dcServerName || '';
  if (dcm) dcm.value = p.dcMembers || '';
  if (dcu) dcu.value = p.dcUrl || '';
  if (av) av.textContent = p.avatar || '🐺';
  if (avBig) avBig.querySelector('span').textContent = p.avatar || '🐺';

  renderLivePreview();
}

function setAvatar(emoji) {
  setProfile({ avatar: emoji });
  const av = document.getElementById('avatar-emoji-display');
  const avBig = document.getElementById('avatar-preview-big');
  const sideAv = document.getElementById('sidebar-avatar-el');
  const sghAv = document.getElementById('sgh-avatar');
  if (av) av.textContent = emoji;
  if (avBig) avBig.querySelector('span').textContent = emoji;
  if (sideAv) sideAv.textContent = emoji;
  if (sghAv) sghAv.textContent = emoji;
  livePreview();
}

function setBanner(el, bg) {
  document.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  setProfile({ bannerBg: bg });
  livePreview();
}

function livePreview() { renderLivePreview(); }

function saveCustomize() {
  const displayName = document.getElementById('cust-displayname')?.value.trim() || '';
  const bioRaw = document.getElementById('cust-bio')?.value || '';
  const bio = bioRaw.split('\n').map(l => l.trim()).filter(Boolean);
  const songTitle = document.getElementById('cust-song-title')?.value.trim() || '';
  const songArtist = document.getElementById('cust-song-artist')?.value.trim() || '';
  const dcServerName = document.getElementById('cust-dc-name')?.value.trim() || '';
  const dcMembers = document.getElementById('cust-dc-members')?.value.trim() || '';
  const dcUrl = document.getElementById('cust-dc-url')?.value.trim() || '';

  setProfile({ displayName, bio, songTitle, songArtist, dcServerName, dcMembers, dcUrl });
  updateCompletion(getProfile());
  showToast('Профиль сохранён! 🎉', 'success');
}

// ─── LIVE PREVIEW RENDERER ───────────────
function renderLivePreview() {
  const p = getProfile();
  const container = document.getElementById('live-preview-inner');
  if (!container) return;

  const badges = (p.badges || []).map(b => {
    const defs = { premium:'★ Premium', verified:'✓ Verified', og:'OG', staff:'Staff', dev:'Dev', artist:'🎨 Artist' };
    return `<span class="p-badge ${b}">${defs[b] || b}</span>`;
  }).join('');

  const bioLine = Array.isArray(p.bio) ? (p.bio[0] || '') : (p.bio || '');
  const linksHtml = (p.links || []).map(l => `
    <div class="p-link-btn">
      <div class="p-link-emoji">${l.emoji || '🔗'}</div>
      <div class="p-link-text">
        <span class="p-link-title">${escHtml(l.title || 'Link')}</span>
        <span class="p-link-sub">${escHtml(l.subtitle || '')}</span>
      </div>
      <span class="p-link-arrow">›</span>
    </div>
  `).join('');

  const socialEntries = Object.entries(p.socials || {}).filter(([,v]) => v);
  const socialIcons = { twitter:'𝕏', youtube:'▶', instagram:'📷', discord:'💬', telegram:'✈', github:'🐙', tiktok:'🎵', steam:'🎮' };
  const socialsHtml = socialEntries.length ? `
    <div class="p-socials">
      ${socialEntries.map(([k]) => `<div class="p-sicon">${socialIcons[k] || '🔗'}</div>`).join('')}
    </div>` : '';

  const dcHtml = p.dcServerName ? `
    <div class="p-discord">
      <div class="p-dc-icon">🎮</div>
      <div style="flex:1"><div class="p-dc-name">${escHtml(p.dcServerName)}</div>
        <div class="p-dc-status">${escHtml(p.dcMembers || '0')} members</div></div>
      <div class="p-dc-join">Join</div>
    </div>` : '';

  const songHtml = p.songTitle ? `
    <div class="p-audio">
      <div class="p-audio-top">
        <div class="p-audio-art">🎵</div>
        <div><div class="p-audio-title">${escHtml(p.songTitle)}</div>
          <div class="p-audio-artist">${escHtml(p.songArtist || '')}</div></div>
        <div class="playing-bars"><s></s><s></s><s></s><s></s></div>
      </div>
      <div class="p-audio-ctrl">
        <div class="p-audio-play">▶</div>
        <div class="p-audio-track"><div class="p-audio-fill" style="width:35%"></div></div>
        <span class="p-audio-time">1:24 / 3:47</span>
      </div>
    </div>` : '';

  container.innerHTML = `
    <div class="p-card" style="margin-bottom:10px;animation:none">
      <div class="p-banner"><div class="p-banner-inner" style="background:${p.bannerBg || 'linear-gradient(135deg,#1e1033,#0f172a)'}"></div></div>
      <div class="p-content">
        <div class="p-avatar-wrap">
          <div class="p-avatar">${p.avatar || '🐺'}</div>
          <div class="p-online-dot"></div>
        </div>
        <div class="p-username"><span class="p-at">@</span>${escHtml(p.username)}</div>
        <div class="p-badges">${badges}</div>
        <div class="p-bio">${escHtml(bioLine)}</div>
        <div class="p-stats">
          <div class="p-stat"><span class="p-stat-val">${p.views}</span><span class="p-stat-key">Views</span></div>
          <div class="p-stat"><span class="p-stat-val">#${formatUID(p.uid)}</span><span class="p-stat-key">UID</span></div>
          <div class="p-stat"><span class="p-stat-val">${p.joined}</span><span class="p-stat-key">Joined</span></div>
        </div>
      </div>
    </div>
    ${socialsHtml}
    ${dcHtml}
    ${songHtml}
    <div class="p-links">${linksHtml}</div>
    <div class="p-view-row">👁 <span>${p.views}</span> profile views</div>
    <div class="p-foot">Powered by <span style="color:rgba(255,255,255,.4);font-weight:700">biolink</span></div>
  `;
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── LINKS MANAGER ───────────────────────
function loadLinksForm(p) {
  const list = document.getElementById('links-list');
  if (!list) return;
  list.innerHTML = '';
  (p.links || []).forEach((link, i) => list.appendChild(buildLinkRow(link, i)));
}

function buildLinkRow(link) {
  const row = document.createElement('div');
  row.className = 'link-row';
  row.innerHTML = `
    <div class="link-row-inputs">
      <span class="link-row-emoji" onclick="cycleEmoji(this)">${link.emoji || '🔗'}</span>
      <input class="input" placeholder="Название ссылки" value="${escHtml(link.title || '')}" style="padding:9px 12px;font-size:13px">
      <input class="input" placeholder="https://..." value="${escHtml(link.url || '')}" style="padding:9px 12px;font-size:13px">
    </div>
    <input class="input" placeholder="Подпись (необязательно)" value="${escHtml(link.subtitle || '')}" style="padding:9px 12px;font-size:13px;max-width:200px">
    <span class="link-row-del" onclick="this.closest('.link-row').remove()">✕</span>
  `;
  return row;
}

const EMOJIS = ['🔗','🌐','📦','☕','🎮','🎵','📸','🛒','💼','✉️','🚀','⭐','🎨','📚','💡','🏆'];
let emojiIdxMap = {};
function cycleEmoji(el) {
  const rows = document.querySelectorAll('#links-list .link-row');
  const id = Array.from(rows).indexOf(el.closest('.link-row'));
  emojiIdxMap[id] = ((emojiIdxMap[id] || 0) + 1) % EMOJIS.length;
  el.textContent = EMOJIS[emojiIdxMap[id]];
}

function addLink() {
  const p = getProfile();
  const links = [...(p.links || []), { emoji:'🔗', title:'Новая ссылка', url:'https://', subtitle:'' }];
  setProfile({ links });
  loadLinksForm(getProfile());
}

function saveLinks() {
  const rows = document.querySelectorAll('#links-list .link-row');
  const links = [];
  rows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    const emoji = row.querySelector('.link-row-emoji').textContent;
    links.push({
      emoji,
      title: inputs[0]?.value.trim() || '',
      url: inputs[1]?.value.trim() || '#',
      subtitle: inputs[2]?.value.trim() || '',
    });
  });
  setProfile({ links });
  updateCompletion(getProfile());
  renderLivePreview();
  showToast('Ссылки сохранены!', 'success');
}

// ─── SOCIALS ─────────────────────────────
const SOCIAL_DEFS = [
  { key:'snapchat',   color:'#FFFC00', label:'Snapchat',    ph:'https://snapchat.com/add/username',      svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.563 14.424c-.13.064-.271.097-.413.097-.418 0-.824-.207-1.064-.565-.285-.418-.59-.794-.913-1.123-.162-.163-.33-.246-.498-.246-.115 0-.23.032-.35.1-.48.264-.951.397-1.4.397-.449 0-.92-.133-1.4-.397-.12-.068-.235-.1-.35-.1-.168 0-.336.083-.498.246-.323.329-.628.705-.913 1.123-.24.358-.646.565-1.064.565-.142 0-.283-.033-.413-.097-.58-.286-.737-.904-.51-1.427.12-.28.306-.548.562-.797.403-.386.807-.67 1.205-.845.28-.122.54-.348.733-.657.193-.31.289-.63.289-.953v-.195c0-.22-.046-.43-.138-.624-.091-.193-.229-.361-.41-.498-.37-.277-.614-.694-.614-1.163 0-.791.64-1.432 1.432-1.432.791 0 1.432.641 1.432 1.432 0 .228-.053.442-.147.635-.23-.18-.512-.296-.821-.296-.779 0-1.41.631-1.41 1.41 0 .392.161.747.42 1.005.297.295.646.456 1.047.465h.001c.401-.009.75-.17 1.047-.465.259-.258.42-.613.42-1.005 0-.779-.631-1.41-1.41-1.41-.309 0-.591.116-.821.296-.094-.193-.147-.407-.147-.635 0-.791.641-1.432 1.432-1.432.791 0 1.432.641 1.432 1.432 0 .469-.244.886-.614 1.163-.181.137-.319.305-.41.498-.092.194-.138.404-.138.624v.195c0 .323.096.643.289.953.193.309.453.535.733.657.398.175.802.459 1.205.845.256.249.442.517.562.797.227.523.07 1.141-.51 1.427z"/></svg>' },
  { key:'youtube',    color:'#FF0000', label:'YouTube',     ph:'https://youtube.com/@channel',           svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>' },
  { key:'discord',    color:'#5865F2', label:'Discord',     ph:'https://discord.gg/invite',              svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.081.114 18.104.133 18.12a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>' },
  { key:'spotify',    color:'#1DB954', label:'Spotify',     ph:'https://open.spotify.com/user/...',      svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>' },
  { key:'instagram',  color:'#E1306C', label:'Instagram',   ph:'https://instagram.com/username',         svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>' },
  { key:'twitter',    color:'#1DA1F2', label:'Twitter / X', ph:'https://twitter.com/username',           svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' },
  { key:'tiktok',     color:'#010101', label:'TikTok',      ph:'https://tiktok.com/@username',           svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.43a8.18 8.18 0 0 0 4.78 1.52V6.51a4.85 4.85 0 0 1-1.01-.18z"/></svg>' },
  { key:'telegram',   color:'#26A5E4', label:'Telegram',    ph:'https://t.me/username',                  svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>' },
  { key:'soundcloud', color:'#FF5500', label:'SoundCloud',  ph:'https://soundcloud.com/username',        svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1.175 12.225c-.057 0-.114.007-.171.007C.44 12.232 0 12.772 0 13.42c0 .648.44 1.188 1.004 1.188h21.992C23.56 14.608 24 14.068 24 13.42V8.302c0-.648-.44-1.188-1.004-1.188-.564 0-1.004.54-1.004 1.188v2.647c-.517-1.944-2.21-3.375-4.22-3.375-1.3 0-2.47.556-3.3 1.448-.803-2.168-2.89-3.713-5.328-3.713-3.148 0-5.7 2.538-5.7 5.67 0 .51.07 1.003.196 1.474-.172-.03-.35-.048-.532-.048-.86 0-1.594.448-2.008 1.12-.114.184-.194.39-.194.609.002.31.122.588.315.797zm6.67-1.847c.25-.668.673-1.243 1.21-1.663-.198.695-.308 1.428-.308 2.187 0 .367.036.726.094 1.077-.452-.267-.828-.66-1.01-1.155l.014-.446zm9.775 0c-.197-.514-.562-.945-1.022-1.225.06.368.094.747.094 1.132 0 .77-.117 1.513-.33 2.21.48-.405.85-.952 1.03-1.578l.228-.539z"/></svg>' },
  { key:'paypal',     color:'#003087', label:'PayPal',      ph:'https://paypal.me/username',             svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-8.558 6.082H9.823l-1.43 9.067h3.94c.458 0 .85-.333.92-.786l.381-2.41.038-.246.566-3.595.037-.246.38-2.41c.07-.453.463-.786.922-.786h.58c3.765 0 6.707-1.531 7.565-5.95.371-1.927.05-3.285-.8-4.433z"/></svg>' },
  { key:'github',     color:'#181717', label:'GitHub',      ph:'https://github.com/username',            svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>' },
  { key:'roblox',     color:'#FF0000', label:'Roblox',      ph:'https://roblox.com/users/...',           svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.338 0L0 19.654 19.654 24 24 4.346zm11.126 13.768l-5.36-1.393 1.393-5.36 5.36 1.393z"/></svg>' },
  { key:'cashapp',    color:'#00D632', label:'Cash App',    ph:'https://cash.app/$username',             svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.59 3.48A11.99 11.99 0 0 0 20.52.41C18.69-.35 16.08 0 12 0S5.31-.35 3.48.41A11.99 11.99 0 0 0 .41 3.48C-.35 5.31 0 7.92 0 12s-.35 6.69.41 8.52a11.99 11.99 0 0 0 3.07 3.07C5.31 24.35 7.92 24 12 24s6.69.35 8.52-.41a11.99 11.99 0 0 0 3.07-3.07C24.35 18.69 24 16.08 24 12s.35-5.31-.41-8.52zM13.35 18.11a.87.87 0 0 1-.87.87H11.5a.87.87 0 0 1-.87-.87v-.79a4.62 4.62 0 0 1-2.73-1.2.87.87 0 0 1 .02-1.28l.79-.76a.87.87 0 0 1 1.18.02 2.55 2.55 0 0 0 1.74.63c.74 0 1.37-.34 1.37-.97 0-.54-.33-.87-1.67-1.25-1.84-.52-3.27-1.34-3.27-3.18 0-1.51 1.05-2.65 2.57-3.07v-.79a.87.87 0 0 1 .87-.87h.98a.87.87 0 0 1 .87.87v.78a4.14 4.14 0 0 1 2.13.97.87.87 0 0 1 .03 1.27l-.74.76a.87.87 0 0 1-1.19 0 2.3 2.3 0 0 0-1.54-.52c-.81 0-1.18.42-1.18.87 0 .49.38.79 1.78 1.2 2.08.6 3.16 1.5 3.16 3.26 0 1.57-1.06 2.77-2.76 3.18v.77z"/></svg>' },
  { key:'applemusic', color:'#FC3C44', label:'Apple Music', ph:'https://music.apple.com/...',            svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.994 6.124a9.23 9.23 0 0 0-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 0 0-1.877-.726 10.496 10.496 0 0 0-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208a8.49 8.49 0 0 0-.39 1.548c-.05.318-.07.64-.084.963V18.28c.01.15.017.3.026.45.07.745.163 1.485.468 2.175.619 1.4 1.646 2.376 3.083 2.91.625.23 1.278.32 1.934.37.23.016.464.024.7.03h12.41c.296-.01.59-.022.885-.05 1.29-.13 2.43-.55 3.3-1.524.615-.7 1.003-1.514 1.184-2.432.133-.67.147-1.347.155-2.024V8.51c0-.12-.003-.24-.008-.36-.05-.68-.117-1.35-.257-2.026zM9.614 4.553V16.92c0 .12-.01.22-.037.322a1.21 1.21 0 0 1-1.48.89 3.64 3.64 0 0 1-1.04-.454 2.837 2.837 0 0 1-.848-.846 1.655 1.655 0 0 1-.24-.93c.01-.56.25-1.01.687-1.35.288-.223.61-.37.95-.475.3-.093.61-.157.916-.232.2-.05.397-.11.57-.24.218-.163.29-.39.29-.647V6.75c0-.317.1-.43.412-.485.435-.07.87-.133 1.304-.203.267-.04.533-.086.8-.13V4.553zm8.18 7.69c0 .567-.25 1.01-.68 1.352a3.523 3.523 0 0 1-1.065.487 5.93 5.93 0 0 1-.756.15c-.178.023-.356.05-.53.07a2.024 2.024 0 0 0-.614.217c-.3.167-.43.43-.423.77.013.56.327.91.828 1.107.297.113.608.166.917.21.316.045.633.085.95.126v.016c-.018.022-.004.045.007.068.028.06.076.107.12.153l.07.072a2.91 2.91 0 0 1-2.43 0 2.785 2.785 0 0 1-.85-.844 1.657 1.657 0 0 1-.238-.93c.008-.567.25-1.013.687-1.353.288-.223.61-.37.948-.477.3-.09.61-.157.917-.232.2-.05.397-.11.57-.24.22-.163.29-.39.29-.647V8.9l3.282-.51v3.853z"/></svg>' },
  { key:'gitlab',     color:'#FC6D26', label:'GitLab',      ph:'https://gitlab.com/username',            svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.845.904C4.605.332 3.838-.02 3.09.001a1.892 1.892 0 0 0-1.567.985L.022 4.348A.99.99 0 0 0 .09 5.36l11.918 8.658-7.163-13.114zm14.311 0l-7.163 13.115 11.918-8.658a.99.99 0 0 0 .068-1.012L22.477.986A1.892 1.892 0 0 0 20.91.001c-.748-.021-1.515.33-1.755.903zM.022 4.348l-.001.003L3.35 14.09a1.892 1.892 0 0 0 1.792 1.302h17.716a1.892 1.892 0 0 0 1.792-1.302l3.328-9.739.002-.003-11.918 8.658H11.938L.022 4.348z"/></svg>' },
  { key:'twitch',     color:'#9146FF', label:'Twitch',      ph:'https://twitch.tv/username',             svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>' },
  { key:'reddit',     color:'#FF4500', label:'Reddit',      ph:'https://reddit.com/u/username',          svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>' },
  { key:'vk',         color:'#4680C2', label:'VKontakte',   ph:'https://vk.com/username',                svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.762-.491h1.744c.525 0 .643.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/></svg>' },
  { key:'notion',     color:'#000000', label:'Notion',      ph:'https://notion.so/...',                  svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/></svg>' },
  { key:'linkedin',   color:'#0A66C2', label:'LinkedIn',    ph:'https://linkedin.com/in/username',       svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>' },
  { key:'steam',      color:'#1b2838', label:'Steam',       ph:'https://steamcommunity.com/id/...',      svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.497 1.009 2.453-.4.957-1.497 1.41-2.454 1.013H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z"/></svg>' },
  { key:'kick',       color:'#53FC18', label:'Kick',        ph:'https://kick.com/username',              svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M0 0h7.086v7.103H3.534v3.553H7.09v3.556H3.534V24H0zm10.638 0h3.553v7.103h3.547V0H24v7.103h-3.547v3.553H24v3.556h-3.547V24h-3.547v-7.103h-3.553v-3.544h3.553v-3.556h-3.553z"/></svg>' },
  { key:'pinterest',  color:'#BD081C', label:'Pinterest',   ph:'https://pinterest.com/username',         svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>' },
  { key:'lastfm',     color:'#D51007', label:'Last.fm',     ph:'https://last.fm/user/username',          svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.584 17.21l-.88-2.392s-1.43 1.595-3.573 1.595c-1.897 0-3.244-1.648-3.244-4.288 0-3.381 1.703-4.59 3.38-4.59 2.41 0 3.178 1.566 3.837 3.573l.88 2.394c.876 2.668 2.532 4.81 7.29 4.81 3.408 0 5.721-1.043 5.721-3.793 0-2.226-1.265-3.38-3.62-3.931l-1.757-.385c-1.21-.274-1.566-.768-1.566-1.594 0-.934.742-1.484 1.951-1.484 1.32 0 2.034.494 2.144 1.676l2.75-.33C24.648 6.399 23.163 5.2 20.817 5.2c-2.558 0-4.508 1.264-4.508 3.82 0 1.814.878 2.969 3.107 3.518l1.867.44c1.375.328 1.924.877 1.924 1.814 0 1.072-.989 1.512-2.86 1.512-2.776 0-3.929-1.456-4.591-3.465l-.906-2.694C13.987 7.23 12.206 5.2 8.246 5.2 4.124 5.2 1.62 7.892 1.62 12.18c0 4.15 2.392 6.62 6.24 6.62 3.244 0 4.724-1.59 4.724-1.59z"/></svg>' },
  { key:'kofi',       color:'#FF5E5B', label:'Ko-fi',       ph:'https://ko-fi.com/username',             svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 2.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/></svg>' },
  { key:'buymeacoffee', color:'#FFDD00', label:'Buy Me Coffee', ph:'https://buymeacoffee.com/username', svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 01-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 01-4.743.295 37.059 37.059 0 01-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0011.343.376.483.483 0 01.535.53l-.071.697-1.018 9.907c-.041.41-.047.832-.125 1.237-.122.637-.553 1.028-1.182 1.171-.577.131-1.165.2-1.756.205-.656.004-1.31-.025-1.966-.022-.699.004-1.556-.06-2.095-.58-.475-.458-.54-1.174-.605-1.793l-.731-7.013-.322-3.094c-.037-.351-.286-.695-.678-.678-.336.015-.718.3-.678.679l.228 2.185.949 9.112c.147 1.344 1.174 2.068 2.446 2.272.742.12 1.503.144 2.257.156.966.016 1.942.053 2.892-.122 1.408-.258 2.465-1.198 2.616-2.657.34-3.332.683-6.663 1.024-9.995l.215-2.087a.484.484 0 01.39-.426c.402-.078.787-.212 1.074-.518.455-.488.546-1.124.385-1.766zm-1.478.772c-.145.137-.363.201-.578.233-2.416.359-4.866.54-7.308.46-1.748-.06-3.477-.254-5.207-.498-.17-.024-.353-.055-.47-.18-.22-.236-.111-.71-.054-.995.052-.26.152-.609.463-.646.484-.057 1.046.148 1.526.22.577.088 1.156.159 1.737.212 2.48.226 5.002.19 7.472-.14.45-.06.883-.13 1.324-.2.452-.072.97-.025 1.246.349.266.354.3.936-.151 1.185z"/></svg>' },
  { key:'facebook',   color:'#1877F2', label:'Facebook',    ph:'https://facebook.com/username',          svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' },
  { key:'threads',    color:'#000000', label:'Threads',     ph:'https://threads.net/@username',          svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.298-.883-2.333-.889H12c-.876.006-1.conflicting3.274-.788.69-.178-.284-.357-.677-.445-1.082l1.97-.557c.084.346.177.63.237.762.207.454.672.756 1.05.774h.003c1.55.013 2.723.497 3.487 1.438.737.905 1.098 2.207 1.074 3.87l.004.083c.011 1.069-.317 2.09-.944 2.902 1.021.726 1.799 1.724 2.22 2.867.685 1.838.607 4.583-1.595 6.739-1.897 1.85-4.174 2.715-7.286 2.738H12z"/></svg>' },
  { key:'patreon',    color:'#FF424D', label:'Patreon',     ph:'https://patreon.com/username',           svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22.957 7.21c-.004-3.064-2.391-5.576-5.45-5.94-3.95-.472-7.778-.462-11.693.024C3.683 1.63 1.05 4.018 1.05 7.208c0 2.368.26 6.75 3.021 9.36.86.808 1.973 1.26 3.062 1.24 1.55-.03 1.56-1.3 1.56-2.61V7.208c0-1.49.67-2.1 2.31-2.1h2.5c1.9 0 2.45.755 2.45 2.5v3.72c0 1.725.77 2.7 2.33 2.7 1.16 0 2.03-.42 2.83-1.25 1.83-1.91 2.844-5.148 2.844-5.57z"/></svg>' },
  { key:'signal',     color:'#3A76F0', label:'Signal',      ph:'https://signal.me/#p/...',               svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.518 4.967l.8 1.461a7.06 7.06 0 0 0-3.67 3.67l-1.461-.8a8.52 8.52 0 0 1 4.331-4.331zm-4.45 5.851l1.461.8a7.06 7.06 0 0 0 0 .764l-1.461.8a8.52 8.52 0 0 1 0-2.364zm.119 3.682l1.461-.8a7.06 7.06 0 0 0 3.67 3.67l-.8 1.461a8.52 8.52 0 0 1-4.331-4.331zm5.851 4.45l-.8-1.461a7.06 7.06 0 0 0 .764 0l-.8 1.461c.267.06.537.1.8.13zm1.518.083l.8-1.461a7.06 7.06 0 0 0 3.67-3.67l1.461.8a8.52 8.52 0 0 1-4.331 4.331zm4.45-5.851l-1.461-.8a7.06 7.06 0 0 0 0-.764l1.461-.8a8.52 8.52 0 0 1 0 2.364zm-.119-3.682l-1.461.8a7.06 7.06 0 0 0-3.67-3.67l.8-1.461a8.52 8.52 0 0 1 4.331 4.331zm-5.851-4.45l.8 1.461a7.06 7.06 0 0 0-.764 0l.8-1.461c-.267-.06-.537-.1-.8-.13z"/></svg>' },
  { key:'bitcoin',    color:'#F7931A', label:'Bitcoin',     ph:'https://...',                            svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.655-1.95l.003-.027zm-2.958 4.152c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z"/></svg>' },
  { key:'ethereum',   color:'#627EEA', label:'Ethereum',    ph:'https://...',                            svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/></svg>' },
  { key:'monero',     color:'#FF6600', label:'Monero',      ph:'https://...',                            svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2.182c5.42 0 9.818 4.398 9.818 9.818S17.42 21.818 12 21.818 2.182 17.42 2.182 12 6.58 2.182 12 2.182zM7.09 16.364v-5.455L12 15.818l4.91-4.909v5.455h2.181V7.636h-2.181l-4.91 4.91-4.91-4.91H4.91v8.728z"/></svg>' },
  { key:'email',      color:'#EA4335', label:'Email',       ph:'mailto:you@example.com',                 svg:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>' },
];

// ─── SOCIAL ICON GRID ────────────────────
let currentSocialKey = null;

function buildSocialIconGrid() {
  const grid = document.getElementById('social-icon-grid');
  if (!grid) return;
  const p = getProfile();
  const socials = p.socials || {};
  grid.innerHTML = SOCIAL_DEFS.map(s => {
    const hasValue = !!socials[s.key];
    return `
      <div class="soc-grid-item ${hasValue ? 'soc-active' : ''}" 
           onclick="openSocialModal('${s.key}')"
           title="${s.label}"
           style="--soc-color:${s.color}">
        <div class="soc-grid-icon">${s.svg}</div>
        ${hasValue ? '<div class="soc-active-dot"></div>' : ''}
      </div>
    `;
  }).join('');
}

function openSocialModal(key) {
  const def = SOCIAL_DEFS.find(s => s.key === key);
  if (!def) return;
  currentSocialKey = key;
  const p = getProfile();
  const socials = p.socials || {};

  document.getElementById('sum-network-icon').innerHTML = def.svg;
  document.getElementById('sum-network-icon').style.color = def.color;
  document.getElementById('sum-network-name').textContent = def.label;
  document.getElementById('sum-url-input').value = socials[key] || '';
  document.getElementById('sum-url-input').placeholder = def.ph;
  document.getElementById('social-url-modal').style.display = 'flex';
}

function openCustomSocial() {
  showToast('Пользовательский URL скоро!', 'info');
}

function closeSocialModal() {
  document.getElementById('social-url-modal').style.display = 'none';
  currentSocialKey = null;
}

function saveSocialURL() {
  if (!currentSocialKey) return;
  const url = document.getElementById('sum-url-input').value.trim();
  const p = getProfile();
  const socials = { ...(p.socials || {}), [currentSocialKey]: url };
  setProfile({ socials });
  updateCompletion(getProfile());
  renderLivePreview();
  buildSocialIconGrid();
  renderSocialsAdded();
  closeSocialModal();
  showToast('Соцсеть сохранена! 🔗', 'success');
}

function renderSocialsAdded() {
  const list = document.getElementById('socials-added-list');
  if (!list) return;
  const p = getProfile();
  const socials = p.socials || {};
  const added = SOCIAL_DEFS.filter(s => socials[s.key]);
  if (!added.length) { list.innerHTML = ''; return; }
  list.innerHTML = `
    <h3 style="font-size:14px;font-weight:600;color:var(--muted2);margin-bottom:12px;text-transform:uppercase;letter-spacing:.05em;">Добавленные соцсети</h3>
    <div style="display:flex;flex-direction:column;gap:8px;max-width:560px">
      ${added.map(s => `
        <div class="socials-added-row">
          <div class="sar-icon" style="color:${s.color}">${s.svg}</div>
          <div class="sar-info">
            <div class="sar-name">${s.label}</div>
            <div class="sar-url">${socials[s.key]}</div>
          </div>
          <button class="sar-edit" onclick="openSocialModal('${s.key}')">✏️</button>
          <button class="sar-del" onclick="deleteSocial('${s.key}')">✕</button>
        </div>
      `).join('')}
    </div>
  `;
}

function deleteSocial(key) {
  const p = getProfile();
  const socials = { ...(p.socials || {}) };
  delete socials[key];
  setProfile({ socials });
  updateCompletion(getProfile());
  renderLivePreview();
  buildSocialIconGrid();
  renderSocialsAdded();
  showToast('Соцсеть удалена', 'info');
}

function buildSocialsInputs() {
  // Legacy — no longer used, kept for compatibility
}

function loadSocialsForm(p) {
  buildSocialIconGrid();
  renderSocialsAdded();
}

function saveSocials() {
  // handled by saveSocialURL
}

// ─── BADGES ──────────────────────────────
const BADGE_DEFS = [
  { id:'verified', emoji:'✓', name:'Verified',  desc:'Аккаунт подтверждён', locked:false },
  { id:'premium',  emoji:'★', name:'Premium',   desc:'Премиум участник',    locked:false },
  { id:'og',       emoji:'👑',name:'OG',        desc:'Ранний пользователь', locked:false },
  { id:'staff',    emoji:'🛡',name:'Staff',     desc:'Сотрудник команды',   locked:true  },
  { id:'dev',      emoji:'⚡',name:'Developer', desc:'Разработчик',         locked:true  },
  { id:'artist',   emoji:'🎨',name:'Artist',    desc:'Творческий создатель',locked:false },
];

function buildBadgesSection() {
  const grid = document.getElementById('badges-grid');
  if (!grid) return;
  grid.innerHTML = BADGE_DEFS.map(b => `
    <div class="badge-card ${b.locked ? 'locked-badge' : ''}" 
         onclick="${b.locked ? "showToast('Этот значок требует особых условий','error')" : `toggleBadge('${b.id}',this)`}" 
         id="badge-card-${b.id}">
      <div class="badge-active-check">✓</div>
      <div class="badge-emoji">${b.emoji}</div>
      <div class="badge-name">${b.name}</div>
      <div class="badge-desc">${b.desc}</div>
      ${b.locked ? `<div class="badge-locked-label">🔒 Ограничено</div>` : ''}
    </div>
  `).join('');
}

function loadBadgesForm(p) {
  const active = p.badges || [];
  BADGE_DEFS.forEach(b => {
    const card = document.getElementById('badge-card-' + b.id);
    if (card) card.classList.toggle('active', active.includes(b.id));
  });
}

function toggleBadge(id, el) {
  el.classList.toggle('active');
  const p = getProfile();
  let badges = [...(p.badges || [])];
  if (el.classList.contains('active')) {
    if (!badges.includes(id)) badges.push(id);
  } else {
    badges = badges.filter(b => b !== id);
  }
  setProfile({ badges });
  renderLivePreview();
  showToast(el.classList.contains('active') ? 'Значок включён!' : 'Значок отключён', 'success');
}

// ─── CHARTS ──────────────────────────────
function buildCharts() {
  buildMiniChart();
  buildBigChart();
}

function buildMiniChart() {
  const chart = document.getElementById('mini-chart');
  const labels = document.getElementById('mini-labels');
  if (!chart || !labels) return;
  const days = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
  const vals = [3, 7, 5, 12, 8, 4, 9];
  const max = Math.max(...vals);
  chart.innerHTML = vals.map(v => `<div class="mbar" style="height:${(v/max)*100}%"></div>`).join('');
  labels.innerHTML = days.map(d => `<span>${d}</span>`).join('');
}

function buildBigChart() {
  const chart = document.getElementById('big-chart');
  const labels = document.getElementById('big-labels');
  if (!chart || !labels) return;
  const vals = Array.from({length:30},() => Math.floor(Math.random()*10)+1);
  const max = Math.max(...vals);
  chart.innerHTML = vals.map(v => `<div class="bbar" style="height:${(v/max)*100}%"></div>`).join('');
  labels.innerHTML = vals.map((_,i) => `<span>${i%5===0?i+1:''}</span>`).join('');
}

// ─── TEMPLATES ───────────────────────────
const TEMPLATES = [
  { name:'Dark Purple', author:'@cisek', uses:121553, stars:12103, trending:true, tags:['free','bio','dark'], bg:'linear-gradient(135deg,#1e1033,#0f172a)', accent:'#7c3aed' },
  { name:'Ocean Blue', author:'@ak213', uses:99056, stars:8482, trending:true, tags:['anime','yourname','4kedits'], bg:'linear-gradient(135deg,#0f2027,#203a43,#2c5364)', accent:'#38bdf8' },
  { name:'Svart', author:'@yuez', uses:92393, stars:9815, trending:true, tags:['#black','#idk'], bg:'linear-gradient(135deg,#111,#222)', accent:'#fff' },
  { name:'Crimson', author:'@reddev', uses:74200, stars:7100, trending:false, tags:['dark','red','premium'], bg:'linear-gradient(135deg,#200122,#6f0000)', accent:'#f43f5e' },
  { name:'Forest', author:'@treelover', uses:51000, stars:5300, trending:false, tags:['nature','green'], bg:'linear-gradient(135deg,#0a3d0a,#1a5c1a)', accent:'#4ade80' },
  { name:'Royal', author:'@king99', uses:44800, stars:4900, trending:true, tags:['purple','royal','premium'], bg:'linear-gradient(135deg,#1a0533,#3d0068)', accent:'#c084fc' },
  { name:'Gold Rush', author:'@riches', uses:38900, stars:4200, trending:false, tags:['gold','luxury'], bg:'linear-gradient(135deg,#3d2900,#7a5200)', accent:'#fbbf24' },
  { name:'Midnight', author:'@night_dev', uses:35400, stars:3800, trending:false, tags:['dark','minimal'], bg:'linear-gradient(135deg,#1a1a2e,#16213e)', accent:'#6366f1' },
  { name:'Cosmic', author:'@spacex', uses:29100, stars:3100, trending:true, tags:['space','stars'], bg:'linear-gradient(135deg,#0d0221,#1a0547)', accent:'#818cf8' },
];

let tmplFavorites = JSON.parse(localStorage.getItem('bl_tmpl_fav') || '[]');
let currentTmplTab = 'library';
let tmplSearch = '';

function switchTmplTab(tab, btn) {
  currentTmplTab = tab;
  document.querySelectorAll('.tmpl-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  buildTemplates();
}

function filterTemplates(query) {
  tmplSearch = query.toLowerCase();
  buildTemplates();
}

function buildTemplates() {
  const grid = document.getElementById('templates-grid');
  if (!grid) return;

  let list = TEMPLATES;
  if (currentTmplTab === 'favorites') list = TEMPLATES.filter(t => tmplFavorites.includes(t.name));
  else if (currentTmplTab === 'recent') list = TEMPLATES.slice(0, 3);
  else if (currentTmplTab === 'uploads') list = [];

  if (tmplSearch) list = list.filter(t => t.name.toLowerCase().includes(tmplSearch) || t.tags.some(tag => tag.includes(tmplSearch)));

  if (!list.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted)">Шаблоны не найдены</div>`;
    return;
  }

  grid.innerHTML = list.map(t => {
    const isFav = tmplFavorites.includes(t.name);
    return `
      <div class="template-card-new">
        <div class="tcn-preview" style="background:${t.bg}">
          <div class="tcn-preview-inner" style="--accent:${t.accent}">
            <div class="tcn-avatar" style="border-color:${t.accent}">🐺</div>
            <div class="tcn-uname" style="color:${t.accent}">@username</div>
            <div class="tcn-bio">bio here...</div>
            <div class="tcn-link-demo"></div>
            <div class="tcn-link-demo"></div>
            <div class="tcn-social-row">
              <div class="tcn-soc" style="border-color:${t.accent}20"></div>
              <div class="tcn-soc" style="border-color:${t.accent}20"></div>
              <div class="tcn-soc" style="border-color:${t.accent}20"></div>
              <div class="tcn-soc" style="border-color:${t.accent}20"></div>
            </div>
          </div>
          <button class="tcn-fav ${isFav ? 'active' : ''}" onclick="toggleTmplFav('${t.name}',event)">★</button>
        </div>
        <div class="tcn-body">
          <div class="tcn-meta">
            <div class="tcn-author-row">
              <div class="tcn-author-avatar"></div>
              <div>
                <div class="tcn-name">${t.name}</div>
                <div class="tcn-author">${t.author}</div>
              </div>
            </div>
          </div>
          <div class="tcn-stats">
            <span>🕐 ${(t.uses/1000).toFixed(0)}K</span>
            ${t.trending ? '<span style="color:var(--accent2)">↗ В тренде</span>' : ''}
            <span>⭐ ${t.stars.toLocaleString()}</span>
          </div>
          <div class="tcn-tags">${t.tags.map(tag => `<span class="tcn-tag">${tag}</span>`).join('')}</div>
          <div class="tcn-actions">
            <button class="btn btn-primary" style="flex:1" onclick="applyTemplate('${t.bg}')">Использовать шаблон</button>
            <button class="btn btn-ghost tcn-icon-btn" onclick="showToast('Ссылка скопирована!','success')">🔗</button>
            <button class="btn btn-ghost tcn-icon-btn" onclick="showToast('Предпросмотр скоро!','info')">👁</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function toggleTmplFav(name, e) {
  e.stopPropagation();
  const idx = tmplFavorites.indexOf(name);
  if (idx >= 0) tmplFavorites.splice(idx, 1);
  else tmplFavorites.push(name);
  localStorage.setItem('bl_tmpl_fav', JSON.stringify(tmplFavorites));
  buildTemplates();
}

function applyTemplate(banner) {
  setProfile({ bannerBg: banner });
  document.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('selected'));
  renderLivePreview();
  loadCustomizeForm(getProfile());
  showToast('Шаблон применён!', 'success');
}

// ─── SHOW PROFILE PAGE ───────────────────
function showProfile() {
  const p = getProfile();
  renderPublicProfile(p);
  showPage('profile');
  // Reset overlay
  const overlay = document.getElementById('click-overlay');
  if (overlay) overlay.classList.remove('hidden');
  // Reset fade-ins
  document.querySelectorAll('#page-profile .fi').forEach(el => el.classList.remove('vis'));
  audioPlaying = false;
  audioProgress = 35;
  clearInterval(audioInterval);
  if (typewriterTimer) clearTimeout(typewriterTimer);
}

let typewriterTimer = null;

function renderPublicProfile(p) {
  const banner = document.getElementById('p-banner-bg');
  if (banner) banner.style.background = p.bannerBg || 'linear-gradient(135deg,#1e1033,#0f172a)';

  const av = document.getElementById('p-avatar');
  if (av) av.textContent = p.avatar || '🐺';

  const un = document.getElementById('p-username-text');
  if (un) un.textContent = p.username || 'username';

  // Badges
  const badgesCont = document.getElementById('p-badges');
  if (badgesCont) {
    const defs = { premium:'★ Premium', verified:'✓ Verified', og:'OG', staff:'Staff', dev:'Dev', artist:'🎨 Artist' };
    badgesCont.innerHTML = (p.badges || []).map(b => `<span class="p-badge ${b}">${defs[b] || b}</span>`).join('');
  }

  // Stats
  const uidEl = document.getElementById('p-uid-stat');
  if (uidEl) uidEl.textContent = '#' + formatUID(p.uid);
  const joinedEl = document.getElementById('p-joined-stat');
  if (joinedEl) joinedEl.textContent = p.joined || 2025;

  // Views counter animate
  const viewEl = document.getElementById('p-views-counter');
  if (viewEl) {
    let c = 0;
    const target = p.views || 0;
    const t = setInterval(() => {
      c = Math.min(c + Math.ceil(target / 50) || 1, target);
      viewEl.textContent = c.toLocaleString();
      if (c >= target) clearInterval(t);
    }, 20);
  }
  const viewsText = document.getElementById('p-views-text');
  if (viewsText) viewsText.textContent = (p.views || 0).toLocaleString();

  // Socials
  const sRow = document.getElementById('p-socials-row');
  if (sRow) {
    const icons  = { twitter:'𝕏', youtube:'▶', instagram:'📷', discord:'💬', telegram:'✈', github:'🐙', tiktok:'🎵', steam:'🎮' };
    const lbels  = { twitter:'Twitter', youtube:'YouTube', instagram:'Instagram', discord:'Discord', telegram:'Telegram', github:'GitHub', tiktok:'TikTok', steam:'Steam' };
    const entries = Object.entries(p.socials || {}).filter(([,v]) => v);
    if (entries.length) {
      sRow.style.display = '';
      sRow.innerHTML = entries.map(([k,url]) => `
        <a class="p-sicon" href="${escHtml(url)}" target="_blank">
          ${icons[k] || '🔗'}<span class="tip">${lbels[k] || k}</span>
        </a>`).join('');
    } else {
      sRow.style.display = 'none';
    }
  }

  // Discord widget
  const dcW = document.getElementById('p-discord-widget');
  if (dcW) {
    if (p.dcServerName) {
      dcW.style.display = 'flex';
      document.getElementById('p-dc-name').textContent = p.dcServerName;
      document.getElementById('p-dc-members').textContent = p.dcMembers || '0';
      const j = document.getElementById('p-dc-join');
      if (j) j.href = p.dcUrl || '#';
    } else {
      dcW.style.display = 'none';
    }
  }

  // Audio widget
  const audioW = document.getElementById('p-audio-widget');
  if (audioW) {
    if (p.songTitle) {
      audioW.style.display = 'block';
      document.getElementById('p-audio-title').textContent = p.songTitle;
      document.getElementById('p-audio-artist').textContent = p.songArtist || '';
    } else {
      audioW.style.display = 'none';
    }
  }

  // Links
  const linksC = document.getElementById('p-links-container');
  if (linksC) {
    linksC.innerHTML = (p.links || []).map(l => `
      <a class="p-link-btn" href="${escHtml(l.url || '#')}" target="_blank">
        <div class="p-link-emoji">${l.emoji || '🔗'}</div>
        <div class="p-link-text">
          <span class="p-link-title">${escHtml(l.title || 'Link')}</span>
          <span class="p-link-sub">${escHtml(l.subtitle || '')}</span>
        </div>
        <span class="p-link-arrow">›</span>
      </a>`).join('');
  }
}

// ─── ENTER PROFILE ───────────────────────
function enterProfile() {
  const overlay = document.getElementById('click-overlay');
  if (overlay) overlay.classList.add('hidden');

  setTimeout(() => {
    document.querySelectorAll('#page-profile .fi').forEach((el, i) => {
      setTimeout(() => el.classList.add('vis'), i * 80);
    });
  }, 100);

  startTypewriter();

  if (currentUser) {
    const p = getProfile();
    setProfile({ views: (p.views || 0) + 1 });
    const ov = document.getElementById('ov-views');
    if (ov) ov.textContent = (p.views || 0) + 1;
  }
}

// ─── TYPEWRITER ──────────────────────────
let twLines = [], twLine = 0, twChar = 0, twDeleting = false;

function startTypewriter() {
  if (typewriterTimer) clearTimeout(typewriterTimer);
  const p = getProfile();
  twLines = Array.isArray(p.bio) ? p.bio.filter(Boolean) : ['Welcome to my profile!'];
  if (!twLines.length) twLines = ['Welcome to my profile!'];
  twLine = 0; twChar = 0; twDeleting = false;
  typeStep();
}

function typeStep() {
  const el = document.getElementById('p-bio-text');
  if (!el) return;
  const cur = twLines[twLine] || '';
  if (!twDeleting) {
    el.textContent = cur.slice(0, ++twChar);
    if (twChar >= cur.length) {
      twDeleting = true;
      typewriterTimer = setTimeout(typeStep, 2400);
      return;
    }
  } else {
    el.textContent = cur.slice(0, --twChar);
    if (twChar <= 0) {
      twDeleting = false;
      twLine = (twLine + 1) % twLines.length;
      typewriterTimer = setTimeout(typeStep, 500);
      return;
    }
  }
  typewriterTimer = setTimeout(typeStep, twDeleting ? 30 : 55);
}

// ─── AUDIO PLAYER ────────────────────────
function togglePlay() {
  const btn = document.getElementById('p-play-btn');
  const fill = document.getElementById('p-audio-fill');
  const time = document.getElementById('p-audio-time');
  if (!btn) return;
  audioPlaying = !audioPlaying;
  btn.textContent = audioPlaying ? '⏸' : '▶';
  if (audioPlaying) {
    audioInterval = setInterval(() => {
      audioProgress = Math.min(audioProgress + 0.12, 100);
      if (fill) fill.style.width = audioProgress + '%';
      const total = 227;
      const current = Math.floor((audioProgress / 100) * total);
      const m = Math.floor(current / 60);
      const s = current % 60;
      const tm = Math.floor(total / 60); const ts = total % 60;
      if (time) time.textContent = `${m}:${s.toString().padStart(2,'0')} / ${tm}:${ts.toString().padStart(2,'0')}`;
      if (audioProgress >= 100) {
        clearInterval(audioInterval); audioPlaying = false;
        if (btn) btn.textContent = '▶'; audioProgress = 0;
      }
    }, 100);
  } else {
    clearInterval(audioInterval);
  }
}

// ─── INTERSECTION OBSERVER ───────────────
const landObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.feat-card, .pricing-card, .pfl-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    landObs.observe(el);
  });
});

