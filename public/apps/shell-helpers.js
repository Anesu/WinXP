const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const DAYS_MINI = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  const min = m < 10 ? '0' + m : m;
  if (isToday) return 'Today ' + hr + ':' + min + ' ' + ampm;
  return MONTHS_SHORT[d.getMonth()] + ' ' + d.getDate() + ' ' + hr + ':' + min + ' ' + ampm;
}

function formatMailDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  const min = m < 10 ? '0' + m : m;
  if (isToday) return 'Today ' + hr + ':' + min + ' ' + ampm;
  return MONTHS_SHORT[d.getMonth()] + ' ' + d.getDate();
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || '';
}

function findWinEl(app) {
  for (const [id, w] of Object.entries(state.windows)) {
    if (w.app === app && !w.minimized) return w.el;
  }
  return null;
}

function findWinElById(id) {
  return state.windows[id]?.el || null;
}

function extractVariables(text) {
  const matches = text.match(/\[([^\]]+)\]/g);
  if (!matches) return [];
  const seen = new Set();
  return matches.map(m => m.slice(1, -1)).filter(v => {
    if (seen.has(v)) return false;
    seen.add(v);
    return true;
  });
}