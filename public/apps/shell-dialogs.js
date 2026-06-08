// Standalone dialogs invoked from the React taskbar and templates.

function showDateTimeDialog() {
  if (document.querySelector('.datetime-overlay')) return;
  const tpl = document.getElementById('tpl-datetime-dialog');
  const clone = tpl.content.firstElementChild.cloneNode(true);
  document.body.appendChild(clone);
  renderDateTimeCalendar();
  updateDateTimeDisplay();
  const interval = setInterval(updateDateTimeDisplay, 1000);
  clone.dataset.intervalId = interval;
}

function closeDateTimeDialog() {
  const overlay = document.querySelector('.datetime-overlay');
  if (!overlay) return;
  const interval = parseInt(overlay.dataset.intervalId);
  if (interval) clearInterval(interval);
  overlay.remove();
}

function renderDateTimeCalendar() {
  const cal = document.querySelector('#datetime-calendar');
  if (!cal) return;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = '<div class="dt-cal-header">';
  html += '<span>' + MONTHS_FULL[month] + ' ' + year + '</span>';
  html += '</div>';
  html += '<div class="dt-cal-grid">';
  DAYS_MINI.forEach(d => html += '<div class="dt-cal-day-header">' + d + '</div>');
  for (let i = 0; i < firstDay; i++) html += '<div class="dt-cal-day" style="color:#ccc;"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    let cls = 'dt-cal-day';
    if (d === today) cls += ' today';
    html += '<div class="' + cls + '">' + d + '</div>';
  }
  html += '</div>';
  cal.innerHTML = html;
}

function updateDateTimeDisplay() {
  const timeEl = document.querySelector('#datetime-clock-time');
  const dateEl = document.querySelector('#datetime-clock-date');
  if (!timeEl || !dateEl) return;
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  timeEl.textContent = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0') + ' ' + ampm;
  dateEl.textContent = MONTHS_FULL[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();
}

ShellAPI.registerEmbedded({ showDateTimeDialog });