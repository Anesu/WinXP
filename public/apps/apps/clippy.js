// ===== CLIPPY CONFIG & WRAPPERS =====
const clippyConfig = {
  idPrefix: 'c',
  store: clippyStore,
  selectors: {
    sidebar: '#clippy-sidebar-inner',
    list: '#clippy-list-pane',
    preview: '#clippy-preview-pane',
    status: '#clippy-status',
    search: '#clippy-search',
    varList: '#clippy-var-list',
    varInput: '.clippy-var-input'
  },
  templates: {
    variables: 'tpl-clippy-variables'
  },
  categoryIcons: {
    'All': '📬',
    'Coding': '💻',
    'Testing': '🧪',
    'General': '📎'
  },
  categories: {
    get: () => ['All', 'Coding', 'Testing', 'General']
  },
  fields: {
    category: { id: 'clippy-edit-category' },
    title: { id: 'clippy-edit-title', placeholder: 'e.g. Refactor Code' },
    body: {
      id: 'clippy-edit-body',
      placeholder: 'Analyze the code:\n\n[Code]',
      label: 'Prompt Text',
      note: '— use [Variable] for fillable inputs',
      class: 'win95-input clippy-editor-body'
    }
  },
  messages: {
    copied: '📋 Prompt copied to clipboard!',
    countSuffix: ' prompt(s)'
  },
  callbacks: {
    selectFolder: 'clippySelectFolder',
    selectItem: 'clippySelect',
    save: 'clippySave',
    cancelEdit: 'clippyCancelEdit'
  },
  formatCopyText: (item, vars) => {
    let body = item.body;
    for (const [key, val] of Object.entries(vars)) {
      const re = new RegExp('\\[' + key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\]', 'g');
      body = body.replace(re, val);
    }
    return body;
  },
  customPreview: (pane, item, vars) => {
    let varsText = vars.length > 0 ? vars.map(v => '[' + v + ']').join(', ') : 'None';
    pane.innerHTML =
      '<div class="clippy-preview-content">' +
      '<div class="clippy-preview-title">' + escapeHtml(item.title) + '</div>' +
      '<div class="clippy-preview-meta">Category: <b>' + escapeHtml(item.category) + '</b> | Updated: ' + formatMailDate(item.updated) + '</div>' +
      '<div class="clippy-preview-body">' + escapeHtml(item.body) + '</div>' +
      '<div style="font-size:10px;color:#808080;margin-top:4px;">Variables detected: <b>' + escapeHtml(varsText) + '</b></div>' +
      '</div>' +
      '<div class="clippy-bubble-container">' +
      '<div class="clippy-character">📎</div>' +
      '<div class="clippy-speech-bubble">It looks like you want to copy the "' + escapeHtml(item.title) + '" prompt. Click the Copy button to inject variables and copy the prompt to your clipboard!</div>' +
      '</div>';
  },
  customPlaceholder: (pane) => {
    pane.innerHTML =
      '<div class="clippy-preview-placeholder">' +
      '<div style="font-size: 24px; margin-bottom: 8px;">📎</div>' +
      '<div>Select a prompt template to preview, or click <b>New</b> to create one.</div>' +
      '</div>' +
      '<div class="clippy-bubble-container">' +
      '<div class="clippy-character">📎</div>' +
      '<div class="clippy-speech-bubble">Hi! I\'m Clippy, your prompt assistant. Select a prompt on the left, or create a new one to get started!</div>' +
      '</div>';
  },
  customEditor: (pane, item) => {
    const cats = ['Coding', 'Testing', 'General'];
    pane.innerHTML =
      '<div class="clippy-editor-form">' +
      '<label style="font-size: 10px; font-weight: bold; color: #404040;">Category</label>' +
      '<select class="win95-input" id="clippy-edit-category" style="height:22px;padding:2px;">' +
      cats.map(c => '<option value="' + c + '"' + (item && item.category === c ? ' selected' : '') + '>' + c + '</option>').join('') +
      '</select>' +
      '<label style="font-size: 10px; font-weight: bold; color: #404040;">Prompt Title</label>' +
      '<input class="win95-input" id="clippy-edit-title" placeholder="e.g. Refactor Code" value="' + (item ? escapeHtml(item.title) : '') + '">' +
      '<label style="font-size: 10px; font-weight: bold; color: #404040;">Prompt Text <span style="font-weight:normal;color:#808080;">— use [Variable] for fillable inputs</span></label>' +
      '<textarea class="win95-input clippy-editor-body" id="clippy-edit-body" placeholder="Analyze the code:\n\n[Code]">' + (item ? escapeHtml(item.body) : '') + '</textarea>' +
      '<div class="clippy-editor-buttons">' +
      '<button class="win95-button" onclick="clippySave()" style="font-weight:bold;">💾 Save</button>' +
      '<button class="win95-button" onclick="clippyCancelEdit()">Cancel</button>' +
      '</div>' +
      '</div>' +
      '<div class="clippy-bubble-container">' +
      '<div class="clippy-character">📎</div>' +
      '<div class="clippy-speech-bubble">It looks like you\'re writing a prompt. Make sure to use brackets like [Code] or [Language] to define variables that you can dynamically fill in when copying!</div>' +
      '</div>';
  },
  customVarItem: (v) => {
    return '<label style="font-size:11px;font-weight:bold;margin-top:6px;display:block;">' + v + '</label>' +
           '<input class="win95-input clippy-var-input" data-var="' + v + '" placeholder="Enter ' + v + '..." style="width:100%;height:22px;margin-top:2px;">';
  }
};

function initClippyApp(winId, el) { TemplateManager.init('clippy', winId, el, clippyConfig); }
function clippySelectFolder(e, folder) { TemplateManager.selectFolder(e, folder); }
function clippySelect(e, id) { TemplateManager.selectItem(e, id); }
function clippyNew() { TemplateManager.new(); }
function clippyEdit() { TemplateManager.edit(); }
function clippySave() { TemplateManager.save(); }
function clippyCancelEdit() { TemplateManager.cancelEdit(); }
function clippyDelete() { TemplateManager.delete(); }
function clippyCopy() { TemplateManager.copy(); }
function clippyVarCancel() { TemplateManager.varCancel(); }
function clippyVarCopy() { TemplateManager.varCopy(); }
function clippySearch() {
  const { winId } = getAppStateAndEl();
  if (!winId) return;
  const stateObj = state.windows[winId]?.appState;
  if (!stateObj) return;
  stateObj.activeId = null;
  stateObj.editing = false;
  TemplateManager.renderList(winId);
  TemplateManager.showPlaceholder(winId);
}

