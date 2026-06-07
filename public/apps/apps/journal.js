// ===== NOTES-IN-JOURNAL =====

function updateJournalStatus(winIdOrEl) {
  const { el } = getAppStateAndEl(winIdOrEl);
  if (!el) return;
  const editorEl = el.querySelector('#journal-notes-editor');
  const statusEl = el.querySelector('#journal-status');
  if (!editorEl || !statusEl) return;
  const text = editorEl.innerText || '';
  const cleanText = text.trim();
  const wordCount = cleanText === '' ? 0 : cleanText.split(/\s+/).length;
  const charCount = text.length;
  statusEl.textContent = wordCount + ' words, ' + charCount + ' characters | Ready';
}

function initJournalApp(winId, el) {
  state.windows[winId].appState = { currentNoteId: null };
  const allNotes = notesStore.all();
  const titleEl = el.querySelector('#journal-notes-title');
  const editorEl = el.querySelector('#journal-notes-editor');
  if (editorEl) {
    editorEl.addEventListener('input', () => {
      updateJournalStatus(winId);
      journalNotesAutoSave(winId);
    });
    editorEl.addEventListener('keydown', (e) => {
      if (e.ctrlKey) {
        let cmd = '';
        if (e.key === 'b' || e.key === 'B') cmd = 'bold';
        else if (e.key === 'i' || e.key === 'I') cmd = 'italic';
        else if (e.key === 'u' || e.key === 'U') cmd = 'underline';
        if (cmd) {
          e.preventDefault();
          document.execCommand(cmd, false, null);
          updateJournalStatus(winId);
          journalNotesAutoSave(winId);
        }
      }
    });
  }
  if (titleEl) {
    titleEl.addEventListener('input', () => {
      journalNotesAutoSave(winId);
    });
  }
  if (allNotes.length > 0) {
    journalNotesLoad(allNotes[0].id, winId);
  } else {
    if (titleEl) titleEl.value = '';
    if (editorEl) editorEl.innerHTML = '';
    el.querySelector('#journal-status').textContent = 'No notes';
    journalNotesRenderList(winId);
  }
}

function journalNotesImportClick() {
  const { el } = getAppStateAndEl();
  if (!el) return;
  const fileInput = el.querySelector('#journal-import-input');
  if (fileInput) fileInput.click();
}

function journalNotesImport(e) {
  const { el, winId } = getAppStateAndEl(e.target);
  if (!el) return;
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    const text = evt.target.result;
    const title = file.name.replace(/\.[^/.]+$/, "");
    const note = notesStore.add({
      title: title,
      content: escapeHtml(text).replace(/\n/g, '<br>')
    });
    journalNotesRenderList(winId);
    journalNotesLoad(note.id, winId);
    e.target.value = '';
  };
  reader.readAsText(file);
}

function journalNotesRenderList(winIdOrEl, filter) {
  const { state: jState, el } = getAppStateAndEl(winIdOrEl);
  if (!jState || !el) return;
  const list = el.querySelector('#journal-notes-sidebar');
  if (!list) return;
  let notes = notesStore.all();
  if (filter) {
    const q = filter.toLowerCase();
    notes = notes.filter(n => n.title.toLowerCase().includes(q) || stripHtml(n.content).toLowerCase().includes(q));
  }
  notes.sort((a, b) => b.updated - a.updated);
  if (notes.length === 0) {
    list.innerHTML = '<div style="padding:8px;color:#808080;font-size:10px;">No notes found.</div>';
    return;
  }
  let html = '';
  notes.forEach(note => {
    const activeClass = note.id === jState.currentNoteId ? ' active' : '';
    html += '<div class="notes-sidebar-item' + activeClass + '" onclick="journalNotesLoad(\'' + note.id + '\', event.target)">';
    html += '<span>' + escapeHtml(note.title || 'Untitled') + '</span>';
    html += '<span class="notes-sidebar-item-time">' + formatTime(note.updated) + '</span>';
    html += '</div>';
  });
  list.innerHTML = html;
}

