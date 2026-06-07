// ===== MAIL CONFIG & WRAPPERS =====
const mailConfig = {
  idPrefix: 'm',
  store: mailStore,
  selectors: {
    sidebar: '#mail-sidebar-inner',
    list: '#mail-list-pane',
    preview: '#mail-preview-pane',
    status: '#mail-status',
    search: '#mail-search',
    varList: '#mail-var-list',
    varInput: '.mail-var-input'
  },
  templates: {
    variables: 'tpl-mail-variables'
  },
  categoryIcons: {
    'All': '📬',
    'Personal': '👤',
    'Work': '💼'
  },
  categories: {
    get: () => mailStore.categories()
  },
  fields: {
    category: { id: 'mail-edit-category' },
    title: { id: 'mail-edit-title', placeholder: 'e.g. Meeting Request' },
    subject: { id: 'mail-edit-subject', placeholder: 'e.g. Request for Meeting — [Topic]' },
    body: {
      id: 'mail-edit-body',
      placeholder: 'Dear [Name],\n\n...',
      label: 'Body',
      note: '— use [Name], [Date], etc. as placeholders',
      class: 'mail-editor-body'
    }
  },
  messages: {
    copied: '📋 Copied to clipboard! Paste into Outlook.',
    countSuffix: ' template(s)'
  },
  placeholders: {
    preview: '<div class="mail-preview-placeholder">Select a template to preview, or click <b>New</b> to create one.</div>'
  },
  callbacks: {
    selectFolder: 'mailSelectFolder',
    selectItem: 'mailSelect',
    save: 'mailSave',
    cancelEdit: 'mailCancelEdit'
  },
  formatCopyText: (item, vars) => {
    let subject = item.subject;
    let body = item.body;
    for (const [key, val] of Object.entries(vars)) {
      const re = new RegExp('\\[' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\]', 'g');
      subject = subject.replace(re, val);
      body = body.replace(re, val);
    }
    const cp = controlPanelStore.getAll();
    if (cp.mailSig) {
      body += '\n\n' + cp.mailSig;
    }
    return 'Subject: ' + subject + '\n\n' + body;
  }
};

function initMailApp(winId, el) { TemplateManager.init('mail', winId, el, mailConfig); }
function mailSelectFolder(e, folder) { TemplateManager.selectFolder(e, folder); }
function mailSelect(e, id) { TemplateManager.selectItem(e, id); }
function mailNew() { TemplateManager.new(); }
function mailEdit() { TemplateManager.edit(); }
function mailSave() { TemplateManager.save(); }
function mailCancelEdit() { TemplateManager.cancelEdit(); }
function mailDelete() { TemplateManager.delete(); }
function mailCopy() { TemplateManager.copy(); }
function mailVarCancel() { TemplateManager.varCancel(); }
function mailVarCopy() { TemplateManager.varCopy(); }
function mailSearch() {
  const { winId } = getAppStateAndEl();
  if (!winId) return;
  const stateObj = state.windows[winId]?.appState;
  if (!stateObj) return;
  stateObj.activeId = null;
  stateObj.editing = false;
  TemplateManager.renderList(winId);
  TemplateManager.showPlaceholder(winId);
}

// Custom categories management inside Mail Adapter wrapper
function mailManageCategories() {
  const { el } = getAppStateAndEl();
  if (!el) return;
  const pane = el.querySelector('#mail-preview-pane');
  const tpl = document.getElementById('tpl-mail-categories');
  const clone = tpl.content.firstElementChild.cloneNode(true);
  pane.innerHTML = '';
  pane.appendChild(clone);
  renderMailCatList(el);
}

function renderMailCatList(winIdOrEl) {
  const { el } = getAppStateAndEl(winIdOrEl);
  if (!el) return;
  const list = el.querySelector('#mail-cat-list');
  const lockedCats = ['Personal', 'Work'];
  const customCats = mailStore.customCategories();
  let html = '';
  customCats.forEach(cat => {
    html += '<div class="mail-cat-item"><span>' + escapeHtml(cat) + '</span><button class="mail-cat-remove-btn" onclick="mailCatRemove(event,\'' + cat + '\')">✕</button></div>';
  });
  lockedCats.forEach(cat => {
    html += '<div class="mail-cat-item locked"><span>' + escapeHtml(cat) + ' 🔒</span><button class="mail-cat-remove-btn" disabled>✕</button></div>';
  });
  list.innerHTML = html || '<div style="padding:4px;color:#808080;">No custom categories.</div>';
}

function mailCatAdd(e) {
  const { el, winId } = getAppStateAndEl(e ? e.target : null);
  if (!el) return;
  const input = el.querySelector('#mail-cat-new-input');
  if (!input) return;
  const name = input.value.trim();
  if (!name) return;
  const locked = ['Personal', 'Work'];
  if (locked.includes(name)) { alert('"' + name + '" is a protected category.'); return; }
  const success = mailStore.addCategory(name);
  if (!success) { alert('Category "' + name + '" already exists.'); return; }
  input.value = '';
  renderMailCatList(el);
}

function mailCatRemove(e, name) {
  if (!confirm('Remove category "' + name + '" and re-assign its templates to "Personal"?')) return;
  mailStore.deleteCategory(name);
  const { el, winId } = getAppStateAndEl(e ? e.target : null);
  if (!el) return;
  const res = TemplateManager.getState(winId);
  if (res) {
    res.tState.activeFolder = 'All';
    res.tState.activeId = null;
    TemplateManager.renderFolders(winId);
    TemplateManager.renderList(winId);
    TemplateManager.showPlaceholder(winId);
  }
  const pane = el.querySelector('#mail-preview-pane');
  if (pane && pane.querySelector('.mail-cat-dialog')) {
    renderMailCatList(el);
  }
}

function mailCatSave() {
  const { winId } = getAppStateAndEl();
  if (!winId) return;
  const res = TemplateManager.getState(winId);
  if (!res) return;
  res.tState.activeFolder = 'All';
  res.tState.activeId = null;
  res.tState.editing = false;
  TemplateManager.renderFolders(winId);
  TemplateManager.renderList(winId);
  TemplateManager.showPlaceholder(winId);
  TemplateManager.updateStatus(winId);
}
