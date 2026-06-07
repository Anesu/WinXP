// ===== RECYCLE BIN =====
function moveToRecycleBin(type, data) {
  recycleBinStore.add(type, data);
  shellEvents.emit('store:recyclebin:changed');
}
function restoreFromRecycleBin(rbId) {
  const item = recycleBinStore.get(rbId);
  if (!item) return;
  if (item.type === 'note') {
    notesStore.add({ title: item.data.title || 'Restored', content: item.data.content || '' });
  } else if (item.type === 'todo') {
    todoStore.add({ text: item.data.text || '', dueDate: item.data.dueDate || null });
  } else if (item.type === 'event') {
    eventStore.add(item.data.key, item.data.event);
  }
  recycleBinStore.remove(rbId);
  shellEvents.emit('store:recyclebin:changed');
}
function emptyRecycleBin() {
  recycleBinStore.empty();
  shellEvents.emit('store:recyclebin:changed');
  const winEl = findWinEl('recyclebin');
  if (winEl) renderRecycleBin(winEl);
}

function initRecycleBinApp(winId, el) {
  renderRecycleBin(el);
}
function renderRecycleBin(el) {
  const content = el.querySelector('#recyclebin-content');
  const status = el.querySelector('#recyclebin-status');
  const items = recycleBinStore.all();
  if (items.length === 0) {
    content.innerHTML = '<div style="padding:40px;text-align:center;color:#808080;"><div style="font-size:48px;">🗑️</div><p>Recycle Bin is empty.</p></div>';
    status.textContent = '0 object(s)';
    return;
  }
  const typeLabels = { note: '📝 Note', todo: '✅ Task', event: '📅 Event' };
  let html = '<div style="padding:4px;">';
  items.forEach(rb => {
    const label = rb.type === 'note' ? (rb.data.title || 'Untitled') :
                  rb.type === 'todo' ? rb.data.text :
                  rb.type === 'event' ? rb.data.event.title : 'Unknown';
    html += '<div class="recyclebin-item">';
    html += '<span class="recyclebin-item-type">' + (typeLabels[rb.type] || '📄') + '</span>';
    html += '<span class="recyclebin-item-name">' + escapeHtml(label) + '</span>';
    html += '<span class="recyclebin-item-date">' + formatTime(rb.deletedAt) + '</span>';
    html += '<button class="recyclebin-restore-btn" onclick="restoreFromRecycleBin(\'' + rb.id + '\')">Restore</button>';
    html += '</div>';
  });
  html += '</div>';
  content.innerHTML = html;
  status.textContent = items.length + ' object(s)';
}
function restoreAllRecycleBin() {
  const items = recycleBinStore.all();
  items.forEach(rb => restoreFromRecycleBin(rb.id));
  const winEl = findWinEl('recyclebin');
  if (winEl) renderRecycleBin(winEl);
}
