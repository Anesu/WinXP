// ── PomodoroStore ───────────────────────────────────────────
function createPomodoroStore() {
  if (!fs.pomodoroSessions) fs.pomodoroSessions = [];
  const save = saveFilesystem;
  return {
    log(data) {
      const s = { date: data.date || Date.now(), duration: data.duration || 25, linkedTaskId: data.linkedTaskId || null };
      fs.pomodoroSessions.unshift(s);
      if (fs.pomodoroSessions.length > 20) fs.pomodoroSessions = fs.pomodoroSessions.slice(0, 20);
      save();
      return s;
    },
    recent(n) { return (fs.pomodoroSessions || []).slice(0, n || 5); },
    all() { return (fs.pomodoroSessions || []).slice(); },
    countOnDate(ds) {
      return (fs.pomodoroSessions || []).filter(s => fmtDate(new Date(s.date)) === ds).length;
    },
    clear() { fs.pomodoroSessions = []; save(); }
  };
}