function journalNotesLoad(noteId, winIdOrEl) {
  const { state: jState, el, winId } = getAppStateAndEl(winIdOrEl);
  if (!jState || !el) return;
  if (jState.currentNoteId) {
    const titleVal = el.querySelector('#journal-notes-title')?.value || 'Untitled';
    const contentVal = el.querySelector('#journal-notes-editor')?.innerHTML || '';
    notesStore.update(jState.currentNoteId, { title: titleVal, content: contentVal });
  }
  const note = notesStore.get(noteId);
  if (!note) return;
  jState.currentNoteId = noteId;
  const titleEl = el.querySelector('#journal-notes-title');
  const editorEl = el.querySelector('#journal-notes-editor');
  if (titleEl) titleEl.value = note.title;
  if (editorEl) editorEl.innerHTML = note.content || '';
  journalNotesRenderList(winId);
  updateJournalStatus(winId);
}

function journalNotesFormat(command) {
  document.execCommand(command, false, null);
  const { el, winId } = getAppStateAndEl();
  if (el) {
    el.querySelector('#journal-notes-editor')?.focus();
    updateJournalStatus(winId);
    journalNotesAutoSave(winId);
  }
}

function journalNotesNew() {
  const { el, winId } = getAppStateAndEl();
  if (!el) return;
  const note = notesStore.add({ title: 'New Note', content: '' });
  journalNotesRenderList(winId);
  journalNotesLoad(note.id, winId);
  el.querySelector('#journal-notes-title')?.focus();
}

function journalNotesDelete() {
  const { state: jState, el, winId } = getAppStateAndEl();
  if (!el || !jState || !jState.currentNoteId) return;
  const note = notesStore.get(jState.currentNoteId);
  if (!note) return;
  if (!confirm('Move "' + (note.title || 'Untitled') + '" to Recycle Bin?')) return;
  moveToRecycleBin('note', note);
  notesStore.remove(jState.currentNoteId);
  jState.currentNoteId = null;
  const allNotes = notesStore.all();
  if (allNotes.length > 0) {
    journalNotesLoad(allNotes[0].id, winId);
  } else {
    const titleEl = el.querySelector('#journal-notes-title');
    const editorEl = el.querySelector('#journal-notes-editor');
    if (titleEl) titleEl.value = '';
    if (editorEl) editorEl.innerHTML = '';
    journalNotesRenderList(winId);
    el.querySelector('#journal-status').textContent = 'No notes';
  }
}

function journalNotesExport() {
  const { state: jState, el } = getAppStateAndEl();
  if (!el || !jState || !jState.currentNoteId) return;
  const note = notesStore.get(jState.currentNoteId);
  if (!note) return;
  const title = el.querySelector('#journal-notes-title')?.value || 'Untitled';
  const content = el.querySelector('#journal-notes-editor')?.innerText || '';
  const blob = new Blob([title + '\n\n' + content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = title.replace(/[^a-zA-Z0-9 _-]/g, '') + '.txt';
  a.click();
  URL.revokeObjectURL(url);
  el.querySelector('#journal-status').textContent = 'Exported: ' + title + '.txt';
}

function journalNotesSearch() {
  const { state: jState, el, winId } = getAppStateAndEl();
  if (!el || !jState) return;
  const q = el.querySelector('#journal-notes-search')?.value || '';
  jState.currentNoteId = null;
  journalNotesRenderList(winId, q);
  if (q) {
    const filtered = notesStore.search(q);
    if (filtered.length > 0) {
      journalNotesLoad(filtered[0].id, winId);
    }
  }
}

function journalNotesAutoSave(winIdOrEl) {
  const { state: jState, el, winId } = getAppStateAndEl(winIdOrEl);
  if (!el || !jState || !jState.currentNoteId) return;
  const title = el.querySelector('#journal-notes-title')?.value || 'Untitled';
  const content = el.querySelector('#journal-notes-editor')?.innerHTML || '';
  notesStore.update(jState.currentNoteId, { title, content });
  journalNotesRenderList(winId);
}
