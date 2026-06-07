// ===== TODO APP =====
let dragTodoId = null;

function initTodoApp(winId, el) {
  state.windows[winId].appState = { filter: 'all' };
  renderTodoList(winId);
}
function renderTodoList(winIdOrEl) {
  const { state: todoState, el } = getAppStateAndEl(winIdOrEl);
  if (!todoState || !el) return;
  const container = el.querySelector('#todo-container');
  if (!container) return;
  const active = todoStore.active();
  const done = todoStore.completed();

  let items;
  if (todoState.filter === 'active') items = active;
  else if (todoState.filter === 'completed') items = done;
  else items = [...active, ...done];

  let html = '<div class="todo-header">';
  html += '<input class="win95-input todo-input" id="todo-input" placeholder="Add a task..." onkeydown="todoAddKey(event)">';
  html += '<input class="win95-input todo-due-input" id="todo-due-input" placeholder="Due (optional)" style="width:100px;">';
  html += '<button class="win95-button" onclick="todoAdd(event)">Add</button>';
  html += '</div>';

  // Filter tabs
  html += '<div class="todo-filters">';
  html += '<button class="todo-filter-tab' + (todoState.filter==='all'?' active-filter':'') + '" onclick="todoSetFilter(event,\'all\')">All<span class="filter-count">(' + todoStore.all().length + ')</span></button>';
  html += '<button class="todo-filter-tab' + (todoState.filter==='active'?' active-filter':'') + '" onclick="todoSetFilter(event,\'active\')">Active<span class="filter-count">(' + active.length + ')</span></button>';
  html += '<button class="todo-filter-tab' + (todoState.filter==='completed'?' active-filter':'') + '" onclick="todoSetFilter(event,\'completed\')">Completed<span class="filter-count">(' + done.length + ')</span></button>';
  if (done.length > 0) {
    html += '<button class="todo-clear-completed" onclick="todoClearCompleted(event)">Clear Completed</button>';
  }
  html += '</div>';

  html += '<div class="todo-list">';
  if (items.length === 0) {
    html += '<div style="padding:16px;text-align:center;color:#808080;font-size:11px;">' +
      (todoState.filter==='active' ? 'No active tasks.' : todoState.filter==='completed' ? 'No completed tasks.' : 'No tasks yet. Add one above.') +
      '</div>';
  }
  items.forEach(t => {
    const overdue = t.dueDate && !t.completed && t.dueDate < fmtDate(new Date());
    const dueDisplay = t.dueDate ? formatDueDate(t.dueDate) : '';
    html += '<div class="todo-item' + (overdue ? ' todo-overdue' : '') + '" draggable="true" data-todo-id="' + t.id + '" ondragstart="todoDragStart(event)" ondragover="todoDragOver(event)" ondragleave="todoDragLeave(event)" ondrop="todoDrop(event)" ondragend="todoDragEnd(event)">';
    html += '<span class="todo-drag-handle">≡</span>';
    html += '<input type="checkbox" class="win95-checkbox"' + (t.completed?' checked':'') + ' onchange="todoToggle(event,\'' + t.id + '\')">';
    html += '<span class="todo-item-text' + (t.completed?' completed':'') + (overdue?' overdue-text':'') + '" onclick="todoEditStart(event,\'' + t.id + '\')">' + escapeHtml(t.text) + '</span>';
    if (dueDisplay) {
      html += '<span class="todo-due-badge' + (overdue ? ' overdue-badge' : '') + '">📅 ' + dueDisplay + '</span>';
    }
    html += '<button class="todo-item-delete" onclick="todoDelete(event,\'' + t.id + '\')">✕</button>';
    html += '</div>';
  });
  html += '</div>';
  html += '<div class="todo-count">' + active.length + ' active, ' + done.length + ' completed</div>';
  container.innerHTML = html;
}
function todoSetFilter(e, filter) {
  const { state: todoState, winId } = getAppStateAndEl(e.target);
  if (!todoState) return;
  todoState.filter = filter;
  renderTodoList(winId);
}
function todoClearCompleted(e) {
  const { state: todoState, winId } = getAppStateAndEl(e.target);
  if (!todoState) return;
  todoStore.clearCompleted();
  if (todoState.filter === 'completed') todoState.filter = 'all';
  renderTodoList(winId);
}

