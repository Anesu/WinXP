// ── TodoStore ───────────────────────────────────────────────
function createTodoStore() {
  if (!fs.todos) fs.todos = [];
  const save = saveFilesystem;
  return {
    add(data) {
      const todo = { id: 't' + Date.now(), text: data.text || '', completed: false, status: data.status || 'todo', dueDate: data.dueDate || null, completedAt: null, created: Date.now() };
      fs.todos.push(todo);
      save();
      return todo;
    },
    toggle(id) {
      const todo = fs.todos.find(t => t.id === id);
      if (!todo) return null;
      todo.completed = !todo.completed;
      todo.completed ? todo.completedAt = Date.now() : delete todo.completedAt;
      todo.status = todo.completed ? 'done' : 'todo';
      save();
      return todo;
    },
    remove(id) {
      const idx = fs.todos.findIndex(t => t.id === id);
      if (idx === -1) return null;
      const [removed] = fs.todos.splice(idx, 1);
      save();
      return removed;
    },
    update(id, data) {
      const todo = fs.todos.find(t => t.id === id);
      if (!todo) return null;
      if (data.text !== undefined) todo.text = data.text;
      if (data.dueDate !== undefined) todo.dueDate = data.dueDate;
      if (data.status !== undefined) return this.updateStatus(id, data.status);
      save();
      return todo;
    },
    updateStatus(id, newStatus) {
      const todo = fs.todos.find(t => t.id === id);
      if (!todo) return null;
      todo.status = newStatus;
      todo.completed = (newStatus === 'done');
      if (todo.completed) {
        if (!todo.completedAt) todo.completedAt = Date.now();
      } else {
        delete todo.completedAt;
      }
      save();
      return todo;
    },
    get(id) { 
      const todo = fs.todos.find(t => t.id === id);
      if (todo && !todo.status) todo.status = todo.completed ? 'done' : 'todo';
      return todo || null;
    },
    all() { 
      return fs.todos.map(t => {
        if (!t.status) t.status = t.completed ? 'done' : 'todo';
        return t;
      }); 
    },
    active() { return this.all().filter(t => !t.completed); },
    completed() { return this.all().filter(t => t.completed); },
    reorder(fromIdx, toIdx) {
      const active = this.active();
      if (fromIdx < 0 || fromIdx >= active.length || toIdx < 0 || toIdx >= active.length) return;
      const fromTodo = active[fromIdx], toTodo = active[toIdx];
      const fi = fs.todos.indexOf(fromTodo), ti = fs.todos.indexOf(toTodo);
      if (fi === -1 || ti === -1) return;
      fs.todos.splice(fi, 1);
      fs.todos.splice(ti, 0, fromTodo);
      save();
    },
    clearCompleted() {
      const removed = fs.todos.filter(t => t.completed);
      fs.todos = this.active();
      if (removed.length) save();
      return removed;
    },
    countByDueDate(ds) { return fs.todos.filter(t => t.dueDate === ds && !t.completed).length; },
    hasByDueDate(ds) { return fs.todos.some(t => t.dueDate === ds && !t.completed); },
    countCompletedOn(ds) { return fs.todos.filter(t => t.completedAt && fmtDate(new Date(t.completedAt)) === ds).length; },
    hasCompletedOn(ds) { return fs.todos.some(t => t.completedAt && fmtDate(new Date(t.completedAt)) === ds); },
  };
}
