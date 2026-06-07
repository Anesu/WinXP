// ===== SEARCH COMPANION — cross-app productivity search =====

const SEARCH_TYPE_LABELS = {
  note: 'Notepad',
  mail: 'Outlook Express',
  task: 'Todo Tasks',
  event: 'Calendar',
  prompt: 'Office Assistant',
};

function initSearchApp(winId, el) {
  const input = el.querySelector('#search-query');
  if (input) {
    input.focus();
    input.select();
  }
  renderSearchResults(el, '');
}

function searchStripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return (div.textContent || '').replace(/\s+/g, ' ').trim();
}

function searchCollectResults(q) {
  const lq = q.toLowerCase().trim();
  if (!lq) return [];

  const results = [];

  notesStore.search(lq).forEach((n) => {
    results.push({
      type: 'note',
      app: 'journal',
      title: n.title || 'Untitled',
      snippet: searchStripHtml(n.content).slice(0, 100),
    });
  });

  mailStore.search(lq).forEach((m) => {
    results.push({
      type: 'mail',
      app: 'mail',
      title: m.title || m.subject || 'Mail template',
      snippet: (m.subject || '') + (m.body ? ' — ' + searchStripHtml(m.body).slice(0, 60) : ''),
    });
  });

  clippyStore.search(lq).forEach((c) => {
    results.push({
      type: 'prompt',
      app: 'clippy',
      title: c.title || 'Untitled prompt',
      snippet: (c.body || '').slice(0, 100),
    });
  });

  todoStore.all().forEach((t) => {
    if (!t.text || !t.text.toLowerCase().includes(lq)) return;
    results.push({
      type: 'task',
      app: 'todo',
      title: t.text,
      snippet: t.dueDate ? 'Due: ' + t.dueDate : (t.completed ? 'Completed' : 'Active task'),
    });
  });

  const events = eventStore.raw();
  Object.keys(events).forEach((dateStr) => {
    (events[dateStr] || []).forEach((ev) => {
      if (!(ev.title || '').toLowerCase().includes(lq)) return;
      results.push({
        type: 'event',
        app: 'calendar',
        title: ev.title,
        snippet: dateStr + (ev.time ? ' at ' + ev.time : ''),
      });
    });
  });

  return results.slice(0, 50);
}

function renderSearchResults(el, q) {
  const list = el.querySelector('#search-results');
  const status = el.querySelector('#search-status');
  if (!list) return;

  const query = (q !== undefined ? q : el.querySelector('#search-query')?.value || '').trim();
  const results = searchCollectResults(query);

  if (status) {
    if (!query) status.textContent = 'Type a word or phrase to search your data.';
    else if (results.length === 0) status.textContent = 'No matches found.';
    else status.textContent = results.length + ' result' + (results.length === 1 ? '' : 's') + ' for "' + query + '"';
  }

  if (!query) {
    list.innerHTML = '<div class="search-hint">Searches Notepad, Outlook Express, Todo Tasks, Calendar, and Office Assistant.</div>';
    return;
  }

  if (results.length === 0) {
    list.innerHTML = '<div class="search-hint">Try different keywords or check spelling.</div>';
    return;
  }

  let html = '';
  results.forEach((r, i) => {
    const label = SEARCH_TYPE_LABELS[r.type] || r.type;
    html += '<div class="search-result-item" ondblclick="searchOpenResult(' + i + ',\'' + el.dataset.winId + '\')">';
    html += '<div class="search-result-type">' + searchEscapeHtml(label) + '</div>';
    html += '<div class="search-result-title">' + searchEscapeHtml(r.title) + '</div>';
    if (r.snippet) html += '<div class="search-result-snippet">' + searchEscapeHtml(r.snippet) + '</div>';
    html += '</div>';
  });
  list.innerHTML = html;
  el._searchResults = results;
}

function searchResolveWin(el) {
  if (!el) return null;
  return el.closest ? el.closest('.win95-window') : el;
}

function searchRun(el) {
  const winEl = searchResolveWin(el);
  if (!winEl) return;
  renderSearchResults(winEl, winEl.querySelector('#search-query')?.value || '');
}

function searchKey(e, el) {
  if (e.key === 'Enter') searchRun(el);
}

function searchOpenResult(index, winId) {
  const el =
    document.querySelector('.win95-window[data-win-id="' + winId + '"]') ||
    findWinElById(winId);
  const results = el?._searchResults;
  if (!results || !results[index]) return;
  const r = results[index];
  if (typeof window.__winxpOpenApp === 'function') window.__winxpOpenApp(r.app);
}

function searchEscapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}