// Drag-to-reorder handlers
function todoDragStart(e) {
  dragTodoId = e.target.closest('.todo-item')?.dataset?.todoId;
  if (!dragTodoId) return;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragTodoId);
  e.target.closest('.todo-item').classList.add('todo-dragging');
}
function todoDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const item = e.target.closest('.todo-item');
  if (item && item.dataset.todoId !== dragTodoId) {
    item.classList.add('todo-drag-over');
  }
}
function todoDragLeave(e) {
  const item = e.target.closest('.todo-item');
  if (item) item.classList.remove('todo-drag-over');
}
function todoDrop(e) {
  e.preventDefault();
  const targetItem = e.target.closest('.todo-item');
  if (!targetItem || !dragTodoId || targetItem.dataset.todoId === dragTodoId) return;
  const targetId = targetItem.dataset.todoId;
  const activeList = todoStore.active();
  const fromIdx = activeList.findIndex(t => t.id === dragTodoId);
  const toIdx = activeList.findIndex(t => t.id === targetId);
  if (fromIdx === -1 || toIdx === -1) return;
  todoStore.reorder(fromIdx, toIdx);
  const { winId } = getAppStateAndEl(targetItem);
  renderTodoList(winId);
  dragTodoId = null;
}
function todoDragEnd(e) {
  document.querySelectorAll('.todo-dragging, .todo-drag-over').forEach(el => {
    el.classList.remove('todo-dragging', 'todo-drag-over');
  });
  dragTodoId = null;
}
function todoAdd(e) {
  const { el, winId } = getAppStateAndEl(e.target);
  if (!el) return;
  const input = el.querySelector('#todo-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  const dueInput = el.querySelector('#todo-due-input');
  let dueDate = null;
  if (dueInput) {
    const raw = dueInput.value.trim();
    if (raw) dueDate = parseDueDate(raw);
  }
  todoStore.add({ text, dueDate });
  input.value = '';
  if (dueInput) dueInput.value = '';
  renderTodoList(winId);
}
function parseDueDate(raw) {
  const today = new Date();
  const simple = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (simple) return raw; // already YYYY-MM-DD
  const dayNum = raw.match(/^(\d{1,2})$/);
  if (dayNum) {
    const d = parseInt(dayNum[1]);
    return fmtDate(new Date(today.getFullYear(), today.getMonth(), d));
  }
  const monthDay = raw.match(/^([a-z]{3,9})\s+(\d{1,2})$/i);
  if (monthDay) {
    const months = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };
    const m = months[monthDay[1].toLowerCase().substring(0,3)];
    if (m !== undefined) return fmtDate(new Date(today.getFullYear(), m, parseInt(monthDay[2])));
  }
  const dayName = raw.toLowerCase().substring(0,3);
  const dayNames = { sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6 };
  if (dayNames[dayName] !== undefined) {
    const target = new Date();
    target.setDate(target.getDate() + ((dayNames[dayName] + 7 - target.getDay()) % 7 || 7));
    return fmtDate(target);
  }
  if (raw.toLowerCase() === 'tomorrow') {
    const t = new Date(); t.setDate(t.getDate()+1);
    return fmtDate(t);
  }
  if (raw.toLowerCase() === 'today') return fmtDate(today);
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return fmtDate(d);
  return raw;
}
function formatDueDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((target - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  const months = MONTHS_SHORT;
  return months[d.getMonth()] + ' ' + d.getDate();
}
function todoAddKey(e) {
  if (e.key === 'Enter') todoAdd(e);
}
function todoToggle(e, id) {
  const { winId } = getAppStateAndEl(e.target);
  const todo = todoStore.toggle(id);
  if (!todo) return;
  renderTodoList(winId);
}
function todoDelete(e, id) {
  const { winId } = getAppStateAndEl(e.target);
  const todo = todoStore.get(id);
  if (!todo) return;
  moveToRecycleBin('todo', todo);
  todoStore.remove(id);
  renderTodoList(winId);
}
function todoEditStart(e, id) {
  const { winId } = getAppStateAndEl(e.target);
  const todo = todoStore.get(id);
  if (!todo || todo.completed) return;
  const span = e.target;
  const oldText = todo.text;
  const input = document.createElement('input');
  input.className = 'win95-input';
  input.style.cssText = 'flex:1;height:20px;';
  input.value = oldText;
  input.addEventListener('blur', () => {
    const newText = input.value.trim();
    if (newText) todo.text = newText;
    renderTodoList(winId);
  });
  input.addEventListener('keydown', (ke) => {
    if (ke.key === 'Enter') input.blur();
    if (ke.key === 'Escape') { todo.text = oldText; renderTodoList(winId); }
  });
  span.replaceWith(input);
  input.focus();
  input.select();
}
