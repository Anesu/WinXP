// ── EventStore ──────────────────────────────────────────────
function createEventStore() {
  if (!fs.events) fs.events = {};
  const save = saveFilesystem;
  const dateKey = (y, m, d) => y + '-' + (m + 1) + '-' + d;
  return {
    add(dateStr, data) {
      if (!fs.events[dateStr]) fs.events[dateStr] = [];
      const ev = { id: 'e' + Date.now(), title: data.title || '', time: data.time || '' };
      fs.events[dateStr].push(ev);
      fs.events[dateStr].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
      save();
      return ev;
    },
    remove(dateStr, id) {
      if (!fs.events[dateStr]) return null;
      const idx = fs.events[dateStr].findIndex(e => e.id === id);
      if (idx === -1) return null;
      const [removed] = fs.events[dateStr].splice(idx, 1);
      if (!fs.events[dateStr].length) delete fs.events[dateStr];
      save();
      return removed;
    },
    forDate(dateStr) { return fs.events[dateStr] ? fs.events[dateStr].slice() : []; },
    hasOn(dateStr) { return !!(fs.events[dateStr] && fs.events[dateStr].length); },
    countOn(dateStr) { return fs.events[dateStr] ? fs.events[dateStr].length : 0; },
    raw() { return fs.events; }, // for backup serialization
  };
}
