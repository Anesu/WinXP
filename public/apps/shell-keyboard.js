// Global keyboard shortcuts for embedded apps (React shell has no #desktop).

document.addEventListener('keydown', (e) => {
  if (document.querySelector('.lockscreen-overlay')) {
    if (e.target && e.target.closest('.lock-pin-dialog')) {
      return;
    }
    e.preventDefault();
    return;
  }

  if ((e.metaKey && e.key === 'r') || (e.altKey && e.key === 'r')) {
    e.preventDefault();
    openApp('run');
    return;
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    const activeWin = state.activeWindowId ? state.windows[state.activeWindowId] : null;
    if (activeWin && activeWin.app === 'journal') {
      journalNotesAutoSave();
    }
  }
});