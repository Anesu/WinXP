// Run dialog command parser (templates.html onclick handlers).

function runCheckKey(e, inputEl) {
  if (e.key === 'Enter') {
    const dialog = inputEl.closest('.win95-window');
    const btn = dialog.querySelector('.win95-button');
    if (btn) runExecute(btn);
  }
}

function runExecute(btn) {
  const win = btn.closest('.win95-window');
  const input = win.querySelector('#run-input');
  if (!input) return;
  const cmd = input.value.trim().toLowerCase();
  if (!cmd) return;

  const commandMap = {
    'control': 'controlpanel',
    'control panel': 'controlpanel',
    'bible': 'bible',
    'mail': 'mail',
    'outlook': 'mail',
    'todo': 'todo',
    'tasks': 'todo',
    'kanban': 'kanban',
    'winban': 'kanban',
    'journal': 'journal',
    'notes': 'journal',
    'calendar': 'calendar',
    'diff': 'textdiff',
    'textdiff': 'textdiff',
    'clippy': 'clippy',
    'copilot': 'clippy',
    'recycle': 'recyclebin',
    'recyclebin': 'recyclebin',
    'help': 'help',
    'search': 'search',
    'lock': 'lock',
    'qrtx': 'qrtx',
    'qr': 'qrtx',
    'transmitter': 'qrtx',
  };

  const app = commandMap[cmd];
  if (app === 'lock') {
    closeWindow(btn);
    showLockScreen();
  } else if (app) {
    closeWindow(btn);
    openApp(app);
  } else {
    alert("Windows cannot find '" + input.value.trim() + "'.\n\nMake sure you typed the name correctly, and then try again.");
  }
}