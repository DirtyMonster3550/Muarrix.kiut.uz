 let TOKEN = Auth.getToken();
 let currentUser = null;
 let editorialExperts = [];

 function applyExpertRoleLabels() {
 if (!currentUser) return;
 const badge = document.getElementById('sb-role-badge');
 const titleEl = document.getElementById('queue-title');
 if (currentUser.role === 'tech_expert') {
 badge.textContent = i18t('expert_role_tech');
 badge.className = 'role-badge role-tech';
 if (titleEl) titleEl.textContent = i18t('expert_queue_tech');
 } else {
 badge.textContent = i18t('expert_role_editorial');
 badge.className = 'role-badge role-editorial';
 if (titleEl) titleEl.textContent = i18t('expert_queue_editorial');
 }
 }

 async function init() {
 await ensureServerSession();
 TOKEN = Auth.getToken();
 if (!TOKEN) {
 const user = await refreshUserFromServer();
 if (user) TOKEN = Auth.getToken();
 }
 if (!TOKEN) { location.href = '/login.html'; return; }
 try {
 const me = await API.get('/auth/me');
 if (!['tech_expert', 'editorial_expert'].includes(me.role)) {
 if (me.role === 'admin') { location.href = '/admin.html'; return; }
 location.href = '/dashboard.html';
 return;
 }
 currentUser = me;
 document.getElementById('sb-name').textContent = me.full_name;
 document.getElementById('sb-email').textContent = me.email;
 applyExpertRoleLabels();
 if (me.role === 'tech_expert') {
  document.getElementById('nav-sent-wrap').style.display = '';
  try { editorialExperts = await API.get('/review/editorial-experts'); } catch { editorialExperts = []; }
 } else {
  document.getElementById('nav-sent-wrap').style.display = 'none';
 }
 loadStats();
 loadQueue();
 loadNotifications();
 if (me.role === 'tech_expert') loadSentToEditorial();
 } catch { location.href = '/login.html'; }
 }

 // ── Tab switcher ──────────────────────────────────────────────────────────
 function switchTab(name, el) {
 document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
 document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
 document.getElementById('tab-' + name).classList.add('active');
 if (el) el.classList.add('active');
 if (name === 'notifications') loadNotifications();
 if (name === 'profile') loadProfileTab();
 if (name === 'sent') loadSentToEditorial();
 return false;
 }

 function loadProfileTab() {
 if (!currentUser) return;
 document.getElementById('profile-full-name').value = currentUser.full_name || '';
 document.getElementById('profile-email').value = currentUser.email || '';
 document.getElementById('profile-name-alert').innerHTML = '';
 document.getElementById('profile-pwd-alert').innerHTML = '';
 }

 async function saveProfileName() {
 const alertBox = document.getElementById('profile-name-alert');
 const full_name = document.getElementById('profile-full-name')?.value?.trim() || '';
 alertBox.innerHTML = '';
 if (full_name.length < 2) {
  alertBox.innerHTML = `<div class="profile-alert err">${escHtml(i18t('expert_profile_name'))}</div>`;
  return;
 }
 try {
  const data = await API.put('/auth/profile', { full_name });
  currentUser = data.user;
  Auth.setSession(Auth.getToken(), data.user);
  document.getElementById('sb-name').textContent = data.user.full_name;
  alertBox.innerHTML = `<div class="profile-alert ok">${escHtml(i18t('expert_profile_saved'))}</div>`;
  showToast(i18t('expert_profile_saved'), 'success');
 } catch (e) {
  alertBox.innerHTML = `<div class="profile-alert err">${escHtml(e.message)}</div>`;
 }
 }

 async function changeProfilePassword() {
 const alertBox = document.getElementById('profile-pwd-alert');
 const current_password = document.getElementById('profile-cur-pwd')?.value || '';
 const new_password = document.getElementById('profile-new-pwd')?.value || '';
 const new_password2 = document.getElementById('profile-new-pwd2')?.value || '';
 alertBox.innerHTML = '';
 if (new_password !== new_password2) {
  alertBox.innerHTML = `<div class="profile-alert err">${escHtml(i18t('expert_profile_pwd_mismatch'))}</div>`;
  return;
 }
 try {
  await API.put('/auth/change-password', { current_password, new_password });
  document.getElementById('profile-cur-pwd').value = '';
  document.getElementById('profile-new-pwd').value = '';
  document.getElementById('profile-new-pwd2').value = '';
  alertBox.innerHTML = `<div class="profile-alert ok">${escHtml(i18t('expert_profile_pwd_ok'))}</div>`;
  showToast(i18t('expert_profile_pwd_ok'), 'success');
 } catch (e) {
  alertBox.innerHTML = `<div class="profile-alert err">${escHtml(e.message)}</div>`;
 }
 }

 // logout() — from app.js

 // ── Stats ─────────────────────────────────────────────────────────────────
 async function loadStats() {
 try {
 const d = await API.get('/review/stats');
 document.getElementById('st-queue').textContent = d.inQueue;
 document.getElementById('st-approved').textContent = d.approved;
 document.getElementById('st-rejected').textContent = d.rejected;
 document.getElementById('st-total').textContent = d.total;
 const qb = document.getElementById('queue-badge');
 if (d.inQueue > 0) { qb.textContent = d.inQueue; qb.style.display = ''; }
 else qb.style.display = 'none';
 const sb = document.getElementById('sent-badge');
 if (sb && d.sentToEditorial > 0) { sb.textContent = d.sentToEditorial; sb.style.display = ''; }
 else if (sb) sb.style.display = 'none';
 } catch {}
 }

 // ── Sent to editorial (tech expert) ───────────────────────────────────────
 async function loadSentToEditorial() {
 if (currentUser?.role !== 'tech_expert') return;
 const body = document.getElementById('sent-body');
 if (!body) return;
 body.innerHTML = '<div class="empty-box"><div class="icon">⏳</div><p>' + i18t('expert_loading') + '</p></div>';
 try {
  const items = await API.get('/review/sent-to-editorial');
  const sb = document.getElementById('sent-badge');
  if (sb) {
   if (items.length) { sb.textContent = items.length; sb.style.display = ''; }
   else sb.style.display = 'none';
  }
  if (!items.length) {
   body.innerHTML = '<div class="empty-box"><div class="icon"></div><h3>' + i18t('expert_sent_empty_title') + '</h3><p>' + i18t('expert_sent_empty_p') + '</p></div>';
   return;
  }
  body.innerHTML = items.map((a) => sentArticleCard(a)).join('');
  document.querySelectorAll('[data-i18n-placeholder-id="expert_recall_ph"]').forEach((el) => {
   el.placeholder = i18t('expert_recall_ph');
  });
 } catch (e) {
  body.innerHTML = `<div class="empty-box"><div class="icon"></div><p>${escHtml(e.message)}</p></div>`;
 }
 }

 function sentArticleCard(a) {
  const fileBtn = a.file_path
   ? `<a class="btn btn-file btn-sm" href="/uploads/${escHtml(a.file_path)}?token=${Auth.getToken()}" target="_blank" download>${i18t('expert_download')} (Word)</a>`
   : `<span class="ac-no-file">${i18t('expert_no_file')}</span>`;
  const journalLabel = typeof journalName === 'function' ? journalName(a.journal) : a.journal;
  const sentWhen = a.reviewed_at || a.submitted_at;
  return `
 <div class="article-card" id="sent-card-${a.id}">
 <div class="ac-title">${escHtml(a.title)} ${typeof statusBadge === 'function' ? statusBadge(a.status) : ''}</div>
 <div class="ac-meta">
  <span>${escHtml(a.full_name)}</span>
  <span>${escHtml(a.email)}</span>
  <span>${escHtml(journalLabel)}</span>
  ${a.issue_title ? `<span>${escHtml(a.issue_title)}</span>` : ''}
  ${a.assigned_editorial_name ? `<span>${i18t('expert_assigned_to')}: ${escHtml(a.assigned_editorial_name)}</span>` : ''}
  <span>${i18t('expert_sent_at')}: ${formatDate(sentWhen)}</span>
 </div>
 <div class="ac-authors"><strong>${i18t('expert_authors_label')}</strong> ${escHtml(a.authors)}</div>
 <div class="ac-actions">
  ${fileBtn}
  <textarea id="recall-note-${a.id}" data-i18n-placeholder-id="expert_recall_ph" placeholder="${escHtml(i18t('expert_recall_ph'))}"></textarea>
  <div class="ac-btns">
   <button type="button" class="btn btn-recall" onclick="recallTech(${a.id})">${i18t('expert_recall_btn')}</button>
  </div>
 </div>
 </div>`;
 }

 async function recallTech(id) {
  if (!confirm(i18t('expert_recall_confirm'))) return;
  const reason = document.getElementById('recall-note-' + id)?.value?.trim() || '';
  try {
   await API.post(`/review/submissions/${id}/recall-tech`, { reason });
   showToast(i18t('expert_recall_ok'), 'success');
   document.getElementById('sent-card-' + id)?.remove();
   loadStats();
   loadQueue();
   const body = document.getElementById('sent-body');
   if (body && !body.querySelector('.article-card')) {
    body.innerHTML = '<div class="empty-box"><div class="icon"></div><h3>' + i18t('expert_sent_empty_title') + '</h3><p>' + i18t('expert_sent_empty_p') + '</p></div>';
   }
   const sb = document.getElementById('sent-badge');
   const remaining = document.querySelectorAll('#sent-body .article-card').length;
   if (sb) {
    if (remaining > 0) { sb.textContent = remaining; sb.style.display = ''; }
    else sb.style.display = 'none';
   }
  } catch (e) { showToast(e.message, 'error'); }
 }

 // ── Queue ─────────────────────────────────────────────────────────────────
 async function loadQueue() {
 const body = document.getElementById('queue-body');
 body.innerHTML = '<div class="empty-box"><div class="icon">⏳</div><p>' + i18t('expert_loading') + '</p></div>';
 try {
 const items = await API.get('/review/queue');
 if (!items.length) {
 body.innerHTML = '<div class="empty-box"><div class="icon"></div><h3>' + i18t('expert_queue_empty_title') + '</h3><p>' + i18t('expert_queue_empty_p') + '</p></div>';
 return;
 }
 body.innerHTML = items.map(a => articleCard(a)).join('');
 document.querySelectorAll('[data-i18n-placeholder-id]').forEach(el => {
 el.placeholder = i18t(el.getAttribute('data-i18n-placeholder-id'));
 });
 } catch(e) {
 body.innerHTML = `<div class="empty-box"><div class="icon"></div><p>${escHtml(e.message)}</p></div>`;
 }
 }

 function editorialAssignSelect(a) {
 if (currentUser?.role !== 'tech_expert' || a.status !== 'pending') return '';
 const id = a.id;
 if (!editorialExperts.length) {
 return `<div class="ac-assign"><label>${i18t('expert_assign_label')}</label><span class="ac-no-file" style="color:var(--danger)">${i18t('expert_assign_none')}</span></div>`;
 }
 const opts = editorialExperts.map(e =>
 `<option value="${e.id}">${escHtml(e.full_name)} (${escHtml(e.email)})</option>`
 ).join('');
 return `
 <div class="ac-assign">
 <label for="assign-${id}">${i18t('expert_assign_label')}</label>
 <select id="assign-${id}" required>
 <option value="">${i18t('expert_assign_ph')}</option>
 ${opts}
 </select>
 </div>`;
 }

 function canActOnArticle(a) {
 if (a.status === 'editorial_approved') return false;
 if (currentUser?.role === 'tech_expert' && a.status === 'pending') return true;
 if (currentUser?.role === 'editorial_expert' && a.status === 'tech_approved') {
 return a.can_review === true || a.can_review === 1 || a.assigned_editorial_id === currentUser.id;
 }
 return a.can_review === true || a.can_review === 1;
 }

 function articleCard(a) {
 const canAct = canActOnArticle(a);
 const fileBtn = a.file_path
? `<a class="btn btn-file" href="/uploads/${escHtml(a.file_path)}?token=${Auth.getToken()}" target="_blank" download>${i18t('expert_download')}</a>`
: `<span class="ac-no-file">${i18t('expert_no_file')}</span>`;
 const abstract = a.abstract
? `<div class="ac-abstract" onclick="this.classList.toggle('expanded')" title="${escHtml(i18t('expert_abstract_expand'))}">${escHtml(a.abstract)}</div>`
: '';
 const journalLabel = typeof journalName === 'function'? journalName(a.journal): a.journal;
 const statusHtml = typeof statusBadge === 'function' ? statusBadge(a.status) : escHtml(a.status);
 let watchNote = '';
 if (!canAct) {
 if (a.status === 'tech_approved' && a.assigned_editorial_name) {
 watchNote = `${i18t('expert_assigned_to')}: ${escHtml(a.assigned_editorial_name)}`;
 } else if (a.status === 'tech_approved' && currentUser?.role === 'tech_expert') {
 watchNote = i18t('expert_sent_editorial');
 } else if (a.status === 'editorial_approved') {
 watchNote = i18t('expert_wait_admin');
 }
 }
 const actionsBlock = canAct
? `${editorialAssignSelect(a)}
 <textarea id="note-${a.id}" data-i18n-placeholder-id="expert_note_ph" placeholder="${escHtml(i18t('expert_note_ph'))}"></textarea>
 <div class="ac-btns">
 <button class="btn btn-approve" onclick="approve(${a.id})">${i18t('expert_btn_approve')}</button>
 <button class="btn btn-reject" onclick="reject(${a.id})">${i18t('expert_btn_reject')}</button>
 </div>`
: `<div class="ac-watch-note">${watchNote || i18t('expert_watch_only')}</div>`;
 return `
 <div class="article-card" id="card-${a.id}">
 <div class="ac-title">${escHtml(a.title)} ${statusHtml}</div>
 <div class="ac-meta">
 <span> ${escHtml(a.full_name)}</span>
 <span> ${escHtml(a.email)}</span>
 <span> ${escHtml(journalLabel)}</span>
 ${a.issue_title? `<span> ${escHtml(a.issue_title)}</span>`: ''}
 ${a.tech_reviewer_name? `<span> ${i18t('expert_tech_ok')}: ${escHtml(a.tech_reviewer_name)}</span>`: ''}
 <span> ${formatDate(a.submitted_at)}</span>
 </div>
 ${abstract}
 <div class="ac-authors">
 <strong>${i18t('expert_authors_label')}</strong> ${escHtml(a.authors)}
 </div>
 <div class="ac-actions">
 ${fileBtn}
 ${actionsBlock}
 </div>
 </div>`;
 }

 async function approve(id) {
 const note = document.getElementById('note-' + id)?.value || '';
 const payload = { note };
 if (currentUser?.role === 'tech_expert') {
 const sel = document.getElementById('assign-' + id);
 if (!sel?.value) { showToast(i18t('expert_assign_required'), 'error'); return; }
 payload.editorial_expert_id = parseInt(sel.value, 10);
 }
 try {
 await API.post(`/review/submissions/${id}/approve`, payload);
 showToast(i18t('expert_approve_ok'), 'success');
 document.getElementById('card-' + id)?.remove();
 loadStats();
 if (currentUser?.role === 'tech_expert') loadSentToEditorial();
 } catch(e) { showToast(e.message, 'error'); }
 }

 async function reject(id) {
 const reason = document.getElementById('note-' + id)?.value || '';
 if (!reason.trim()) { showToast(i18t('expert_reject_reason'), 'error'); return; }
 try {
 await API.post(`/review/submissions/${id}/reject`, { reason });
 showToast(i18t('expert_reject_ok'), 'success');
 document.getElementById('card-' + id)?.remove();
 loadStats();
 } catch(e) { showToast(e.message, 'error'); }
 }

 // ── Notifications ─────────────────────────────────────────────────────────
 async function loadNotifications() {
 const body = document.getElementById('notif-body');
 try {
 const items = await API.get('/submissions/notifications');
 const unread = items.filter(n =>!n.is_read).length;
 const nb = document.getElementById('notif-badge');
 if (unread > 0) { nb.textContent = unread; nb.style.display = ''; }
 else nb.style.display = 'none';

 if (!items.length) {
 body.innerHTML = '<div class="empty-box"><div class="icon"></div><p>' + i18t('dash_notif_none') + '</p></div>';
 return;
 }
 body.innerHTML = `<div class="notif-list">` +
 items.map(n => `
 <div class="notif-item${!n.is_read ? ' unread' : ''}">
 <div>${escHtml(n.message)}</div>
 <div class="notif-date">${formatDate(n.sent_at)}</div>
 </div>`).join('') + `</div>`;
 } catch(e) {
 body.innerHTML = `<div class="empty-box"><p>${escHtml(e.message)}</p></div>`;
 }
 }

 // ── Utils ─────────────────────────────────────────────────────────────────
 function escHtml(s) {
 return String(s?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 }

 document.addEventListener('kiut:langchange', () => {
 applyExpertRoleLabels();
 const active = document.querySelector('.sidebar-nav a.active');
 const tab = active?.getAttribute('data-tab') || 'queue';
 if (tab === 'queue') loadQueue();
 if (tab === 'notifications') loadNotifications();
 if (tab === 'sent') loadSentToEditorial();
 if (tab === 'profile') loadProfileTab();
 });

 init();
