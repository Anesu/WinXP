// ===== KANBAN BOARD =====
let dragKanbanId = null;

function initKanbanApp(winId, el) {
  renderKanban(winId);
}

function renderKanban(winIdOrEl) {
  const { el, winId } = getAppStateAndEl(winIdOrEl);
  if (!el) return;
  const container = el.querySelector('#kanban-container');
  if (!container) return;
  
  const allTodos = todoStore.all();
  const cols = {
    'todo': [],
    'in_progress': [],
    'done': []
  };
  
  allTodos.forEach(t => {
    if (cols[t.status]) cols[t.status].push(t);
    else cols['todo'].push(t); // fallback
  });

  const today = fmtDate(new Date());

  const renderCard = (t) => {
    const overdue = t.dueDate && t.status !== 'done' && t.dueDate < today;
    const dueDisplay = t.dueDate ? formatDueDate(t.dueDate) : '';
    let html = '<div class="kanban-card" draggable="true" data-todo-id="' + t.id + '" ondragstart="kanbanDragStart(event)" ondragend="kanbanDragEnd(event)">';
    html += '<div class="kanban-card-title" onclick="kanbanEditStart(event,\'' + t.id + '\')">' + escapeHtml(t.text) + '</div>';
    html += '<div class="kanban-card-meta">';
    if (dueDisplay) {
      html += '<span class="' + (overdue ? 'kanban-card-overdue' : '') + '">📅 ' + dueDisplay + '</span>';
    } else {
      html += '<span></span>';
    }
    html += '<span class="kanban-card-delete" onclick="kanbanDelete(event,\'' + t.id + '\')">✕</span>';
    html += '</div></div>';
    return html;
  };

  let html = '<div class="kanban-toolbar">';
  html += '<input class="win95-input" id="kanban-input" placeholder="Add a new task..." style="flex:1;" onkeydown="kanbanAddKey(event)">';
  html += '<button class="win95-button" onclick="kanbanAdd(event)">Add</button>';
  html += '</div>';

  html += '<div class="kanban-board">';
  
  const colDefs = [
    { id: 'todo', title: 'To Do' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
  ];

  colDefs.forEach(c => {
    html += '<div class="kanban-col">';
    html += '<div class="kanban-col-header">' + c.title + ' (' + cols[c.id].length + ')</div>';
    html += '<div class="kanban-col-body" data-status="' + c.id + '" ondragover="kanbanDragOver(event)" ondragleave="kanbanDragLeave(event)" ondrop="kanbanDrop(event)">';
    cols[c.id].forEach(t => { html += renderCard(t); });
    html += '</div></div>';
  });

  html += '</div>';
  container.innerHTML = html;
}

function kanbanAdd(e) {
  const { el, winId } = getAppStateAndEl(e.target);
  if (!el) return;
  const input = el.querySelector('#kanban-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  
  todoStore.add({ text, status: 'todo' });
  input.value = '';
  renderKanban(winId);
}

function kanbanAddKey(e) {
  if (e.key === 'Enter') kanbanAdd(e);
}

function kanbanDelete(e, id) {
  e.stopPropagation();
  const { winId } = getAppStateAndEl(e.target);
  const todo = todoStore.get(id);
  if (!todo) return;
  moveToRecycleBin('todo', todo);
  todoStore.remove(id);
  renderKanban(winId);
}

function kanbanEditStart(e, id) {
  const { winId } = getAppStateAndEl(e.target);
  const todo = todoStore.get(id);
  if (!todo) return;
  const titleEl = e.target;
  const oldText = todo.text;
  const input = document.createElement('input');
  input.className = 'win95-input';
  input.style.cssText = 'width:100%; height:20px; box-sizing:border-box;';
  input.value = oldText;
  
  input.addEventListener('blur', () => {
    const newText = input.value.trim();
    if (newText) todoStore.update(id, { text: newText });
    renderKanban(winId);
  });
  input.addEventListener('keydown', (ke) => {
    if (ke.key === 'Enter') input.blur();
    if (ke.key === 'Escape') { renderKanban(winId); }
  });
  
  titleEl.replaceWith(input);
  input.focus();
  input.select();
}

// ===== DRAG & DROP =====
function kanbanDragStart(e) {
  const card = e.target.closest('.kanban-card');
  if (!card) return;
  dragKanbanId = card.dataset.todoId;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragKanbanId);
  setTimeout(() => { card.classList.add('dragging'); }, 0);
}

function kanbanDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const col = e.target.closest('.kanban-col-body');
  if (col) col.classList.add('drag-over');
}

function kanbanDragLeave(e) {
  const col = e.target.closest('.kanban-col-body');
  if (col) col.classList.remove('drag-over');
}

function kanbanDrop(e) {
  e.preventDefault();
  const col = e.target.closest('.kanban-col-body');
  if (col) col.classList.remove('drag-over');
  
  if (!dragKanbanId || !col) return;
  const newStatus = col.dataset.status;
  if (newStatus) {
    todoStore.updateStatus(dragKanbanId, newStatus);
  }
  
  const { winId } = getAppStateAndEl(col);
  renderKanban(winId);
  dragKanbanId = null;
}

function kanbanDragEnd(e) {
  const card = e.target.closest('.kanban-card');
  if (card) card.classList.remove('dragging');
  document.querySelectorAll('.kanban-col-body.drag-over').forEach(c => c.classList.remove('drag-over'));
  dragKanbanId = null;
}
