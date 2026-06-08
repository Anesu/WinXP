// Event bus shared by embedded apps, stores, and the React shell bridge.
const shellEvents = {
  listeners: {},
  on(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  },
  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(fn => fn(data));
  },
};