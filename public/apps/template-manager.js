// Template list/editor shared by mail.js and clippy.js
// ===== TEMPLATE MANAGER SYSTEM (v2.0 Refactor) =====

const TemplateManager = {
  init(app, winId, el, config) {
    state.windows[winId].appState = {
      app,
      activeFolder: 'All',
      activeId: null,
      editing: false,
      varId: null,
      varData: {}
    };
    this._bindTemplateEvents(winId, el, config);
    this.renderFolders(winId);
    this.renderList(winId);
    this.showPlaceholder(winId);
    this.updateStatus(winId);
  },

  _bindTemplateEvents(winId, el, config) {
    const sidebar = el.querySelector(config.selectors.sidebar);
    const listPane = el.querySelector(config.selectors.list);
    if (sidebar && !sidebar.dataset.tmBound) {
      sidebar.dataset.tmBound = '1';
      sidebar.addEventListener('click', (e) => {
        const folderEl = e.target.closest('.mail-folder');
        if (!folderEl || !folderEl.dataset.folder) return;
        TemplateManager.selectFolder(winId, folderEl.dataset.folder);
      });
    }
    if (listPane && !listPane.dataset.tmBound) {
      listPane.dataset.tmBound = '1';
      listPane.addEventListener('click', (e) => {
        const itemEl = e.target.closest('.mail-list-item');
        if (!itemEl || !itemEl.dataset.id) return;
        TemplateManager.selectItem(winId, itemEl.dataset.id);
      });
    }
  },

  getState(winIdOrEl) {
    const { state: tState, el, winId } = getAppStateAndEl(winIdOrEl);
    if (!tState || !tState.app) return null;
    const config = tState.app === 'mail' ? mailConfig : clippyConfig;
    return { tState, el, winId, app: tState.app, config };
  },

  getItems(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return [];
    return res.config.store.all() || [];
  },

  getItem(winIdOrEl, id) {
    const res = this.getState(winIdOrEl);
    if (!res) return null;
    return res.config.store.get(id);
  },

  getCount(winIdOrEl, folder) {
    const items = this.getItems(winIdOrEl);
    if (!folder || folder === 'All') return items.length;
    return items.filter(item => item.category === folder).length;
  },

  getFilteredItems(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return [];
    const { tState, el, config } = res;
    let items = config.store.all() || [];
    if (tState.activeFolder !== 'All') {
      items = items.filter(item => item.category === tState.activeFolder);
    }
    const searchEl = el.querySelector(config.selectors.search);
    if (searchEl) {
      const q = searchEl.value.toLowerCase().trim();
      if (q) {
        items = items.filter(item =>
          item.title.toLowerCase().includes(q) ||
          (item.subject && item.subject.toLowerCase().includes(q)) ||
          item.body.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }
    }
    return items;
  },

  renderFolders(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, el, config, winId } = res;
    const sidebar = el.querySelector(config.selectors.sidebar);
    if (!sidebar) return;
    const cats = config.categories.get();
    let html = '';
    cats.forEach(cat => {
      const count = this.getCount(winId, cat);
      const active = tState.activeFolder === cat ? ' active' : '';
      const icon = config.categoryIcons[cat] || '📁';
      html += '<div class="mail-folder' + active + '" data-folder="' + escapeHtml(cat) + '">';
      html += '<span class="mail-folder-icon">' + icon + '</span>';
      html += cat;
      html += '<span class="mail-folder-count">' + count + '</span>';
      html += '</div>';
    });
    sidebar.innerHTML = html;
  },

  selectFolder(winIdOrEl, folder) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, el, config, winId } = res;
    tState.activeId = null;
    tState.editing = false;
    tState.activeFolder = folder;
    this.renderFolders(winId);
    this.renderList(winId);
    this.showPlaceholder(winId);
    const searchEl = el.querySelector(config.selectors.search);
    if (searchEl) searchEl.value = '';
    this.updateStatus(winId);
  },

  renderList(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, el, config, winId } = res;
    const pane = el.querySelector(config.selectors.list);
    if (!pane) return;
    const items = this.getFilteredItems(winId);
    if (items.length === 0) {
      pane.innerHTML = '<div class="mail-list-empty">No templates found.</div>';
      return;
    }
    let html = '';
    items.forEach(item => {
      const active = item.id === tState.activeId ? ' active' : '';
      html += '<div class="mail-list-item' + active + '" data-id="' + escapeHtml(item.id) + '">';
      html += '<div class="mail-list-item-subject">' + escapeHtml(item.title) + '</div>';
      html += '<div class="mail-list-item-meta">';
      html += '<span>' + item.category + '</span>';
      html += '<span>' + formatMailDate(item.updated) + '</span>';
      html += '</div></div>';
    });
    pane.innerHTML = html;
  },

  selectItem(winIdOrEl, id) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, winId } = res;
    tState.activeId = id;
    tState.editing = false;
    this.renderList(winId);
    this.renderPreview(winId);
  },

  renderPreview(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, el, config, winId } = res;
    const pane = el.querySelector(config.selectors.preview);
    if (!pane) return;
    const item = this.getItem(winId, tState.activeId);
    if (!item) {
      this.showPlaceholder(winId);
      return;
    }
    const vars = extractVariables((item.subject || '') + ' ' + item.body);
    if (config.customPreview) {
      config.customPreview(pane, item, vars);
    } else {
      pane.innerHTML =
        '<div class="mail-preview-content">' +
        '<span class="mail-preview-category">' + item.category + '</span>' +
        (item.subject ? '<div class="mail-preview-subject">' + escapeHtml(item.subject) + '</div>' : '') +
        '<div class="mail-preview-body">' + escapeHtml(item.body) + '</div>' +
        (vars.length > 0 ? '<div style="margin-top:8px;font-size:10px;color:#808080;">Variables: ' + vars.map(v => '[' + v + ']').join(', ') + '</div>' : '') +
        '</div>';
    }
  },

  showPlaceholder(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { el, config } = res;
    const pane = el.querySelector(config.selectors.preview);
    if (!pane) return;
    if (config.customPlaceholder) {
      config.customPlaceholder(pane);
    } else {
      pane.innerHTML = config.placeholders.preview;
    }
  },

  new(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, el, config, winId } = res;
    tState.activeId = null;
    tState.editing = true;
    this.renderList(winId);
    this.renderEditor(winId, null);
    el.querySelector(config.selectors.status).textContent = 'Creating new template...';
  },

  edit(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, el, config, winId } = res;
    if (!tState.activeId) return;
    const item = this.getItem(winId, tState.activeId);
    if (!item) return;
    tState.editing = true;
    this.renderEditor(winId, item);
    el.querySelector(config.selectors.status).textContent = 'Editing: ' + item.title;
  },

  renderEditor(winIdOrEl, item) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { el, config, winId } = res;
    const pane = el.querySelector(config.selectors.preview);
    if (!pane) return;
    if (config.customEditor) {
      config.customEditor(pane, item);
    } else {
      const cats = config.categories.get().filter(c => c !== 'All');
      const categoryOptions = cats.map(c => '<option value="' + c + '"' + (item && item.category === c ? ' selected' : '') + '>' + c + '</option>').join('');
      let html = '<div class="mail-editor-form">';
      html += '<label>Category</label>';
      html += '<select class="mail-editor-category-select" id="' + config.fields.category.id + '">';
      html += categoryOptions;
      html += '</select>';
      if (config.fields.subject) {
        html += '<label>Subject Line</label>';
        html += '<input class="win95-input" id="' + config.fields.subject.id + '" placeholder="' + config.fields.subject.placeholder + '" value="' + (item ? escapeHtml(item.subject) : '') + '">';
      }
      html += '<label>Template Title</label>';
      html += '<input class="win95-input" id="' + config.fields.title.id + '" placeholder="' + config.fields.title.placeholder + '" value="' + (item ? escapeHtml(item.title) : '') + '">';
      html += '<label>' + config.fields.body.label + ' <span style="font-weight:normal;color:#808080;">' + config.fields.body.note + '</span></label>';
      html += '<textarea class="' + config.fields.body.class + '" id="' + config.fields.body.id + '" placeholder="' + config.fields.body.placeholder + '">' + (item ? escapeHtml(item.body) : '') + '</textarea>';
      html += '<div class="mail-editor-buttons">';
      html += '<button class="win95-button" onclick="' + config.callbacks.save + '()" style="font-weight:bold;">💾 Save</button>';
      html += '<button class="win95-button" onclick="' + config.callbacks.cancelEdit + '()">Cancel</button>';
      html += '</div></div>';
      pane.innerHTML = html;
    }
  },

  save(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, el, config, winId } = res;
    const category = el.querySelector('#' + config.fields.category.id)?.value || 'Personal';
    const title = el.querySelector('#' + config.fields.title.id)?.value?.trim() || 'Untitled';
    const subject = config.fields.subject ? el.querySelector('#' + config.fields.subject.id)?.value?.trim() || '' : '';
    const body = el.querySelector('#' + config.fields.body.id)?.value?.trim() || '';
    const data = { category, title, body };
    if (config.fields.subject) data.subject = subject;
    
    if (tState.activeId) {
      config.store.update(tState.activeId, data);
    } else {
      const newItem = config.store.add(data);
      tState.activeId = newItem.id;
    }
    tState.editing = false;
    this.renderFolders(winId);
    this.renderList(winId);
    this.renderPreview(winId);
    el.querySelector(config.selectors.status).textContent = 'Saved: ' + title;
  },

  cancelEdit(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, winId } = res;
    tState.editing = false;
    if (tState.activeId) this.renderPreview(winId);
    else this.showPlaceholder(winId);
    this.renderList(winId);
    this.updateStatus(winId);
  },

  delete(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, config, winId } = res;
    if (!tState.activeId) return;
    const item = this.getItem(winId, tState.activeId);
    if (!item) return;
    if (!confirm('Delete template "' + item.title + '"?')) return;
    config.store.remove(tState.activeId);
    tState.activeId = null;
    this.renderFolders(winId);
    this.renderList(winId);
    this.showPlaceholder(winId);
    this.updateStatus(winId);
  },

  copy(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, config, winId } = res;
    if (tState.editing) {
      alert("Please save or cancel your changes before copying.");
      return;
    }
    if (!tState.activeId) return;
    const item = this.getItem(winId, tState.activeId);
    if (!item) return;
    const vars = extractVariables((item.subject || '') + ' ' + item.body);
    if (vars.length === 0) {
      this.doCopy(winId, item, {});
    } else {
      tState.varId = item.id;
      tState.varData = {};
      this.showVariableDialog(winId, vars);
    }
  },

  showVariableDialog(winIdOrEl, vars) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { el, config } = res;
    const pane = el.querySelector(config.selectors.preview);
    const tpl = document.getElementById(config.templates.variables);
    const clone = tpl.content.firstElementChild.cloneNode(true);
    pane.innerHTML = '';
    pane.appendChild(clone);
    const list = pane.querySelector(config.selectors.varList);
    let html = '';
    vars.forEach(v => {
      if (config.customVarItem) {
        html += config.customVarItem(v);
      } else {
        html += '<label>' + v + '</label>';
        html += '<input class="mail-var-input" data-var="' + v + '" placeholder="Enter ' + v + '...">';
      }
    });
    list.innerHTML = html;
  },

  varCancel(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, winId } = res;
    tState.varId = null;
    tState.varData = {};
    this.renderPreview(winId);
  },

  varCopy(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { tState, el, winId } = res;
    if (!tState.varId) return;
    const item = this.getItem(winId, tState.varId);
    if (!item) return;
    const data = {};
    el.querySelectorAll(res.config.selectors.varInput).forEach(input => {
      data[input.dataset.var] = input.value || ('[' + input.dataset.var + ']');
    });
    this.doCopy(winId, item, data);
    tState.varId = null;
    tState.varData = {};
    this.renderPreview(winId);
  },

  doCopy(winIdOrEl, item, vars) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { el, config } = res;
    const text = config.formatCopyText(item, vars);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        el.querySelector(config.selectors.status).textContent = config.messages.copied;
      }).catch(() => { this.fallbackCopy(winId, text); });
    } else {
      this.fallbackCopy(winId, text);
    }
  },

  fallbackCopy(winIdOrEl, text) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { el, config } = res;
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    el.querySelector(config.selectors.status).textContent = config.messages.copied;
  },

  updateStatus(winIdOrEl) {
    const res = this.getState(winIdOrEl);
    if (!res) return;
    const { el, config, winId } = res;
    el.querySelector(config.selectors.status).textContent = this.getCount(winId) + config.messages.countSuffix;
  }
};
