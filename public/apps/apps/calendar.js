// ===== CALENDAR APP =====

function initCalendarApp(winId, el) {
  const now = new Date();
  state.windows[winId].appState = {
    year: now.getFullYear(),
    month: now.getMonth(),
    selected: now.getDate(),
    view: 'month'
  };
  if (!eventStore) /* eventStore managed internally */;
  renderCalendar(winId);
}
function getDateKey(y, m, d) {
  return y + '-' + (m + 1) + '-' + d;
}
function getEventsForDate(y, m, d) {
  const key = getDateKey(y, m, d);
  return eventStore.forDate(key);
}
function renderCalendar(winIdOrEl) {
  const { state: calState, el, winId } = getAppStateAndEl(winIdOrEl);
  if (!calState || !el) return;
  const gridArea = el.querySelector('#calendar-grid-area');
  if (!gridArea) return;
  const months = MONTHS_FULL;
  const days = DAYS_SHORT;

  // View toggle + nav header
  let headerHtml = '<div class="calendar-header">';
  headerHtml += '<button class="calendar-nav-btn" onclick="calPrevMonth(event)">◀</button>';
  headerHtml += '<span class="calendar-month-year">' + months[calState.month] + ' ' + calState.year + '</span>';
  headerHtml += '<button class="calendar-nav-btn" onclick="calNextMonth(event)">▶</button>';
  headerHtml += '<button class="cal-today-btn" onclick="calGoToday(event)">Today</button>';
  headerHtml += '<span class="cal-view-toggles">';
  headerHtml += '<button class="cal-view-btn' + (calState.view==='month'?' active-view':'') + '" onclick="calSetView(event,\'month\')">Month</button>';
  headerHtml += '<button class="cal-view-btn' + (calState.view==='week'?' active-view':'') + '" onclick="calSetView(event,\'week\')">Week</button>';
  headerHtml += '<button class="cal-view-btn' + (calState.view==='day'?' active-view':'') + '" onclick="calSetView(event,\'day\')">Day</button>';
  headerHtml += '</span>';
  headerHtml += '</div>';

  if (calState.view === 'month') {
    renderMonthGrid(winId, gridArea, headerHtml, months, days);
  } else if (calState.view === 'week') {
    renderWeekView(winId, gridArea, headerHtml, days);
  } else {
    renderDayView(winId, gridArea, headerHtml, days);
  }

  // Render events panel (shared)
  renderCalendarEvents(winId);
  updateCalendarStatus(winId);
}

function renderMonthGrid(winIdOrEl, gridArea, headerHtml, months, days) {
  const { state: calState } = getAppStateAndEl(winIdOrEl);
  if (!calState) return;
  const today = new Date();
  const firstDay = new Date(calState.year, calState.month, 1).getDay();
  const daysInMonth = new Date(calState.year, calState.month + 1, 0).getDate();
  const daysInPrev = new Date(calState.year, calState.month, 0).getDate();

  let html = headerHtml + '<div class="calendar-grid">';
  days.forEach(d => html += '<div class="calendar-day-header">' + d + '</div>');

  for (let i = firstDay - 1; i >= 0; i--) {
    html += '<div class="calendar-day other-month">' + (daysInPrev - i) + '</div>';
  }
  for (let d = 1; d <= daysInMonth; d++) {
    let cls = 'calendar-day';
    if (calState.year === today.getFullYear() && calState.month === today.getMonth() && d === today.getDate()) cls += ' today';
    if (d === calState.selected) cls += ' selected';
    if (getEventsForDate(calState.year, calState.month, d).length > 0) cls += ' has-events';
    html += '<div class="' + cls + '" onclick="calPickDate(event,' + d + ')">' + d + '</div>';
  }
  const totalCells = firstDay + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remaining; i++) {
    html += '<div class="calendar-day other-month">' + i + '</div>';
  }
  html += '</div>';
  gridArea.innerHTML = html;
}

function renderWeekView(winIdOrEl, gridArea, headerHtml, days) {
  const { state: calState } = getAppStateAndEl(winIdOrEl);
  if (!calState) return;
  // Find Sunday of the week containing calState.selected
  const selectedDate = new Date(calState.year, calState.month, calState.selected);
  const dayOfWeek = selectedDate.getDay();
  const sunday = new Date(selectedDate);
  sunday.setDate(selectedDate.getDate() - dayOfWeek);

  let html = headerHtml + '<div class="calendar-week-grid">';
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    const isToday = d.toDateString() === new Date().toDateString();
    const isSelected = d.getDate() === calState.selected && d.getMonth() === calState.month && d.getFullYear() === calState.year;
    let cls = 'calendar-week-day';
    if (isToday) cls += ' cal-today';
    if (isSelected) cls += ' cal-sel';
    const evs = getEventsForDate(d.getFullYear(), d.getMonth(), d.getDate());
    html += '<div class="' + cls + '" onclick="calPickWeekDay(event,' + d.getFullYear() + ',' + d.getMonth() + ',' + d.getDate() + ')">';
    html += '<div class="cal-week-day-name">' + days[i] + '</div>';
    html += '<div class="cal-week-day-num">' + d.getDate() + '</div>';
    if (evs.length > 0) {
      html += '<div class="cal-week-events">';
      evs.forEach(ev => {
        html += '<div class="cal-week-event"><span class="cal-week-event-time">' + escapeHtml(ev.time || '') + '</span> ' + escapeHtml(ev.title) + '</div>';
      });
      html += '</div>';
    }
    html += '</div>';
  }
  html += '</div>';
  gridArea.innerHTML = html;
}

