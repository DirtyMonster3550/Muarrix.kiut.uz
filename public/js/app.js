// ===== i18n helper =====
function i18t(key, vars) {
 if (typeof window.KiutI18n === 'undefined') return key;
 return KiutI18n.t(KiutI18n.getLang(), key, vars);
}

function i18Locale() {
 const l = typeof KiutI18n!== 'undefined'? KiutI18n.getLang(): 'ru';
 return l === 'en'? 'en-GB': l === 'uz'? 'uz-UZ': 'ru-RU';
}

// ===== Auth helpers =====
const Auth = {
 getToken: () => localStorage.getItem('kiut_token'),
 getUser: () => {
 try { return JSON.parse(localStorage.getItem('kiut_user')); } catch { return null; }
 },
 setSession: (token, user) => {
 localStorage.setItem('kiut_token', token);
 localStorage.setItem('kiut_user', JSON.stringify(user));
 },
 clear: () => {
 localStorage.removeItem('kiut_token');
 localStorage.removeItem('kiut_user');
 },
 isLoggedIn: () =>!!localStorage.getItem('kiut_token'),
 isAdmin: () => {
 const u = Auth.getUser();
 return u && u.role === 'admin';
 },
};

// ===== API helpers =====
const API = {
 base: '/api',
 async request(method, url, body) {
 const headers = { 'Content-Type': 'application/json' };
 const token = Auth.getToken();
 if (token) headers['Authorization'] = `Bearer ${token}`;
 const res = await fetch(this.base + url, {
 method,
 headers,
 credentials: 'same-origin',
 body: body? JSON.stringify(body): undefined,
 });
 const data = await res.json();
 if (!res.ok) throw new Error(data.error || i18t('err_server'));
 return data;
 },
 get: (url) => API.request('GET', url),
 post: (url, body) => API.request('POST', url, body),
 put: (url, body) => API.request('PUT', url, body),
 delete: (url) => API.request('DELETE', url),
 async upload(url, formData) {
  const headers = {};
  const token = Auth.getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(this.base + url, {
    method: 'POST',
    headers,
    credentials: 'same-origin',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || i18t('err_server'));
  return data;
 },
};

// ===== Toast notifications =====
function showToast(message, type = 'info', duration = 4000) {
 let container = document.getElementById('toast-container');
 if (!container) {
 container = document.createElement('div');
 container.id = 'toast-container';
 container.className = 'toast-container';
 document.body.appendChild(container);
 }

 const icons = { success: '', error: '', info: '', warning: '' };
 const toast = document.createElement('div');
 toast.className = `toast ${type}`;
 // Use DOM construction — never innerHTML with untrusted data (XSS prevention)
 const iconSpan = document.createElement('span');
 iconSpan.textContent = icons[type] || '';
 const textSpan = document.createElement('span');
 textSpan.textContent = message;
 toast.appendChild(iconSpan);
 toast.appendChild(textSpan);
 container.appendChild(toast);

 setTimeout(() => {
 toast.style.opacity = '0';
 toast.style.transform = 'translateX(20px)';
 toast.style.transition = 'all 0.3s';
 setTimeout(() => toast.remove(), 300);
 }, duration);
}

// ===== Format date =====
function formatDate(dateStr) {
 if (!dateStr) return '—';
 const d = new Date(dateStr);
 return d.toLocaleDateString(i18Locale(), { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ===== Status label =====
function statusBadge(status) {
 const map = {
 pending: ['status_pending', 'status-pending'],
 tech_approved: ['status_tech_approved', 'status-pending'],
 editorial_approved: ['status_editorial_approved', 'status-approved'],
 published: ['status_published', 'status-approved'],
 approved: ['status_approved', 'status-approved'],
 rejected: ['status_rejected', 'status-rejected'],
 };
 const [key, cls] = map[status] || ['status_unknown', ''];
 const label = i18t(key);
 return `<span class="status-badge ${cls}">${label}</span>`;
}

// ===== Journal name =====
function journalName(key) {
 const map = {
 muarrix: i18t('brand_title_main'),
 finecs: 'FINECS',
 conference: 'KIUT Conferences',
 };
 return map[key] || key;
}

// ===== Update header auth block =====
function updateHeaderAuth() {
 const authBlock = document.getElementById('header-auth');
 if (!authBlock) return;

 const isLanding = document.body.classList.contains('home-page');
 const user = Auth.getUser();

 if (!user) {
 if (isLanding) {
 authBlock.innerHTML = `
 <a href="/login.html" class="landing-link-login">${i18t('nav_login_account')}</a>
 `;
 } else {
 authBlock.innerHTML = `
 <a href="/login.html" class="btn-ghost">${i18t('nav_login')}</a>
 <a href="/register.html" class="btn-accent">${i18t('nav_register')}</a>
 `;
 }
 return;
 }

 const initials = user.full_name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
 const dashLink = user.role === 'admin'? '/admin.html': '/dashboard.html';

 if (isLanding) {
 /* На лендинге — шапка остаётся чистой (только кнопки Войти/Регистрация).
 Если пользователь залогинен — показываем плавающий бейдж в правом верхнем углу. */
 authBlock.innerHTML = `
 <a href="/login.html" class="landing-link-login">${i18t('nav_login_account')}</a>
 `;

 /* Плавающий бейдж пользователя (правый верхний угол) */
 let badge = document.getElementById('__user-float-badge');
 if (!badge) {
 badge = document.createElement('div');
 badge.id = '__user-float-badge';
 badge.style.cssText = [
 'position:fixed', 'top:14px', 'right:18px', 'z-index:9999',
 'display:flex', 'align-items:center', 'gap:8px',
 'background:rgba(12,61,130,0.92)', 'backdrop-filter:blur(8px)',
 'border:1px solid rgba(255,255,255,0.18)', 'border-radius:50px',
 'padding:6px 14px 6px 8px', 'box-shadow:0 4px 18px rgba(0,0,0,0.22)',
 'font-family:inherit',
 ].join(';');
 document.body.appendChild(badge);
 }
 badge.innerHTML = `
 <a href="${dashLink}" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:#fff">
 <span style="width:30px;height:30px;border-radius:50%;background:linear-gradient(145deg,#ff8c1a,#ff6b00);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:#fff;flex-shrink:0">${initials}</span>
 <span style="font-size:13px;font-weight:600;white-space:nowrap">${user.full_name.split(' ')[0]}</span>
 </a>
 <button type="button" onclick="logout()" title="${i18t('nav_logout')}" style="background:none;border:none;color:rgba(255,255,255,0.6);cursor:pointer;font-size:16px;padding:2px 0 0;line-height:1"></button>
 `;
 } else {
 authBlock.innerHTML = `
 <div class="user-menu">
 <a href="${dashLink}" style="display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none;">
 <div class="user-avatar">${initials}</div>
 <span class="user-name">${user.full_name.split(' ')[0]}</span>
 </a>
 <button class="btn-ghost" onclick="logout()" style="margin-left:8px">${i18t('nav_logout')}</button>
 </div>
 `;
 }
}

async function logout() {
 try {
 await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
 } catch {}
 Auth.clear();
 const badge = document.getElementById('__user-float-badge');
 if (badge) badge.remove();
 showToast(i18t('toast_logout'), 'info', 2000);
 setTimeout(() => window.location.href = '/', 1000);
}

async function ensureServerSession() {
 const token = Auth.getToken();
 if (!token) return false;
 try {
 const res = await fetch('/api/auth/session-sync', {
 method: 'POST',
 headers: { Authorization: `Bearer ${token}` },
 credentials: 'same-origin',
 });
 if (!res.ok) {
 Auth.clear();
 return false;
 }
 const data = await res.json().catch(() => ({}));
 if (data.token && data.user) Auth.setSession(data.token, data.user);
 return true;
 } catch {
 return false;
 }
}

async function syncSessionCookie() {
 await ensureServerSession();
}

async function refreshUserFromServer() {
 const token = Auth.getToken();
 if (!token) return null;
 try {
 const res = await fetch('/api/auth/me', {
 headers: { Authorization: `Bearer ${token}` },
 credentials: 'same-origin',
 });
 if (!res.ok) return null;
 const user = await res.json();
 Auth.setSession(token, user);
 return user;
 } catch {
 return null;
 }
}

/** На login/register: сначала cookie, потом редирект (иначе цикл login ↔ dashboard) */
async function redirectIfLoggedIn() {
 if (!Auth.isLoggedIn()) return;
 const ok = await ensureServerSession();
 if (!ok) return;

 const user = (await refreshUserFromServer()) || Auth.getUser();
 if (!user) return;

 const next = new URLSearchParams(location.search).get('next');
 const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : null;
 if (safeNext) {
 window.location.replace(safeNext);
 return;
 }

 const role = user.role;
 if (role === 'admin') window.location.replace('/admin.html');
 else if (role === 'tech_expert' || role === 'editorial_expert') window.location.replace('/expert.html');
 else window.location.replace('/dashboard.html');
}

// ===== Modal =====
function openModal(id) {
 document.getElementById(id)?.classList.add('open');
}

function closeModal(id) {
 document.getElementById(id)?.classList.remove('open');
}

// Close on overlay click
document.addEventListener('click', (e) => {
 if (e.target.classList.contains('modal-overlay')) {
 e.target.classList.remove('open');
 }
});

// ===== File upload UI =====
function initFileUpload(dropZoneId, inputId, labelId) {
 const zone = document.getElementById(dropZoneId);
 const input = document.getElementById(inputId);
 const label = document.getElementById(labelId);
 if (!zone ||!input) return;

 zone.addEventListener('click', () => input.click());

 input.addEventListener('change', () => {
 if (input.files[0] && label) {
 label.textContent = input.files[0].name;
 }
 });

 zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
 zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
 zone.addEventListener('drop', (e) => {
 e.preventDefault();
 zone.classList.remove('dragover');
 if (e.dataTransfer.files[0]) {
 input.files = e.dataTransfer.files;
 if (label) label.textContent = e.dataTransfer.files[0].name;
 }
 });
}

// ===== Dynamic announce bar =====
async function loadAnnounceBar() {
 const bar = document.getElementById('announce-bar');
 if (!bar) return;
 try {
 const d = await fetch('/api/announce').then(r => r.json());
 if (d.announce_enabled === '0') { bar.style.display = 'none'; return; }
 const text = bar.querySelector('.announce-text');
 const cta = bar.querySelector('.announce-link');
 if (text && d.announce_text) text.textContent = d.announce_text;
 if (cta && d.announce_cta) cta.textContent = d.announce_cta;
 } catch {}
}

// Init on load
document.addEventListener('DOMContentLoaded', () => {
 syncSessionCookie();
 updateHeaderAuth();
 loadAnnounceBar();
});

document.addEventListener('kiut:langchange', () => {
 updateHeaderAuth();
});
