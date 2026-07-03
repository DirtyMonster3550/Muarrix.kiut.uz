
 let currentSubId = null;
 let currentFilter = 'all';
 let currentSearch = '';

 const tabTitles = {
 dashboard: 'Обзор',
 submissions: 'Управление статьями',
 publish: 'К публикации',
 'quick-publish': 'Быстрая публикация',
 'archive-manage': 'Архив выпуска',
 issues: 'Выпуски журналов',
 users: 'Пользователи',
 security: 'Мониторинг безопасности',
 settings: 'Настройки сайта',
 profile: 'Мой профиль',
 };

 function switchTab(tab, el) {
 document.querySelectorAll('.admin-nav a[data-tab]').forEach(a => a.classList.remove('active'));
 if (el) el.classList.add('active');
 document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
 document.getElementById('tab-' + tab).style.display = 'block';
 document.getElementById('topbar-title').textContent = tabTitles[tab] || tab;
 const acts = document.getElementById('topbar-actions');
 acts.innerHTML = '';
 if (tab === 'submissions') acts.innerHTML = `<div class="search-box" style="display:flex;align-items:center;gap:8px;background:#f0f4f8;border:1.5px solid var(--border);border-radius:8px;padding:6px 12px"><span></span><input id="search-input-tb" type="text" style="border:none;background:transparent;outline:none;font-size:13px;width:180px" placeholder="Поиск..." oninput="document.getElementById('search-input').value=this.value;searchSubs()"></div>`;
 if (tab === 'dashboard') loadDashboard();
 if (tab === 'submissions') loadSubmissions();
 if (tab === 'publish') loadPublishQueue();
 if (tab === 'quick-publish') loadQuickPublishTab();
 if (tab === 'archive-manage') loadArchiveManageTab();
 if (tab === 'issues') loadIssuesTab();
 if (tab === 'users') loadUsers();
 if (tab === 'security') loadSecurity();
 if (tab === 'settings') loadSettings();
 if (tab === 'profile') loadProfile();
 return false;
 }

 // ===== DASHBOARD =====
 async function loadDashboard() {
 try {
 const stats = await API.get('/admin/stats');
 document.getElementById('s-total').textContent = stats.total;
 document.getElementById('s-pending').textContent = stats.pending;
 document.getElementById('s-tech-approved').textContent = stats.tech_approved;
 document.getElementById('s-editorial-approved').textContent= stats.editorial_approved;
 document.getElementById('s-published').textContent = stats.published;
 document.getElementById('s-rejected').textContent = stats.rejected;
 document.getElementById('s-users').textContent = stats.users;

 const pb = document.getElementById('publish-badge');
 pb.style.display = stats.editorial_approved > 0? 'inline': 'none';
 pb.textContent = stats.editorial_approved;

 // Ready-to-publish list on dashboard
 const toPublish = await API.get('/admin/submissions?status=editorial_approved');
 const cont = document.getElementById('dash-publish');
 if (!toPublish.length) {
 cont.innerHTML = `<div class="empty-state" style="padding:28px"><div class="icon"></div><p>Нет статей в очереди</p></div>`;
 } else {
 cont.innerHTML = toPublish.slice(0,5).map(s => `
 <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #f5f5f5">
 <div style="flex:1;min-width:0">
 <div style="font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(s.title)}</div>
 <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${escHtml(s.full_name)} · ${formatDate(s.submitted_at)}</div>
 </div>
 <button class="btn btn-primary btn-sm" style="flex-shrink:0" onclick="switchTab('publish', document.querySelector('[data-tab=publish]'))"> К публикации</button>
 </div>`).join('');
 }

 // Activity feed
 const recent = await API.get('/admin/submissions?status=all');
 const act = document.getElementById('dash-activity');
 act.innerHTML = recent.slice(0,8).map(s => `
 <div class="activity-item">
 <div class="activity-dot ${s.status === 'published'? 'approved': s.status}"></div>
 <div>
 <span style="font-weight:600">${escHtml(s.full_name)}</span> — <em>${escHtml(s.title.substring(0,40))}${s.title.length>40?'...':''}</em>
 <div style="font-size:11px;color:var(--text-muted)">${statusBadge(s.status)} · ${formatDate(s.submitted_at)}</div>
 </div>
 </div>`).join('');
 if (!recent.length) act.innerHTML = '<div class="empty-state" style="padding:28px"><p>Активности нет</p></div>';
 } catch(err) { showToast('Ошибка: ' + err.message, 'error'); }
 }

 // ===== PUBLISH QUEUE =====
 let publishIssuesCache = [];

 function defaultPublishIssueId(article, issues) {
 if (!issues.length) return '';
 const byArticle = issues.find((i) => i.id === article.issue_id);
 if (byArticle && String(byArticle.archive_folder || '').trim()) return String(byArticle.id);
 const openReady = issues.find((i) => i.accepting_submissions && String(i.archive_folder || '').trim());
 if (openReady) return String(openReady.id);
 const anyReady = issues.find((i) => String(i.archive_folder || '').trim());
 return anyReady ? String(anyReady.id) : (byArticle ? String(byArticle.id) : String(issues[0].id));
 }

 function buildPublishIssueSelect(article, issues, selectedId) {
 const ready = issues.filter((i) => String(i.archive_folder || '').trim());
 const incomplete = issues.filter((i) => !String(i.archive_folder || '').trim());
 let html = '<option value="">— Выберите выпуск —</option>';
 if (ready.length) {
 html += '<optgroup label="✓ Можно публиковать (папка архива указана)">';
 html += ready.map((it) => {
 const tags = [];
 if (it.accepting_submissions) tags.push('текущий, приём открыт');
 else tags.push('старый выпуск');
 const tag = tags.join(', ');
 const sel = String(it.id) === String(selectedId) ? ' selected' : '';
 return `<option value="${it.id}"${sel}>${escHtml(it.title)} — ${escHtml(tag)}</option>`;
 }).join('');
 html += '</optgroup>';
 }
 if (incomplete.length) {
 html += '<optgroup label="⚠ Сначала укажите папку архива">';
 html += incomplete.map((it) => {
 const sel = String(it.id) === String(selectedId) ? ' selected' : '';
 return `<option value="${it.id}"${sel}>${escHtml(it.title)} — нет папки</option>`;
 }).join('');
 html += '</optgroup>';
 }
 return html;
 }

 function publishIssueHint(issueId, issues) {
 const issue = issues.find((i) => String(i.id) === String(issueId));
 if (!issue) return '<div class="publish-step-hint warn">Выберите выпуск журнала из списка.</div>';
 if (!String(issue.archive_folder || '').trim()) {
 return `<div class="publish-step-hint warn">У этого выпуска нет «Папки в архиве». Откройте <strong>Выпуски журналов</strong> → Изменить → заполните папку.</div>`;
 }
 return `<div class="publish-step-hint">PDF попадёт в архив: <strong>${escHtml(issue.archive_folder)}</strong></div>`;
 }

 function onPublishIssueChange(articleId) {
 const sel = document.getElementById('pub-issue-' + articleId);
 const hint = document.getElementById('pub-issue-hint-' + articleId);
 if (!sel || !hint) return;
 hint.innerHTML = publishIssueHint(sel.value, publishIssuesCache);
 }

 async function loadPublishQueue() {
 const body = document.getElementById('publish-body');
 try {
 const [items, issues] = await Promise.all([
 API.get('/review/queue'),
 API.get('/admin/issues'),
 ]);
 publishIssuesCache = issues || [];
 if (!items.length) {
 body.innerHTML = '<div class="empty-state"><div class="icon"></div><h3>Очередь пуста</h3><p>Нет статей, ожидающих публикации.</p></div>';
 return;
 }
 if (!publishIssuesCache.length) {
 body.innerHTML = `<div class="alert alert-danger" style="margin:16px">Нет ни одного выпуска журнала. Сначала создайте выпуск в разделе <strong>Выпуски журналов</strong>.</div>`;
 return;
 }
 body.innerHTML = `<div style="display:flex;flex-direction:column;gap:14px">` +
 items.map((a) => {
 const defaultIssue = defaultPublishIssueId(a, publishIssuesCache);
 return `
 <div style="background:#fff;border:1px solid var(--border);border-radius:12px;padding:20px 24px">
 <div style="font-size:16px;font-weight:700;color:var(--primary);margin-bottom:6px">${escHtml(a.title)}</div>
 <div style="font-size:12px;color:var(--text-muted);display:flex;gap:14px;flex-wrap:wrap;margin-bottom:12px">
 <span>👤 ${escHtml(a.full_name)}</span>
 <span>✉ ${escHtml(a.email)}</span>
 ${a.issue_title? `<span>📋 При подаче: ${escHtml(a.issue_title)}</span>`: ''}
 <span>📅 ${formatDate(a.submitted_at)}</span>
 </div>
 ${a.abstract? `<div style="font-size:13px;background:#f8fafc;border-left:3px solid var(--primary-light);padding:10px 12px;border-radius:0 6px 6px 0;margin-bottom:14px;line-height:1.6">${escHtml(a.abstract)}</div>`: ''}

 <div class="publish-step">
 <div class="publish-step-num">В какой выпуск добавить?</div>
 <label for="pub-issue-${a.id}">Выпуск журнала</label>
 <select id="pub-issue-${a.id}" class="form-control" style="max-width:520px" onchange="onPublishIssueChange(${a.id})">
 ${buildPublishIssueSelect(a, publishIssuesCache, defaultIssue)}
 </select>
 <div id="pub-issue-hint-${a.id}">${publishIssueHint(defaultIssue, publishIssuesCache)}</div>
 <div class="publish-step-actions">
 <button type="button" class="btn btn-secondary btn-sm" onclick="switchTab('issues', document.querySelector('[data-tab=issues]'))">＋ Создать новый выпуск</button>
 </div>
 </div>

 <div class="publish-step">
 <div class="publish-step-num">Файлы</div>
 <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
 ${a.file_path? `<a class="btn btn-secondary btn-sm" href="/uploads/${escHtml(a.file_path)}?token=${Auth.getToken()}" target="_blank" download>📄 Скачать Word (от автора)</a>`: '<span style="font-size:12px;color:var(--danger)">Word файл отсутствует</span>'}
 </div>
 <label for="pub-pdf-${a.id}" style="font-size:13px;font-weight:600">PDF для архива (обязательно)</label>
 <input type="file" id="pub-pdf-${a.id}" accept=".pdf,application/pdf" style="display:block;margin-top:8px;max-width:320px">
 </div>

 <div class="publish-step" style="background:#fff">
 <div class="publish-step-num">Опубликовать</div>
 <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">
 <textarea id="pub-note-${a.id}" placeholder="Примечание автору (необязательно)…" style="flex:1;min-width:200px;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px;font-family:inherit;resize:vertical;min-height:50px"></textarea>
 <button class="btn btn-sm" style="background:var(--success);color:#fff;font-weight:700;padding:12px 20px" onclick="publishSub(${a.id})">✓ Опубликовать PDF в архив</button>
 </div>
 </div>
 </div>`;
 }).join('') + `</div>`;
 } catch(e) {
 body.innerHTML = `<div class="alert alert-danger" style="margin:16px">${escHtml(e.message)}</div>`;
 }
 }

 async function publishSub(id) {
 const issueId = document.getElementById('pub-issue-' + id)?.value;
 const note = document.getElementById('pub-note-' + id)?.value || '';
 const fileInput = document.getElementById('pub-pdf-' + id);
 const pdfFile = fileInput?.files?.[0];
 if (!issueId) {
 showToast('Выберите выпуск журнала', 'error');
 return;
 }
 if (!pdfFile) {
 showToast('Выберите PDF файл', 'error');
 return;
 }
 const fd = new FormData();
 fd.append('pdf', pdfFile);
 fd.append('issue_id', issueId);
 if (note) fd.append('note', note);
 try {
 await API.upload(`/admin/submissions/${id}/publish`, fd);
 showToast('PDF опубликован и добавлен в архив!', 'success');
 loadPublishQueue();
 loadDashboard();
 } catch(e) { showToast(e.message, 'error'); }
 }

 // ===== QUICK PUBLISH (PDF → archive) =====
 let quickPublishRowSeq = 0;
 let quickPublishIssuesCache = [];

 function guessTitleFromPdfFilename(name) {
  const stem = String(name || '').replace(/\.pdf$/i, '');
  return stem
   .replace(/\+/g, ' ')
   .replace(/_/g, ' ')
   .replace(/\s*\(\d+\)\s*$/i, '')
   .replace(/\s{2,}/g, ' ')
   .trim();
 }

 function quickPublishRowHtml(id) {
  return `
 <div class="quick-pub-row" data-row-id="${id}" style="border:1px solid var(--border);border-radius:12px;padding:16px;margin-top:14px;background:#fff">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
   <strong style="font-size:13px;color:var(--primary)">PDF #${id}</strong>
   <button type="button" class="btn btn-secondary btn-sm" onclick="removeQuickPublishRow(${id})">Убрать</button>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
   <div class="form-group" style="margin:0">
    <label class="form-label">Название статьи <span style="color:var(--danger)">*</span></label>
    <input type="text" class="form-control qp-title" placeholder="Название">
   </div>
   <div class="form-group" style="margin:0">
    <label class="form-label">Авторы</label>
    <input type="text" class="form-control qp-authors" placeholder="Иванов И.И., Петров П.П.">
   </div>
  </div>
  <div class="form-group" style="margin:12px 0 0">
   <label class="form-label">Краткое описание (необязательно)</label>
   <textarea class="form-control qp-abstract" rows="2" placeholder="Аннотация для архива"></textarea>
  </div>
  <div class="form-group" style="margin:12px 0 0">
   <label class="form-label">PDF-файл <span style="color:var(--danger)">*</span></label>
   <input type="file" class="form-control qp-file" accept=".pdf,application/pdf" onchange="onQuickPublishFileChange(${id}, this)">
   <p class="qp-file-hint" style="font-size:12px;color:var(--text-muted);margin:6px 0 0"></p>
  </div>
 </div>`;
 }

 function addQuickPublishRow() {
  quickPublishRowSeq += 1;
  const wrap = document.getElementById('quick-publish-rows');
  wrap.insertAdjacentHTML('beforeend', quickPublishRowHtml(quickPublishRowSeq));
 }

 function removeQuickPublishRow(id) {
  const row = document.querySelector(`.quick-pub-row[data-row-id="${id}"]`);
  if (row) row.remove();
  const left = document.querySelectorAll('.quick-pub-row');
  if (!left.length) addQuickPublishRow();
 }

 function onQuickPublishFileChange(id, input) {
  const row = document.querySelector(`.quick-pub-row[data-row-id="${id}"]`);
  if (!row || !input.files?.[0]) return;
  const file = input.files[0];
  const hint = row.querySelector('.qp-file-hint');
  if (hint) hint.textContent = file.name;
  const titleEl = row.querySelector('.qp-title');
  if (titleEl && !titleEl.value.trim()) {
   titleEl.value = guessTitleFromPdfFilename(file.name);
  }
 }

 function updateQuickPublishIssueHint() {
  const sel = document.getElementById('quick-publish-issue');
  const hint = document.getElementById('quick-publish-issue-hint');
  if (!sel || !hint) return;
  const issue = quickPublishIssuesCache.find((i) => String(i.id) === sel.value);
  if (!issue) {
   hint.textContent = '';
   return;
  }
  if (issue.archive_folder) {
   hint.innerHTML = `Папка архива: <code>${escHtml(issue.archive_folder)}</code>`;
   hint.style.color = 'var(--text-muted)';
  } else {
   hint.textContent = 'У этого выпуска не задана «Папка в архиве» — укажите в разделе «Выпуски журналов».';
   hint.style.color = 'var(--danger)';
  }
 }

 async function loadQuickPublishTab() {
  const sel = document.getElementById('quick-publish-issue');
  const rows = document.getElementById('quick-publish-rows');
  const alertBox = document.getElementById('quick-publish-alert');
  const results = document.getElementById('quick-publish-results');
  if (alertBox) alertBox.innerHTML = '';
  if (results) results.style.display = 'none';

  try {
   quickPublishIssuesCache = await API.get('/admin/issues');
   if (!quickPublishIssuesCache.length) {
    if (sel) sel.innerHTML = '<option value="">— нет выпусков —</option>';
    if (rows) rows.innerHTML = '<div class="alert alert-info">Сначала создайте выпуск в разделе «Выпуски журналов».</div>';
    return;
   }

   const sorted = [...quickPublishIssuesCache].sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0));
   if (sel) {
    sel.innerHTML = sorted.map((i) =>
     `<option value="${i.id}">${escHtml(i.title)}${i.archive_folder ? '' : ' (нет папки архива)'}</option>`
    ).join('');
    const withFolder = sorted.find((i) => i.archive_folder);
    sel.value = String((withFolder || sorted[0]).id);
   }

   if (rows && !rows.querySelector('.quick-pub-row')) {
    rows.innerHTML = '';
    addQuickPublishRow();
   }
   updateQuickPublishIssueHint();
   if (sel) sel.onchange = updateQuickPublishIssueHint;
  } catch (e) {
   if (rows) rows.innerHTML = `<div class="alert alert-danger">${escHtml(e.message)}</div>`;
  }
 }

 async function submitQuickPublish() {
  const issueId = document.getElementById('quick-publish-issue')?.value;
  const alertBox = document.getElementById('quick-publish-alert');
  const btn = document.getElementById('quick-publish-submit');
  const results = document.getElementById('quick-publish-results');
  const resultsBody = document.getElementById('quick-publish-results-body');

  if (!issueId) {
   showToast('Выберите выпуск журнала', 'error');
   return;
  }

  const rowEls = [...document.querySelectorAll('.quick-pub-row')];
  const payloads = rowEls.map((row) => ({
   title: row.querySelector('.qp-title')?.value?.trim() || '',
   authors: row.querySelector('.qp-authors')?.value?.trim() || '',
   abstract: row.querySelector('.qp-abstract')?.value?.trim() || '',
   file: row.querySelector('.qp-file')?.files?.[0] || null,
  })).filter((p) => p.file || p.title);

  const ready = payloads.filter((p) => p.file && p.title);
  if (!ready.length) {
   showToast('Добавьте хотя бы один PDF и укажите название', 'error');
   return;
  }

  if (alertBox) alertBox.innerHTML = '';
  btn.disabled = true;
  const origText = btn.textContent;
  btn.textContent = 'Публикация…';

  const ok = [];
  const failed = [];

  for (const item of ready) {
   const fd = new FormData();
   fd.append('issue_id', issueId);
   fd.append('title', item.title);
   fd.append('authors', item.authors);
   fd.append('abstract', item.abstract);
   fd.append('pdf', item.file);
   try {
    const res = await fetch('/api/admin/quick-publish', {
     method: 'POST',
     headers: { Authorization: `Bearer ${Auth.getToken()}` },
     credentials: 'same-origin',
     body: fd,
    });
    let data = {};
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
     data = await res.json();
    } else if (!res.ok) {
     throw new Error(`Сервер вернул ${res.status}. Возможно, файл слишком большой или nginx оборвал соединение.`);
    }
    if (!res.ok) throw new Error(data.error || `Ошибка ${res.status}`);
    ok.push({ title: item.title, file: data.archiveFile, folder: data.folder });
   } catch (e) {
    const msg = e.message === 'Failed to fetch'
     ? (item.file && item.file.size > 60000
       ? `Файл ${Math.round(item.file.size / 1024)} КБ — nginx на сервере обрывает загрузки больше ~64 КБ. Нужно в конфиге nginx добавить client_max_body_size 50m; и перезагрузить nginx.`
       : 'Сервер не ответил (проверьте доступность сайта и права на папку архива)')
     : e.message;
    failed.push({ title: item.title, error: msg });
   }
  }

  btn.disabled = false;
  btn.textContent = origText;

  if (ok.length) {
   showToast(`Опубликовано: ${ok.length}`, 'success');
  }
  if (failed.length) {
   showToast(`Ошибок: ${failed.length}`, 'error');
  }

  if (results && resultsBody) {
   results.style.display = 'block';
   resultsBody.innerHTML = `
    ${ok.length ? `<p style="color:var(--success);font-weight:600;margin-bottom:8px">Успешно: ${ok.length}</p>
    <ul style="margin:0 0 16px;padding-left:20px">${ok.map((r) => `<li>${escHtml(r.title)} → ${escHtml(r.file)}</li>`).join('')}</ul>` : ''}
    ${failed.length ? `<p style="color:var(--danger);font-weight:600;margin-bottom:8px">Ошибки: ${failed.length}</p>
    <ul style="margin:0;padding-left:20px">${failed.map((r) => `<li>${escHtml(r.title)}: ${escHtml(r.error)}</li>`).join('')}</ul>` : ''}
   `;
  }

  if (ok.length && !failed.length) {
   document.getElementById('quick-publish-rows').innerHTML = '';
   addQuickPublishRow();
  }
 }

 // ===== ARCHIVE MANAGE (delete published PDFs) =====
 let archiveManageIssuesCache = [];
 let archiveManageListBound = false;

 function bindArchiveManageDelete() {
  if (archiveManageListBound) return;
  const list = document.getElementById('archive-manage-list');
  if (!list) return;
  list.addEventListener('click', (e) => {
   const btn = e.target.closest('.archive-delete-btn');
   if (!btn) return;
   deleteArchiveArticle(
    parseInt(btn.dataset.issueId, 10),
    decodeURIComponent(btn.dataset.file || ''),
    decodeURIComponent(btn.dataset.title || '')
   );
  });
  archiveManageListBound = true;
 }

 async function loadArchiveManageTab() {
  bindArchiveManageDelete();
  const sel = document.getElementById('archive-manage-issue');
  const list = document.getElementById('archive-manage-list');
  const alertBox = document.getElementById('archive-manage-alert');
  if (alertBox) alertBox.innerHTML = '';

  try {
   archiveManageIssuesCache = await API.get('/admin/issues');
   if (!archiveManageIssuesCache.length) {
    if (sel) sel.innerHTML = '';
    if (list) list.innerHTML = '<div class="alert alert-warning">Сначала создайте выпуск в разделе «Выпуски журналов».</div>';
    return;
   }

   const sorted = [...archiveManageIssuesCache].sort((a, b) => (b.sort_order || 0) - (a.sort_order || 0));
   if (sel) {
    const prev = sel.value;
    sel.innerHTML = sorted.map((i) =>
     `<option value="${i.id}">${escHtml(i.title)}${i.archive_folder ? '' : ' (нет папки архива)'}</option>`
    ).join('');
    const withFolder = sorted.find((i) => i.archive_folder);
    sel.value = prev && sorted.some((i) => String(i.id) === prev) ? prev : (withFolder ? String(withFolder.id) : String(sorted[0].id));
    sel.onchange = () => { updateArchiveManageIssueHint(); loadArchiveManageArticles(); };
   }
   updateArchiveManageIssueHint();
   await loadArchiveManageArticles();
  } catch (e) {
   if (list) list.innerHTML = `<div class="alert alert-danger">${escHtml(e.message)}</div>`;
  }
 }

 function updateArchiveManageIssueHint() {
  const sel = document.getElementById('archive-manage-issue');
  const hint = document.getElementById('archive-manage-issue-hint');
  if (!sel || !hint) return;
  const issue = archiveManageIssuesCache.find((i) => String(i.id) === sel.value);
  if (!issue) {
   hint.textContent = '';
   return;
  }
  if (issue.archive_folder) {
   const folderEnc = encodeURIComponent(issue.archive_folder);
   hint.innerHTML = `Папка архива: <code>${escHtml(issue.archive_folder)}</code> · <a href="/archive-issue.html?folder=${folderEnc}" target="_blank" rel="noopener">Открыть выпуск на сайте</a>`;
  } else {
   hint.textContent = 'У этого выпуска не задана «Папка в архиве» — укажите в разделе «Выпуски журналов».';
  }
 }

 async function loadArchiveManageArticles() {
  const issueId = document.getElementById('archive-manage-issue')?.value;
  const list = document.getElementById('archive-manage-list');
  const alertBox = document.getElementById('archive-manage-alert');
  if (!issueId || !list) return;
  if (alertBox) alertBox.innerHTML = '';

  list.innerHTML = '<div class="empty-state" style="padding:28px"><div class="loader loader-dark"></div></div>';

  try {
   const data = await API.get(`/admin/archive/issues/${issueId}/articles`);
   if (!data.articles?.length) {
    list.innerHTML = '<div class="empty-state" style="padding:28px"><p>В этом выпуске нет PDF в архиве</p></div>';
    return;
   }

   list.innerHTML = `
    <div class="table-container">
     <table class="admin-table">
      <thead>
       <tr>
        <th style="width:36px">#</th>
        <th>Название</th>
        <th>Авторы</th>
        <th>PDF</th>
        <th style="width:120px"></th>
       </tr>
      </thead>
      <tbody>
       ${data.articles.map((a, idx) => {
        const authors = Array.isArray(a.authors) ? a.authors.join(', ') : (a.authors || '—');
        const pdfUrl = `/archives/${data.folder.split('/').map(encodeURIComponent).join('/')}/${encodeURIComponent(a.file)}`;
        return `<tr>
         <td>${idx + 1}</td>
         <td>
          <div style="font-weight:600">${escHtml(a.title)}</div>
          ${a.quickPublish ? '<span style="font-size:11px;color:var(--text-muted)">быстрая публикация</span>' : ''}
          ${a.submissionId ? `<span style="font-size:11px;color:var(--text-muted)">подача #${a.submissionId}</span>` : ''}
         </td>
         <td style="font-size:13px;color:var(--text-muted)">${escHtml(authors || '—')}</td>
         <td><a href="${pdfUrl}" target="_blank" rel="noopener">${escHtml(a.file)}</a></td>
         <td>
          <button type="button" class="btn btn-danger btn-sm archive-delete-btn" data-issue-id="${issueId}" data-file="${encodeURIComponent(a.file)}" data-title="${encodeURIComponent(a.title || a.file)}">Удалить</button>
         </td>
        </tr>`;
       }).join('')}
      </tbody>
     </table>
    </div>
   `;
  } catch (e) {
   list.innerHTML = `<div class="alert alert-danger">${escHtml(e.message)}</div>`;
  }
 }

 async function deleteArchiveArticle(issueId, fileName, title) {
  const label = title || fileName;
  if (!confirm(`Удалить из архива?\n\n${label}\n\nPDF исчезнет с сайта. Это действие нельзя отменить.`)) return;

  try {
   await API.delete(`/admin/archive/issues/${issueId}/articles/${encodeURIComponent(fileName)}`);
   showToast('Статья удалена из архива', 'success');
   await loadArchiveManageArticles();
  } catch (e) {
   showToast(e.message, 'error');
  }
 }

 async function syncPublishedArchive() {
 if (!confirm('Скопировать все ранее опубликованные статьи в публичный архив?')) return;
 try {
 const r = await API.post('/admin/archive/sync-published', {});
 const failed = (r.failed && r.failed.length) || 0;
 if (failed) {
 showToast(`Готово: ${r.ok}, ошибок: ${failed}. Проверьте папки выпусков.`, 'warning');
 } else {
 showToast(`Синхронизировано статей: ${r.ok}`, 'success');
 }
 } catch (e) { showToast(e.message, 'error'); }
 }

 // ===== SUBMISSIONS =====
 async function loadSubmissions() {
 try {
 const data = await API.get(`/admin/submissions?status=${currentFilter}&search=${encodeURIComponent(currentSearch)}`);
 renderSubsTable(data);
 } catch(err) {
 document.getElementById('subs-body').innerHTML = `<div class="alert alert-danger" style="margin:16px">${err.message}</div>`;
 }
 }

 function filterSubs(status, btn) {
 currentFilter = status;
 document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
 btn.classList.add('active');
 loadSubmissions();
 }

 function searchSubs() {
 currentSearch = document.getElementById('search-input')?.value || '';
 loadSubmissions();
 }

 let selectedIds = new Set();

 function renderSubsTable(data) {
 selectedIds.clear();
 updateBulkToolbar();
 const body = document.getElementById('subs-body');
 if (!data.length) { body.innerHTML = `<div class="empty-state"><div class="icon"></div><h3>Статей не найдено</h3></div>`; return; }
 body.innerHTML = `
 <table>
 <thead><tr>
 <th style="width:32px"><input type="checkbox" id="check-all" onchange="toggleAllSubs(this)" title="Выбрать все"></th>
 <th>#</th><th>Автор</th><th>Статья</th><th>Журнал</th><th>Выпуск</th><th>Дата</th><th>Статус</th><th>Действия</th>
 </tr></thead>
 <tbody>${data.map((s,i) => `
 <tr id="sub-row-${s.id}">
 <td><input type="checkbox" class="sub-check" value="${s.id}" onchange="toggleSubCheck(this)"></td>
 <td style="color:var(--text-muted)">${i+1}</td>
 <td><strong style="font-size:13px">${escHtml(s.full_name)}</strong><br><span style="font-size:11px;color:var(--text-muted)">${escHtml(s.email)}</span></td>
 <td style="max-width:220px"><div style="font-weight:600;font-size:13px;word-break:break-word">${escHtml(s.title)}</div><div style="font-size:11px;color:var(--text-muted)">${escHtml(s.authors)}</div></td>
 <td style="font-size:12px">${journalName(s.journal)}</td>
 <td style="font-size:11px;color:var(--text-muted);max-width:140px">${s.issue_title? escHtml(s.issue_title): '—'}</td>
 <td style="font-size:12px">${formatDate(s.submitted_at)}</td>
 <td>${statusBadge(s.status)}</td>
 <td><div style="display:flex;gap:6px;flex-wrap:wrap">
 <button class="btn btn-secondary btn-sm" onclick="viewSub(${s.id})">Просмотр</button>
 ${s.file_path? `<a class="btn btn-secondary btn-sm" href="/uploads/${escHtml(s.file_path)}?token=${Auth.getToken()}" target="_blank" download>Файл</a>`: ''}
 </div></td>
 </tr>`).join('')}
 </tbody>
 </table>`;
 }

 function toggleSubCheck(cb) {
 const id = parseInt(cb.value, 10);
 cb.checked? selectedIds.add(id): selectedIds.delete(id);
 updateBulkToolbar();
 }

 function toggleAllSubs(masterCb) {
 document.querySelectorAll('.sub-check').forEach(cb => {
 cb.checked = masterCb.checked;
 const id = parseInt(cb.value, 10);
 masterCb.checked? selectedIds.add(id): selectedIds.delete(id);
 });
 updateBulkToolbar();
 }

 function updateBulkToolbar() {
 const toolbar = document.getElementById('bulk-toolbar');
 if (selectedIds.size > 0) {
 toolbar.style.display = 'flex';
 document.getElementById('bulk-count').textContent = `${selectedIds.size} выбрано`;
 } else {
 toolbar.style.display = 'none';
 }
 }

 function clearBulkSelection() {
 selectedIds.clear();
 document.querySelectorAll('.sub-check').forEach(cb => cb.checked = false);
 const master = document.getElementById('check-all');
 if (master) master.checked = false;
 updateBulkToolbar();
 }

 async function bulkAction(action) {
 if (!selectedIds.size) return;
 if (action !== 'reject') return;
 if (!confirm(`Отклонить ${selectedIds.size} статей?`)) return;
 const note = document.getElementById('bulk-note').value.trim();
 try {
 const r = await API.post('/admin/submissions/bulk', { ids: [...selectedIds], action, note });
 showToast(`Обработано: ${r.processed} статей`, 'success');
 clearBulkSelection();
 loadSubmissions();
 } catch(e) { showToast(e.message, 'error'); }
 }

 async function exportCsv() {
 try {
 const qs = currentFilter!== 'all'? `?status=${currentFilter}`: '';
 const r = await fetch(`/api/admin/submissions/export${qs}`, {
 headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
 });
 if (!r.ok) { showToast('Ошибка экспорта', 'error'); return; }
 const blob = await r.blob();
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `submissions_${new Date().toISOString().slice(0,10)}.csv`;
 a.click();
 URL.revokeObjectURL(url);
 } catch(e) { showToast('Ошибка экспорта: ' + e.message, 'error'); }
 }

 async function downloadBackup() {
 try {
 const r = await fetch('/api/admin/backup', {
 headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
 });
 if (!r.ok) { showToast('Ошибка бэкапа', 'error'); return; }
 const blob = await r.blob();
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `kiut_backup_${new Date().toISOString().slice(0,10)}.db`;
 a.click();
 URL.revokeObjectURL(url);
 showToast('Резервная копия скачана', 'success');
 } catch(e) { showToast('Ошибка: ' + e.message, 'error'); }
 }

 async function viewSub(id) {
 openModal('view-modal');
 document.getElementById('view-detail').innerHTML = '<div class="empty-state"><div class="loader loader-dark"></div></div>';
 try {
 const s = await API.get(`/admin/submissions/${id}`);
 document.getElementById('view-detail').innerHTML = `
 <div class="detail-grid">
 <div class="detail-item" style="grid-column:1/-1"><label>Название</label><p><strong>${s.title}</strong></p></div>
 <div class="detail-item"><label>Автор</label><p>${s.full_name} (${s.email})</p></div>
 <div class="detail-item"><label>Соавторы</label><p>${s.authors}</p></div>
 <div class="detail-item"><label>Журнал</label><p>${journalName(s.journal)}</p></div>
 <div class="detail-item"><label>Выпуск</label><p>${s.issue_title || '—'}</p></div>
 <div class="detail-item"><label>Дата (из формы автора)</label><p>${s.author_date || '—'}</p></div>
 <div class="detail-item"><label>Статус</label><p>${statusBadge(s.status)}</p></div>
 <div class="detail-item"><label>Дата подачи</label><p>${formatDate(s.submitted_at)}</p></div>
 ${s.reviewed_at? `<div class="detail-item"><label>Дата решения</label><p>${formatDate(s.reviewed_at)}</p></div>`: ''}
 ${s.abstract? `<div class="detail-item" style="grid-column:1/-1"><label>Аннотация</label><p style="font-size:13px;line-height:1.6">${s.abstract}</p></div>`: ''}
 ${s.file_path? `<div class="detail-item" style="grid-column:1/-1"><label>Файл</label><p><a href="/uploads/${escHtml(s.file_path)}?token=${Auth.getToken()}" target="_blank" class="btn btn-secondary btn-sm"> Скачать файл</a></p></div>`: ''}
 ${s.admin_note? `<div class="detail-item" style="grid-column:1/-1"><label>Примечание редактора</label><div class="alert alert-info" style="margin:0">${s.admin_note}</div></div>`: ''}
 </div>`;
 } catch(err) { document.getElementById('view-detail').innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
 }

 async function openReview(id) {
 currentSubId = id;
 openModal('review-modal');
 document.getElementById('review-detail').innerHTML = '<div class="empty-state" style="padding:10px"><div class="loader loader-dark"></div></div>';
 document.getElementById('admin-note').value = '';
 document.getElementById('review-alert').innerHTML = '';
 const noteEl = document.getElementById('review-workflow-note');
 const btnA = document.getElementById('btn-approve');
 noteEl.style.display = 'none';
 btnA.style.display = 'none';
 try {
 const s = await API.get(`/admin/submissions/${id}`);
 document.getElementById('review-modal-title').textContent = s.title.substring(0,50) + (s.title.length>50?'...':'');
 if (s.status === 'pending' || s.status === 'tech_approved') {
 noteEl.style.display = 'block';
 noteEl.textContent = s.status === 'pending'
 ? 'Статья автоматически отправлена техническому эксперту. Админ не одобряет её на этом этапе — можно только вернуть автору на доработку.'
 : 'Статья у редакционного эксперта. Дождитесь решения или верните на доработку.';
 }
 document.getElementById('review-detail').innerHTML = `
 <div class="detail-grid">
 <div class="detail-item" style="grid-column:1/-1"><label>Название</label><p><strong>${s.title}</strong></p></div>
 <div class="detail-item"><label>Автор</label><p>${s.full_name} (${s.email})</p></div>
 <div class="detail-item"><label>Журнал</label><p>${journalName(s.journal)}</p></div>
 <div class="detail-item"><label>Выпуск</label><p>${s.issue_title || '—'}</p></div>
 <div class="detail-item"><label>Дата (из формы автора)</label><p>${s.author_date || '—'}</p></div>
 <div class="detail-item"><label>Дата подачи</label><p>${formatDate(s.submitted_at)}</p></div>
 ${s.abstract? `<div class="detail-item" style="grid-column:1/-1"><label>Аннотация</label><p style="font-size:13px;line-height:1.6">${s.abstract}</p></div>`: ''}
 ${s.file_path? `<div class="detail-item" style="grid-column:1/-1"><label>Файл</label><p><a href="/uploads/${escHtml(s.file_path)}?token=${Auth.getToken()}" target="_blank" class="btn btn-secondary btn-sm"> Открыть файл</a></p></div>`: ''}
 </div>`;
 } catch(err) { document.getElementById('review-detail').innerHTML = `<div class="alert alert-danger">${err.message}</div>`; }
 }

 async function reviewAction(action) {
 if (!currentSubId) return;
 const note = document.getElementById('admin-note').value.trim();
 const alertBox = document.getElementById('review-alert');
 const btnA = document.getElementById('btn-approve');
 const btnR = document.getElementById('btn-reject');
 btnA.disabled = btnR.disabled = true;
 btnA.innerHTML = '<span class="loader"></span>';
 alertBox.innerHTML = '';
 try {
 const result = await API.post(`/admin/submissions/${currentSubId}/${action}`, { note });
 if (result.stub) {
 alertBox.innerHTML = `<div class="alert alert-warning" style="margin-top:12px"> Действие выполнено, но email не отправлен — настройте EMAIL в файле.env</div>`;
 loadDashboard(); loadSubmissions();
 } else {
 showToast(action==='approve'? ' Статья одобрена, автор уведомлён': ' Возвращено на доработку', action==='approve'?'success':'info');
 setTimeout(() => { closeModal('review-modal'); loadDashboard(); loadSubmissions(); }, 1200);
 }
 } catch(err) {
 alertBox.innerHTML = `<div class="alert alert-danger" style="margin-top:12px"> ${err.message}</div>`;
 } finally {
 btnA.disabled = btnR.disabled = false;
 btnA.innerHTML = ' Одобрить и уведомить';
 btnR.innerHTML = ' Вернуть на доработку';
 }
 }

 // ===== USERS =====
 const ROLE_LABELS = {
 admin: { label: ' Администратор', cls: 'status-approved', color: '#1a3a6b' },
 editorial_expert: { label: ' Ред. эксперт', cls: 'status-approved', color: '#0d6e4e' },
 tech_expert: { label: ' Техн. эксперт', cls: 'status-pending', color: '#7c3aed' },
 author: { label: ' Автор', cls: 'status-pending', color: '#6b7a8d' },
 };

 function roleLabel(role) {
 const r = ROLE_LABELS[role] || { label: role, cls: 'status-pending', color: '#6b7a8d' };
 return `<span class="status-badge ${r.cls}" style="background:${r.color}15;color:${r.color};border:1px solid ${r.color}30">${r.label}</span>`;
 }

 async function changeRole(userId, newRole) {
 try {
 await API.put(`/admin/users/${userId}/role`, { role: newRole });
 showToast('Роль изменена', 'success');
 loadUsers();
 } catch(e) { showToast(e.message, 'error'); }
 }

 async function createUser() {
 const alertBox = document.getElementById('create-user-alert');
 const full_name = document.getElementById('new-user-name').value.trim();
 const email = document.getElementById('new-user-email').value.trim();
 const password = document.getElementById('new-user-password').value;
 const role = document.getElementById('new-user-role').value;
 alertBox.innerHTML = '';
 if (!full_name || !email || !password) {
  alertBox.innerHTML = '<div class="alert alert-danger"> Заполните все поля</div>';
  return;
 }
 try {
  await API.post('/admin/users', { full_name, email, password, role });
  showToast('Пользователь создан', 'success');
  document.getElementById('new-user-name').value = '';
  document.getElementById('new-user-email').value = '';
  document.getElementById('new-user-password').value = '';
  document.getElementById('new-user-role').value = 'author';
  loadUsers();
  loadDashboard();
 } catch (e) {
  alertBox.innerHTML = `<div class="alert alert-danger"> ${escHtml(e.message)}</div>`;
 }
 }

 function roleSelect(u) {
 if (u.role === 'admin') return roleLabel('admin');
 return `
 <div style="display:flex;align-items:center;gap:6px">
 ${roleLabel(u.role)}
 <select onchange="changeRole(${u.id}, this.value)" title="Изменить роль"
 style="font-size:11px;padding:2px 6px;border:1px solid var(--border);border-radius:6px;background:#fff;cursor:pointer;color:var(--text)">
 <option value="author" ${u.role==='author'?'selected':''}> Автор</option>
 <option value="tech_expert" ${u.role==='tech_expert'?'selected':''}> Техн. эксперт</option>
 <option value="editorial_expert" ${u.role==='editorial_expert'?'selected':''}> Ред. эксперт</option>
 </select>
 </div>`;
 }

 async function loadUsers() {
 try {
 const data = await API.get('/admin/users');
 const body = document.getElementById('users-body');
 if (!data.length) { body.innerHTML = '<div class="empty-state"><div class="icon"></div><h3>Пользователей нет</h3></div>'; return; }
 body.innerHTML = `
 <table>
 <thead><tr><th>#</th><th>ФИО</th><th>Email</th><th>Роль</th><th>Дата регистрации</th><th>Статей</th><th></th></tr></thead>
 <tbody>${data.map((u,i) => `
 <tr style="${u.is_banned? 'background:#fff5f5;opacity:0.8': ''}">
 <td style="color:var(--text-muted)">${i+1}</td>
 <td><strong>${escHtml(u.full_name)}</strong>${u.is_banned? ' <span style="font-size:10px;background:#fee2e2;color:#b91c1c;padding:1px 6px;border-radius:8px">заблокирован</span>': ''}</td>
 <td style="font-size:13px">${escHtml(u.email)}</td>
 <td>${roleSelect(u)}</td>
 <td style="font-size:12px">${formatDate(u.created_at)}</td>
 <td style="text-align:center;font-weight:700">${u.submissions_count}</td>
 <td style="white-space:nowrap">
 <button class="btn btn-secondary btn-sm" style="font-size:11px" onclick="openUserDetail(${u.id})"> Детали</button>
 ${u.role!== 'admin'
? `<button class="btn btn-secondary btn-sm" style="font-size:11px" onclick="resetUserPasswordPrompt(${u.id})">Пароль</button>`
+ (u.submissions_count === 0
? `<button class="btn btn-danger btn-sm" style="font-size:11px" onclick="deleteUser(${u.id})">Удалить</button>`
: '')
+ (u.is_banned
? `<button class="btn btn-secondary btn-sm" style="font-size:11px" onclick="unbanUser(${u.id});loadUsers()">Разблокировать</button>`
: `<button class="btn btn-danger btn-sm" style="font-size:11px" onclick="banUserFromList(${u.id})">Заблокировать</button>`)
: ''}
 </td>
 </tr>`).join('')}
 </tbody>
 </table>`;
 } catch(err) { document.getElementById('users-body').innerHTML = `<div class="alert alert-danger" style="margin:16px">${escHtml(err.message)}</div>`; }
 }

 // ===== SETTINGS =====
 async function loadSettings() {
 try {
 const d = await API.get('/admin/settings');
 document.getElementById('announce-enabled').checked = d.announce_enabled === '1';
 document.getElementById('announce-text').value = d.announce_text || '';
 document.getElementById('announce-cta').value = d.announce_cta || '';
 document.getElementById('site-email').value = d.site_email || '';
 document.getElementById('site-phone').value = d.site_phone || '';
 document.getElementById('site-address').value = d.site_address || '';
 previewAnnounce();
 } catch(err) { showToast('Ошибка загрузки настроек', 'error'); }
 }

 function previewAnnounce() {
 const preview = document.getElementById('announce-preview');
 const text = document.getElementById('announce-text')?.value;
 const cta = document.getElementById('announce-cta')?.value;
 const enabled = document.getElementById('announce-enabled')?.checked;
 preview.style.opacity = enabled? '1': '0.4';
 preview.querySelector('.announce-text').textContent = ' ' + (text || '...');
 preview.querySelector('.announce-link').textContent = cta || '...';
 }

 async function saveSettings() {
 try {
 await API.put('/admin/settings', {
 announce_enabled: document.getElementById('announce-enabled').checked? '1': '0',
 announce_text: document.getElementById('announce-text').value,
 announce_cta: document.getElementById('announce-cta').value,
 });
 showToast('Баннер сохранён!', 'success');
 } catch(err) { showToast('Ошибка: ' + err.message, 'error'); }
 }

 async function saveContacts() {
 try {
 await API.put('/admin/settings', {
 site_email: document.getElementById('site-email').value,
 site_phone: document.getElementById('site-phone').value,
 site_address: document.getElementById('site-address').value,
 });
 showToast('Контакты сохранены!', 'success');
 } catch(err) { showToast('Ошибка: ' + err.message, 'error'); }
 }

 // ===== ISSUES (выпуски) =====
 let issueArchiveFolders = [];
 let issueArchiveFoldersLoaded = false;
 let issueCoverPreviewObjectUrl = null;

 function escapeIssueHtml(t) {
 const d = document.createElement('div');
 d.textContent = t;
 return d.innerHTML;
 }

 function setIssueCoverPreview(url) {
 const img = document.getElementById('issue-cover-preview');
 if (issueCoverPreviewObjectUrl) {
 URL.revokeObjectURL(issueCoverPreviewObjectUrl);
 issueCoverPreviewObjectUrl = null;
 }
 if (!url) {
 img.style.display = 'none';
 img.removeAttribute('src');
 return;
 }
 if (url.startsWith('blob:')) issueCoverPreviewObjectUrl = url;
 img.onerror = () => {
  img.style.display = 'none';
  if (!url.startsWith('blob:')) {
   console.warn('Обложка на сервере не найдена:', url, '— загрузите файл заново');
  }
 };
 img.onload = () => { img.style.display = 'block'; };
 img.src = url.includes('?') ? url : url + '?t=' + Date.now();
 img.style.display = 'block';
 }

 function updateFullIssueFormStatus(it) {
 const el = document.getElementById('issue-full-issue-status');
 if (!el) return;
 const name = document.getElementById('issue-full-issue-file')?.value?.trim();
 if (!name) { el.innerHTML = ''; return; }
 if (it && it.full_issue_file) {
  if (it.full_issue_exists) {
   el.innerHTML = `<span style="color:var(--success)">✓ Файл <code>${escapeIssueHtml(it.full_issue_file)}</code> найден в папке архива — кнопка на сайте активна.</span>`;
  } else if (it.full_issue_pending) {
   const folder = it.archive_folder ? escapeIssueHtml(it.archive_folder) : 'папка архива';
   el.innerHTML = `<span style="color:#b45309">⏳ Имя <code>${escapeIssueHtml(it.full_issue_file)}</code> сохранено — загрузите PDF через форму выше.</span>`;
  }
  return;
 }
 el.innerHTML = '<span style="color:var(--text-muted)">Выберите PDF и загрузите через сайт (кнопка ниже или «Сохранить выпуск»).</span>';
 }

 async function loadIssueArchiveFolders() {
 if (issueArchiveFoldersLoaded && issueArchiveFolders.length) return;
 try {
 issueArchiveFolders = await API.get('/admin/issues/archive-folders');
 issueArchiveFoldersLoaded = true;
 const dl = document.getElementById('issue-archive-folder-list');
 if (dl) {
 dl.innerHTML = issueArchiveFolders.map((f) => `<option value="${escapeIssueHtml(f)}">`).join('');
 }
 } catch {
 issueArchiveFolders = [];
 }
 }

 function formatCoverUploadError(e, file) {
  const msg = e && e.message ? e.message : String(e);
  if (msg === 'Failed to fetch' || /network|connection|reset|abort/i.test(msg)) {
   const kb = file && file.size ? Math.round(file.size / 1024) : 0;
   if (kb > 64) {
    return `Загрузка оборвалась (${kb} КБ). Nginx на сервере режет файлы больше ~64 КБ. Нужно IT: в конфиге nginx для muarrix.kiut.uz добавить client_max_body_size 50m; и перезагрузить nginx. Временно: сожмите обложку до JPG меньше 50 КБ (например squoosh.app).`;
   }
   return 'Соединение оборвалось (ERR_CONNECTION_RESET). Сожмите JPG до ~300 КБ, проверьте Wi‑Fi KIUT и попробуйте снова.';
  }
  return msg;
 }

 async function uploadIssueCover(issueId, file) {
 if (file.size > 3 * 1024 * 1024) {
 throw new Error('Файл больше 3 МБ — сожмите изображение');
 }
 const fd = new FormData();
 fd.append('cover', file);
 const token = Auth.getToken();
 const headers = {};
 if (token) headers.Authorization = 'Bearer ' + token;
 const ctrl = new AbortController();
 const timer = setTimeout(() => ctrl.abort(), 90000);
 let res;
 try {
 res = await fetch('/api/admin/issues/' + issueId + '/cover', {
 method: 'POST',
 headers,
 credentials: 'same-origin',
 body: fd,
 signal: ctrl.signal,
 });
 } catch (e) {
  if (e.name === 'AbortError') {
   throw new Error('Таймаут загрузки обложки (90 сек). Попробуйте файл поменьше или обновите страницу.');
  }
  throw new Error(formatCoverUploadError(e, file));
 } finally {
 clearTimeout(timer);
 }
 let data;
 try {
 data = await res.json();
 } catch {
 throw new Error('Сервер вернул неожиданный ответ при загрузке обложки (HTTP ' + res.status + ')');
 }
 if (!res.ok) throw new Error(data.error || 'Ошибка загрузки обложки');
 return data;
 }

 function formatFullIssueUploadError(e, file) {
  const msg = e && e.message ? e.message : String(e);
  if (msg === 'Failed to fetch' || /network|connection|reset|abort/i.test(msg)) {
   const mb = file && file.size ? (file.size / (1024 * 1024)).toFixed(1) : 0;
   return `Загрузка оборвалась (${mb} МБ). На сервере nginx должен разрешать большие файлы: client_max_body_size 50m; для muarrix.kiut.uz. Локально обычно работает сразу.`;
  }
  return msg;
 }

 async function uploadIssueFullPdf(issueId, file) {
 if (file.size > 50 * 1024 * 1024) {
 throw new Error('PDF больше 50 МБ');
 }
 const fd = new FormData();
 fd.append('pdf', file);
 const fileName = document.getElementById('issue-full-issue-file')?.value?.trim();
 if (fileName) fd.append('file_name', fileName);
 const token = Auth.getToken();
 const headers = {};
 if (token) headers.Authorization = 'Bearer ' + token;
 const ctrl = new AbortController();
 const timer = setTimeout(() => ctrl.abort(), 300000);
 let res;
 try {
 res = await fetch('/api/admin/issues/' + issueId + '/full-issue', {
 method: 'POST',
 headers,
 credentials: 'same-origin',
 body: fd,
 signal: ctrl.signal,
 });
 } catch (e) {
  if (e.name === 'AbortError') {
   throw new Error('Таймаут загрузки сборника (5 мин). Проверьте соединение.');
  }
  throw new Error(formatFullIssueUploadError(e, file));
 } finally {
 clearTimeout(timer);
 }
 let data;
 try {
 data = await res.json();
 } catch {
 throw new Error('Сервер вернул неожиданный ответ (HTTP ' + res.status + ')');
 }
 if (!res.ok) throw new Error(data.error || 'Ошибка загрузки сборника');
 if (data.full_issue_file) {
  document.getElementById('issue-full-issue-file').value = data.full_issue_file;
 }
 document.getElementById('issue-full-issue-pdf').value = '';
 return data;
 }

 async function uploadFullIssueOnly() {
 const id = document.getElementById('issue-edit-id').value.trim();
 const file = document.getElementById('issue-full-issue-pdf')?.files?.[0];
 if (!id) {
  showToast('Сначала сохраните выпуск (папка архива и обложка)', 'error');
  return;
 }
 if (!file) {
  showToast('Выберите PDF сборника', 'error');
  return;
 }
 try {
  const data = await uploadIssueFullPdf(id, file);
  showToast('Сборник загружен: ' + (data.full_issue_file || file.name), 'success');
  const issues = await API.get('/admin/issues');
  const it = issues.find((x) => String(x.id) === String(id));
  if (it) updateFullIssueFormStatus(it);
  loadIssuesTab();
 } catch (e) {
  showToast(e.message, 'error');
 }
 }

 document.getElementById('issue-cover-file')?.addEventListener('change', function () {
 const file = this.files && this.files[0];
 if (!file) return;
 setIssueCoverPreview(URL.createObjectURL(file));
 });

 async function loadIssuesTab() {
 const body = document.getElementById('issues-body');
 try {
 body.innerHTML = '<div class="empty-state"><div class="loader loader-dark"></div><p style="margin-top:12px;color:var(--text-muted)">Загрузка выпусков…</p></div>';
 loadIssueArchiveFolders().catch(() => {});
 const data = await API.get('/admin/issues');
 if (!data.length) {
 body.innerHTML = '<div class="empty-state"><div class="icon"></div><h3>Выпусков пока нет</h3><p>Создайте первый выпуск формой выше</p></div>';
 return;
 }
 body.innerHTML = `
 <table>
 <thead><tr><th>#</th><th>Обложка</th><th>Название выпуска</th><th>Архив</th><th>Сборник</th><th>Статьи</th><th>Дата</th><th>Приём</th><th>Сорт.</th><th></th></tr></thead>
 <tbody>${data.map((it, i) => `
 <tr>
 <td style="color:var(--text-muted)">${i + 1}</td>
 <td>${it.cover_image ? `<img src="${escapeIssueHtml(it.cover_image)}?t=${it.id}" alt="" onerror="this.outerHTML='<span style=\\'font-size:11px;color:var(--danger)\\'>нет</span>'" style="width:36px;height:48px;object-fit:cover;border-radius:4px;border:1px solid var(--border)">` : '<span style="font-size:11px;color:var(--danger)">нет</span>'}</td>
 <td style="font-size:13px;font-weight:600">${escapeIssueHtml(it.title)}</td>
 <td style="font-size:11px;color:var(--text-muted);max-width:140px;word-break:break-word">${it.archive_folder ? escapeIssueHtml(it.archive_folder) : '—'}</td>
 <td style="font-size:12px;text-align:center" title="${it.full_issue_file ? escapeIssueHtml(it.full_issue_file) : ''}">${!it.full_issue_file ? '—' : (it.full_issue_exists ? '<span style="color:var(--success);font-weight:700">✓</span>' : '<span style="color:#b45309" title="файл ещё не на сервере">⏳</span>')}</td>
 <td style="font-size:12px;text-align:center">${(it.submission_count || 0) > 0 ? `<span style="color:var(--danger);font-weight:600">${it.submission_count}</span>` : '0'}</td>
 <td style="font-size:12px">${it.issued_at? escapeIssueHtml(it.issued_at): '—'}</td>
 <td>${it.accepting_submissions? '<span class="status-badge status-approved">Открыт</span>': '<span class="status-badge status-pending">Закрыт</span>'}</td>
 <td style="text-align:center">${it.sort_order}</td>
 <td>
 <button type="button" class="btn btn-secondary btn-sm" onclick="editIssueRow(${it.id})">Изменить</button>
 <button type="button" class="btn btn-danger btn-sm" onclick="deleteIssueRow(${it.id})">Удалить</button>
 </td>
 </tr>`).join('')}
 </tbody>
 </table>`;
 } catch (err) {
 document.getElementById('issues-body').innerHTML = `<div class="alert alert-danger" style="margin:16px">${err.message}</div>`;
 }
 }

 async function editIssueRow(id) {
 try {
 const data = await API.get('/admin/issues');
 const it = data.find((x) => x.id === id);
 if (!it) return;
 document.getElementById('issue-edit-id').value = String(it.id);
 document.getElementById('issue-form-heading').textContent = 'Редактировать выпуск';
 document.getElementById('issue-title').value = it.title;
 document.getElementById('issue-desc').value = it.description || '';
 document.getElementById('issue-archive-folder').value = it.archive_folder || '';
 document.getElementById('issue-full-issue-file').value = it.full_issue_file || '';
 updateFullIssueFormStatus(it);
 document.getElementById('issue-existing-cover').value = it.cover_image || '';
 document.getElementById('issue-cover-file').value = '';
 setIssueCoverPreview(it.cover_image || '');
 document.getElementById('issue-issued-at').value = it.issued_at? String(it.issued_at).slice(0, 10): '';
 document.getElementById('issue-sort').value = String(it.sort_order?? 0);
 document.getElementById('issue-accepting').checked =!!it.accepting_submissions;
 window.scrollTo({ top: 0, behavior: 'smooth' });
 } catch (e) {
 showToast(e.message, 'error');
 }
 }

 function resetIssueForm() {
 document.getElementById('issue-edit-id').value = '';
 document.getElementById('issue-form-heading').textContent = 'Новый выпуск';
 document.getElementById('issue-title').value = '';
 document.getElementById('issue-desc').value = '';
 document.getElementById('issue-archive-folder').value = '';
 document.getElementById('issue-full-issue-file').value = '';
 document.getElementById('issue-full-issue-pdf').value = '';
 updateFullIssueFormStatus(null);
 document.getElementById('issue-existing-cover').value = '';
 document.getElementById('issue-cover-file').value = '';
 setIssueCoverPreview('');
 document.getElementById('issue-issued-at').value = '';
 document.getElementById('issue-sort').value = '0';
 document.getElementById('issue-accepting').checked = true;
 }

 async function saveIssueForm() {
 const saveBtn = document.getElementById('issue-save-btn');
 const id = document.getElementById('issue-edit-id').value.trim();
 const coverFile = document.getElementById('issue-cover-file').files[0];
 const fullIssuePdf = document.getElementById('issue-full-issue-pdf')?.files?.[0];
 const existingCover = document.getElementById('issue-existing-cover').value.trim();
 const payload = {
 journal: document.getElementById('issue-journal').value,
 title: document.getElementById('issue-title').value.trim(),
 description: document.getElementById('issue-desc').value.trim(),
 archive_folder: document.getElementById('issue-archive-folder').value.trim(),
 full_issue_file: document.getElementById('issue-full-issue-file').value.trim() || null,
 sort_order: parseInt(document.getElementById('issue-sort').value, 10) || 0,
 accepting_submissions: document.getElementById('issue-accepting').checked? '1': '0',
 issued_at: document.getElementById('issue-issued-at').value || null,
 };
 if (!payload.title) {
 showToast('Укажите название выпуска', 'error');
 return;
 }
 if (!payload.archive_folder) {
 showToast('Укажите «Папку в архиве» — без неё нельзя публиковать PDF', 'error');
 return;
 }
 if (!id && !coverFile) {
 showToast('Загрузите обложку выпуска', 'error');
 return;
 }
 if (id && !coverFile && !existingCover) {
 showToast('У выпуска должна быть обложка', 'error');
 return;
 }
 try {
 if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = (coverFile || fullIssuePdf) ? 'Загрузка файлов…' : 'Сохранение…'; }
 let issueId = id;
 if (id) await API.put('/admin/issues/' + id, payload);
 else {
 const created = await API.post('/admin/issues', payload);
 issueId = String(created.id);
 }
 if (coverFile) {
 const uploaded = await uploadIssueCover(issueId, coverFile);
 document.getElementById('issue-existing-cover').value = uploaded.cover_image || '';
 setIssueCoverPreview(uploaded.cover_image || '');
 document.getElementById('issue-cover-file').value = '';
 document.getElementById('issue-edit-id').value = issueId;
 }
 if (fullIssuePdf) {
  if (saveBtn) saveBtn.textContent = 'Загрузка сборника…';
  await uploadIssueFullPdf(issueId, fullIssuePdf);
 }
 showToast('Выпуск сохранён', 'success');
 resetIssueForm();
 loadIssuesTab();
 } catch (e) {
 showToast(e.message || 'Ошибка', 'error');
 } finally {
 if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Сохранить выпуск'; }
 }
 }

 async function deleteIssueRow(id) {
 let it;
 try {
  const issues = await API.get('/admin/issues');
  it = issues.find((x) => Number(x.id) === Number(id));
 } catch (e) {
  showToast(e.message || 'Ошибка', 'error');
  return;
 }
 if (!it) {
  showToast('Выпуск не найден — обновляю список', 'info');
  loadIssuesTab();
  return;
 }

 const issueTitle = it.title || ('№' + id);
 const count = Number(it.submission_count) || 0;

 async function doDelete(force) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = 'Bearer ' + token;
  const url = force
   ? '/api/admin/issues/' + id + '/force-delete'
   : '/api/admin/issues/' + id;
  const res = await fetch(url, {
   method: force ? 'POST' : 'DELETE',
   headers,
   credentials: 'same-origin',
   body: force ? '{}' : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) {
   const err = new Error(data.error || ('Ошибка ' + res.status));
   err.canForceDelete = !!data.canForceDelete;
   err.articleCount = data.articleCount;
   throw err;
  }
  return data;
 }

 if (count > 0) {
  const msg =
   'Выпуск «' + issueTitle + '» содержит ' + count + ' статей.\n\n' +
   'Удалить выпуск принудительно?\n' +
   '• Статьи останутся в «Все статьи», но без привязки к выпуску\n' +
   '• Запись сохранится в «Мониторинг → Журнал действий администратора»';
  if (!confirm(msg)) return;
  if (!confirm('Последнее подтверждение: удалить выпуск «' + issueTitle + '»?')) return;
  try {
   const r = await doDelete(true);
   showToast('Выпуск удалён' + (r.unlinkedArticles ? ' (отвязано статей: ' + r.unlinkedArticles + ')' : ''), 'success');
   if (String(document.getElementById('issue-edit-id').value) === String(id)) resetIssueForm();
   loadIssuesTab();
  } catch (e) {
   showToast(e.message || 'Ошибка', 'error');
  }
  return;
 }

 if (!confirm('Удалить выпуск «' + issueTitle + '»?')) return;
 try {
  await doDelete(false);
  showToast('Выпуск удалён', 'success');
  if (String(document.getElementById('issue-edit-id').value) === String(id)) resetIssueForm();
  loadIssuesTab();
 } catch (e) {
  if (e.canForceDelete) {
   const n = e.articleCount || count || '?';
   if (!confirm('К выпуску привязаны статьи (' + n + '). Удалить принудительно?')) return;
   if (!confirm('Подтвердите удаление выпуска «' + issueTitle + '»')) return;
   try {
    const r = await doDelete(true);
    showToast('Выпуск удалён (отвязано статей: ' + (r.unlinkedArticles || n) + ')', 'success');
    if (String(document.getElementById('issue-edit-id').value) === String(id)) resetIssueForm();
    loadIssuesTab();
   } catch (e2) {
    showToast(e2.message || 'Ошибка', 'error');
   }
   return;
  }
  showToast(e.message || 'Ошибка', 'error');
 }
 }

 async function deleteAllUnusedIssues() {
 if (!confirm('Удалить ВСЕ выпуски без статей? Запись сохранится в журнале действий администратора.')) return;
 try {
 const r = await API.delete('/admin/issues/bulk-unused');
 showToast(`Удалено выпусков: ${r.deleted || 0}`, 'success');
 resetIssueForm();
 loadIssuesTab();
 } catch (e) {
 showToast(e.message || 'Ошибка', 'error');
 }
 }

 // ===== PROFILE =====
 async function loadProfile() {
 try {
 const me = await API.get('/auth/me');
 document.getElementById('profile-name').textContent = me.full_name;
 document.getElementById('profile-email').textContent = me.email;
 document.getElementById('profile-created').textContent = formatDate(me.created_at);

 const stats = await API.get('/admin/stats');
 document.getElementById('my-reviewed').textContent = stats.approved + stats.rejected;
 document.getElementById('my-approved').textContent = stats.approved;
 document.getElementById('my-rejected-stat').textContent = stats.rejected;
 document.getElementById('my-pending-stat').textContent = stats.pending;
 } catch(err) {}
 }

 async function changePassword() {
 const alertBox = document.getElementById('pwd-alert');
 const cur = document.getElementById('cur-pwd').value;
 const nw = document.getElementById('new-pwd').value;
 const nw2 = document.getElementById('new-pwd2').value;
 alertBox.innerHTML = '';
 if (nw!== nw2) { alertBox.innerHTML = '<div class="alert alert-danger"> Пароли не совпадают</div>'; return; }
 try {
 await API.put('/admin/change-password', { current_password: cur, new_password: nw });
 alertBox.innerHTML = '<div class="alert alert-success"> Пароль успешно изменён</div>';
 document.getElementById('cur-pwd').value = '';
 document.getElementById('new-pwd').value = '';
 document.getElementById('new-pwd2').value = '';
 } catch(err) { alertBox.innerHTML = `<div class="alert alert-danger"> ${err.message}</div>`; }
 }

 // ===== USER DETAIL MODAL =====
 async function openUserDetail(userId) {
 openModal('user-detail-modal');
 document.getElementById('user-detail-body').innerHTML = '<div class="empty-state" style="padding:24px"><div class="loader loader-dark"></div></div>';
 try {
 const { user, submissions } = await API.get(`/admin/users/${userId}/submissions`);
 document.getElementById('user-detail-title').textContent = escHtml(user.full_name);
 const bannedTag = user.is_banned? '<span style="background:#fee2e2;color:#b91c1c;font-size:11px;padding:2px 8px;border-radius:8px;margin-left:8px">заблокирован</span>': '';
 document.getElementById('user-detail-body').innerHTML = `
 <div style="padding:16px 20px;background:#f8f9fa;border-bottom:1px solid var(--border);margin-bottom:0">
 <div style="font-size:14px"><strong>Email:</strong> ${escHtml(user.email)}</div>
 <div style="font-size:13px;color:var(--text-muted);margin-top:4px"><strong>Зарегистрирован:</strong> ${formatDate(user.created_at)} ${bannedTag}</div>
 ${user.role!== 'admin'
? `<button class="btn btn-secondary btn-sm" style="font-size:12px" onclick="resetUserPasswordPrompt(${user.id})">Сбросить пароль</button>`
+ (submissions.length === 0
? `<button class="btn btn-danger btn-sm" style="font-size:12px" onclick="deleteUser(${user.id});closeModal('user-detail-modal')">Удалить пользователя</button>`
: '')
+ (user.is_banned
? `<button class="btn btn-secondary btn-sm" style="margin-top:10px;font-size:12px" onclick="unbanUser(${user.id});closeModal('user-detail-modal');loadUsers()">Разблокировать</button>`
: `<button class="btn btn-danger btn-sm" style="margin-top:10px;font-size:12px" onclick="banUserFromList(${user.id});closeModal('user-detail-modal')">Заблокировать аккаунт</button>`)
: ''}
 </div>
 <div style="padding:16px 20px">
 <h4 style="margin-bottom:12px;font-size:14px">Статьи (${submissions.length})</h4>
 ${!submissions.length
? '<p style="color:var(--text-muted)">Статей нет</p>'
: submissions.map(s => `
 <div style="padding:10px 0;border-bottom:1px solid #f0f0f0">
 <div style="font-weight:600;font-size:13px">${escHtml(s.title)}</div>
 <div style="font-size:11px;color:var(--text-muted);margin-top:3px">
 ${journalName(s.journal)} · ${statusBadge(s.status)} · ${formatDate(s.submitted_at)}
 </div>
 ${s.admin_note? `<div style="font-size:11px;color:#666;margin-top:3px">Примечание: ${escHtml(s.admin_note)}</div>`: ''}
 </div>`).join('')}
 </div>`;
 } catch(e) {
 document.getElementById('user-detail-body').innerHTML = `<div class="alert alert-danger" style="margin:16px">${e.message}</div>`;
 }
 }

 // ===== EMAIL TEST =====
 async function testEmail() {
 const box = document.getElementById('email-test-result');
 box.innerHTML = '<div style="color:var(--text-muted);font-size:13px">Отправка…</div>';
 try {
 const r = await API.post('/admin/test-email', {});
 box.innerHTML = r.success
? '<div class="alert alert-success" style="margin-bottom:12px"> Письмо отправлено успешно! Проверьте почту администратора.</div>'
: `<div class="alert alert-danger" style="margin-bottom:12px"> Ошибка: ${escHtml(r.error)}</div>`;
 } catch(e) {
 box.innerHTML = `<div class="alert alert-danger" style="margin-bottom:12px"> ${escHtml(e.message)}</div>`;
 }
 }

 // ===== AUDIT LOG =====
 const auditActionLabels = {
 approve_submission: ' Одобрил статью',
 reject_submission: ' Отклонил статью',
 bulk_approve: ' Массовое одобрение',
 bulk_reject: ' Массовое отклонение',
 export_csv: '⬇ Экспорт CSV',
 test_email: ' Тест email',
 download_backup: ' Скачал backup',
 change_password: ' Смена пароля',
 delete_issue: ' Удалён выпуск',
 delete_issue_force: ' Принудительно удалён выпуск',
 delete_issues_bulk_unused: ' Массовое удаление выпусков без статей',
 quick_publish: ' Быстрая публикация PDF',
 change_role: ' Смена роли',
 create_user: ' Создан пользователь',
 };

 function formatAuditDetails(action, details) {
  if (!details) return '—';
  try {
   const d = JSON.parse(details);
   if (action === 'delete_issue' || action === 'delete_issue_force') {
    const lines = [
     '«' + (d.issueTitle || '—') + '»',
     'статей: ' + (d.articleCount ?? 0),
    ];
    if (d.archive_folder) lines.push('архив: ' + d.archive_folder);
    if (d.articles && d.articles.length) {
     lines.push('статьи: ' + d.articles.slice(0, 5).map((a) => a.title).join('; ') + (d.articles.length > 5 ? '…' : ''));
    }
    return lines.join(' · ');
   }
   if (action === 'delete_issues_bulk_unused' && d.issues) {
    return 'удалено: ' + d.deleted + ' · ' + d.issues.map((i) => i.title).slice(0, 4).join('; ') + (d.issues.length > 4 ? '…' : '');
   }
  } catch { /* plain text */ }
  return details;
 }

 async function loadAuditLog() {
 const tbody = document.getElementById('audit-log-body');
 try {
 const rows = await API.get('/admin/audit-log');
 if (!rows.length) {
 tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:20px">Записей нет</td></tr>';
 return;
 }
 tbody.innerHTML = rows.map(r => `
 <tr>
 <td style="font-size:12px;white-space:nowrap">${new Date(r.created_at).toLocaleString('ru-RU')}</td>
 <td style="font-size:12px">${escHtml(r.admin_name || r.admin_email || '—')}</td>
 <td style="font-size:13px">${auditActionLabels[r.action] || escHtml(r.action)}</td>
 <td style="font-size:12px;color:var(--text-muted);max-width:420px;word-break:break-word">${escHtml(formatAuditDetails(r.action, r.details))}</td>
 </tr>`).join('');
 } catch(e) {
 tbody.innerHTML = `<tr><td colspan="4" class="alert alert-danger">${e.message}</td></tr>`;
 }
 }

 // ===== SECURITY =====
 const secEventLabels = {
 failed_login: ' Неверный пароль',
 register_attempt: ' Попытка регистрации',
 auto_banned: ' Авто-бан',
 manual_ban: ' Ручной бан',
 ban_lifted: ' Бан снят',
 blocked_request: ' Запрос заблокирован',
 user_banned: ' Аккаунт заблокирован',
 user_unbanned: ' Аккаунт разблокирован',
 };

 async function loadSecurity() {
 await Promise.all([loadSecurityStats(), loadIpBans(), loadBannedUsers(), loadSecurityEvents(), loadAuditLog()]);
 }

 async function loadSecurityStats() {
 try {
 const s = await API.get('/admin/security/stats');
 document.getElementById('sec-active-bans').textContent = s.activeBans;
 document.getElementById('sec-banned-users').textContent = s.bannedUsers;
 document.getElementById('sec-events-today').textContent = s.eventsToday;
 document.getElementById('sec-autoban-today').textContent = s.autobanToday;
 const badge = document.getElementById('security-badge');
 if (s.activeBans > 0 || s.bannedUsers > 0) {
 badge.style.display = 'inline';
 badge.textContent = s.activeBans + s.bannedUsers;
 } else {
 badge.style.display = 'none';
 }
 } catch(e) { console.error(e); }
 }

 async function loadIpBans() {
 const body = document.getElementById('ip-bans-body');
 try {
 const bans = await API.get('/admin/security/bans');
 const active = bans.filter(b => b.is_active);
 const inactive = bans.filter(b =>!b.is_active);
 const all = [...active,...inactive];
 if (!all.length) {
 body.innerHTML = '<div class="empty-state" style="padding:24px"><p>Нет заблокированных IP</p></div>';
 return;
 }
 body.innerHTML = all.map(b => {
 const d = new Date(b.banned_at).toLocaleString('ru-RU');
 const autoTag = b.is_auto? '<span style="font-size:10px;background:#fef3c7;color:#92400e;padding:1px 6px;border-radius:8px">авто</span>': '<span style="font-size:10px;background:#dbeafe;color:#1e40af;padding:1px 6px;border-radius:8px">ручной</span>';
 const active = b.is_active;
 return `<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 14px;border-bottom:1px solid #f0f0f0;${!active?'opacity:0.5':''}">
 <div style="flex:1;min-width:0">
 <div style="font-weight:700;font-size:13px;font-family:monospace">${escHtml(b.ip)}</div>
 <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${d} ${autoTag}</div>
 ${b.reason? `<div style="font-size:11px;color:#666;margin-top:2px">${escHtml(b.reason)}</div>`: ''}
 </div>
 ${active
? `<button class="btn btn-secondary btn-sm" style="flex-shrink:0;font-size:11px" onclick="liftIpBan(${b.id})">Снять бан</button>`
: `<span style="font-size:11px;color:var(--text-muted)">Снят</span>`}
 </div>`;
 }).join('');
 } catch(e) {
 body.innerHTML = `<div class="alert alert-danger" style="margin:12px">${e.message}</div>`;
 }
 }

 async function loadBannedUsers() {
 const body = document.getElementById('banned-users-body');
 try {
 const users = await API.get('/admin/security/users/banned');
 if (!users.length) {
 body.innerHTML = '<div class="empty-state" style="padding:24px"><p>Нет заблокированных аккаунтов</p></div>';
 return;
 }
 body.innerHTML = users.map(u => `
 <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid #f0f0f0">
 <div style="flex:1;min-width:0">
 <div style="font-weight:600;font-size:13px">${escHtml(u.full_name)}</div>
 <div style="font-size:11px;color:var(--text-muted)">${escHtml(u.email)}</div>
 </div>
 <button class="btn btn-secondary btn-sm" style="font-size:11px" onclick="unbanUser(${u.id})">Разблокировать</button>
 </div>`).join('');
 } catch(e) {
 body.innerHTML = `<div class="alert alert-danger" style="margin:12px">${e.message}</div>`;
 }
 }

 async function loadSecurityEvents() {
 const tbody = document.getElementById('sec-events-body');
 const type = document.getElementById('sec-event-type').value;
 const ip = document.getElementById('sec-event-ip').value.trim();
 try {
 let url = '/admin/security/events?';
 if (type && type!== 'all') url += `type=${encodeURIComponent(type)}&`;
 if (ip) url += `ip=${encodeURIComponent(ip)}`;
 const events = await API.get(url);
 if (!events.length) {
 tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:20px">Событий не найдено</td></tr>';
 return;
 }
 tbody.innerHTML = events.map(e => {
 const label = secEventLabels[e.event_type] || e.event_type;
 const isAlert = ['auto_banned','blocked_request','failed_login'].includes(e.event_type);
 return `<tr style="${isAlert? 'background:#fff5f5': ''}">
 <td style="font-size:12px;white-space:nowrap">${new Date(e.created_at).toLocaleString('ru-RU')}</td>
 <td style="font-family:monospace;font-size:12px">${escHtml(e.ip)}</td>
 <td style="font-size:12px">${label}</td>
 <td style="font-size:12px;color:var(--text-muted)">${e.details? escHtml(e.details): '—'}</td>
 <td style="font-size:12px">${e.user_email? escHtml(e.user_email): '—'}</td>
 </tr>`;
 }).join('');
 } catch(e) {
 tbody.innerHTML = `<tr><td colspan="5" class="alert alert-danger">${e.message}</td></tr>`;
 }
 }

 async function manualBanIp() {
 const ip = document.getElementById('ban-ip-input').value.trim();
 const reason = document.getElementById('ban-reason-input').value.trim();
 if (!ip) { showToast('Укажите IP-адрес', 'error'); return; }
 try {
 await API.post('/admin/security/bans', { ip, reason });
 showToast(`IP ${ip} заблокирован`, 'success');
 document.getElementById('ban-ip-input').value = '';
 document.getElementById('ban-reason-input').value = '';
 document.getElementById('manual-ban-form').style.display = 'none';
 loadSecurity();
 } catch(e) { showToast(e.message, 'error'); }
 }

 async function liftIpBan(id) {
 if (!confirm('Снять блокировку с этого IP?')) return;
 try {
 await API.delete('/admin/security/bans/' + id);
 showToast('Бан снят', 'success');
 loadSecurity();
 } catch(e) { showToast(e.message, 'error'); }
 }

 async function unbanUser(id) {
 if (!confirm('Разблокировать этот аккаунт?')) return;
 try {
 await API.post('/admin/security/users/' + id + '/unban', {});
 showToast('Аккаунт разблокирован', 'success');
 loadSecurity();
 } catch(e) { showToast(e.message, 'error'); }
 }

 async function resetUserPassword(userId, newPassword) {
 try {
  await API.put(`/admin/users/${userId}/password`, { new_password: newPassword });
  showToast('Пароль изменён', 'success');
 } catch (e) { showToast(e.message, 'error'); }
 }

 function resetUserPasswordPrompt(userId) {
 const pwd = prompt('Новый пароль (минимум 8 символов, буквы и цифры):');
 if (!pwd) return;
 if (pwd.length < 8) { showToast('Пароль слишком короткий', 'error'); return; }
 resetUserPassword(userId, pwd);
 }

 async function deleteUser(userId) {
 if (!confirm('Удалить пользователя без статей? Это действие нельзя отменить.')) return;
 try {
  await API.delete(`/admin/users/${userId}`);
  showToast('Пользователь удалён', 'success');
  loadUsers();
  loadDashboard();
 } catch (e) { showToast(e.message, 'error'); }
 }

 async function banUserFromList(id) {
 if (!confirm('Заблокировать этот аккаунт? Пользователь не сможет войти.')) return;
 try {
 await API.post('/admin/security/users/' + id + '/ban', {});
 showToast('Аккаунт заблокирован', 'success');
 loadUsers();
 } catch(e) { showToast(e.message, 'error'); }
 }

 // Helper: escape HTML for safe DOM injection
 function escHtml(str) {
 return String(str?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 }

 // Init
 async function bootstrapAdminPage() {
 await ensureServerSession();
 const user = (await refreshUserFromServer()) || Auth.getUser();
 if (user) {
 const initials = user.full_name.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
 document.getElementById('sb-name').textContent = user.full_name;
 document.getElementById('sb-email').textContent = user.email;
 document.querySelector('.admin-avatar').textContent = initials;
 document.getElementById('profile-avatar').textContent = initials;
 document.getElementById('profile-name').textContent = user.full_name;
 document.getElementById('profile-email').textContent = user.email;
 }
 loadDashboard();
 try {
 const s = await API.get('/admin/security/stats');
 const badge = document.getElementById('security-badge');
 const total = s.activeBans + s.bannedUsers;
 if (total > 0) { badge.style.display = 'inline'; badge.textContent = total; }
 } catch(e) {}
 }
 bootstrapAdminPage();