function renderDayView(winIdOrEl, gridArea, headerHtml, days) {
  const { state: calState } = getAppStateAndEl(winIdOrEl);
  if (!calState) return;
  const d = new Date(calState.year, calState.month, calState.selected);
  const dayName = days[d.getDay()];
  const months = MONTHS_FULL;
  const evs = getEventsForDate(calState.year, calState.month, calState.selected);

  let html = headerHtml;
  html += '<div class="calendar-day-view">';
  html += '<div class="cal-day-header">' + dayName + ', ' + months[calState.month] + ' ' + calState.selected + ', ' + calState.year + '</div>';
  if (evs.length === 0) {
    html += '<div class="calendar-events-empty">No events scheduled.</div>';
  } else {
    html += '<div class="cal-day-events">';
    evs.forEach(ev => {
      html += '<div class="calendar-event-item">';
      html += '<span class="calendar-event-time">' + escapeHtml(ev.time || 'All day') + '</span>';
      html += '<span class="calendar-event-text">' + escapeHtml(ev.title) + '</span>';
      html += '</div>';
    });
    html += '</div>';
  }
  html += '</div>';
  gridArea.innerHTML = html;
}

function calSetView(e, view) {
  const { state: calState, winId } = getAppStateAndEl(e.target);
  if (!calState) return;
  calState.view = view;
  renderCalendar(winId);
}
function calPickWeekDay(e, y, m, d) {
  const { state: calState, winId } = getAppStateAndEl(e.target);
  if (!calState) return;
  calState.year = y;
  calState.month = m;
  calState.selected = d;
  renderCalendar(winId);
}
function renderCalendarEvents(winIdOrEl) {
  const { state: calState, el } = getAppStateAndEl(winIdOrEl);
  if (!calState || !el) return;
  const events = getEventsForDate(calState.year, calState.month, calState.selected);
  const dateLabel = el.querySelector('#calendar-events-date');
  const months = MONTHS_FULL;
  if (dateLabel) dateLabel.textContent = months[calState.month] + ' ' + calState.selected + ', ' + calState.year;

  const list = el.querySelector('#calendar-events-list');
  if (!list) return;
  if (events.length === 0) {
    list.innerHTML = '<div class="calendar-events-empty">No events. Click "+ New" to add one.</div>';
  } else {
    list.innerHTML = events.map(ev => 
      '<div class="calendar-event-item">' +
      '<span class="calendar-event-time">' + escapeHtml(ev.time || '') + '</span>' +
      '<span class="calendar-event-text">' + escapeHtml(ev.title) + '</span>' +
      '<button class="calendar-event-del" onclick="calDeleteEvent(event,\'' + ev.id + '\')">✕</button>' +
      '</div>'
    ).join('');
  }
}
function updateCalendarStatus(winIdOrEl) {
  const { state: calState, el } = getAppStateAndEl(winIdOrEl);
  if (!calState || !el) return;
  const events = getEventsForDate(calState.year, calState.month, calState.selected);
  const statusEl = el.querySelector('#calendar-status');
  if (statusEl) statusEl.textContent = events.length + ' event(s) on this date';
}
function calPrevMonth(e) {
  const { state: calState, winId } = getAppStateAndEl(e.target);
  if (!calState) return;
  if (calState.month === 0) { calState.month = 11; calState.year--; }
  else calState.month--;
  calState.selected = 1;
  renderCalendar(winId);
}
function calNextMonth(e) {
  const { state: calState, winId } = getAppStateAndEl(e.target);
  if (!calState) return;
  if (calState.month === 11) { calState.month = 0; calState.year++; }
  else calState.month++;
  calState.selected = 1;
  renderCalendar(winId);
}
function calPickDate(e, day) {
  const { state: calState, winId } = getAppStateAndEl(e.target);
  if (!calState) return;
  calState.selected = day;
  renderCalendar(winId);
}
function calGoToday(e) {
  const { state: calState, winId } = getAppStateAndEl(e.target);
  if (!calState) return;
  const now = new Date();
  calState.year = now.getFullYear();
  calState.month = now.getMonth();
  calState.selected = now.getDate();
  renderCalendar(winId);
}
function calAddEvent() {
  const { state: calState, winId } = getAppStateAndEl();
  if (!calState) return;
  const title = prompt('Event title:');
  if (!title || !title.trim()) return;
  const time = prompt('Time (e.g. 10:00 AM):', '');
  const key = getDateKey(calState.year, calState.month, calState.selected);
  eventStore.add(key, { title: title.trim(), time: time ? time.trim() : '' });
  renderCalendar(winId);
}
function calDeleteEvent(e, evId) {
  const { state: calState, winId } = getAppStateAndEl(e.target);
  if (!calState) return;
  const key = getDateKey(calState.year, calState.month, calState.selected);
  const events = eventStore.forDate(key);
  if (!events.length) return;
  const ev = events.find(ev => ev.id === evId);
  if (ev) moveToRecycleBin('event', { key, event: ev });
  eventStore.remove(key, evId);
  renderCalendar(winId);
}
