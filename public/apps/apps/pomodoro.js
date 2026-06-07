// ===== POMODORO APP =====
let pomodoroState = {};

function initPomodoroApp(winId, el) {
  const id = winId;
  const cp = controlPanelStore.getAll();
  const workMins = parseInt(cp.pomodoroWork) || 25;
  const breakMins = parseInt(cp.pomodoroBreak) || 5;
  pomodoroState[id] = {
    minutes: workMins,
    seconds: 0,
    isWork: true,
    running: false,
    interval: null,
    sessionCount: 0,
    totalSeconds: workMins * 60,
    workDuration: workMins,
    breakDuration: breakMins,
    autoStart: false,
    linkedTaskId: null,
  };
  renderPomodoro(el, id);
}
function renderPomodoro(el, id) {
  const ps = pomodoroState[id];
  if (!ps) return;
  const m = String(ps.minutes).padStart(2, '0');
  const s = String(ps.seconds).padStart(2, '0');
  const pct = ps.totalSeconds > 0 ? ((ps.totalSeconds - (ps.minutes * 60 + ps.seconds)) / ps.totalSeconds * 100) : 0;

  const container = el.querySelector('#pomodoro-container');
  container.className = 'pomodoro-container ' + (ps.isWork ? 'phase-work' : 'phase-break');
  container.innerHTML = `
    <div class="pomodoro-lcd">
      <div class="pomodoro-label">${ps.isWork ? 'FOCUS SESSION' : 'BREAK'}</div>
      <div class="pomodoro-timer">${m}:${s}</div>
    </div>
    
    <div class="pomodoro-progress-container">
      <div class="pomodoro-progress">
        <div class="pomodoro-progress-fill" style="width:${pct}%"></div>
      </div>
    </div>
    
    <div style="margin-top: 12px; margin-bottom: 12px; text-align: center;">
      <button class="win95-button" style="width: 80px; font-weight: bold;" onclick="pomodoroStart(event,'${id}')">${ps.running ? 'Pause' : 'Start'}</button>
      <button class="win95-button" style="width: 80px;" onclick="pomodoroReset(event,'${id}')">Reset</button>
    </div>

    <fieldset class="pomodoro-settings">
      <legend>Preferences</legend>
      
      <div class="pomodoro-row">
        <label>Link to task:</label>
        <select class="win95-input pomodoro-task-select" id="pom-task-${id}" onchange="pomodoroLinkTask(event,'${id}')">
          <option value="">— none —</option>
          ${renderPomodoroTaskOptions(ps.linkedTaskId)}
        </select>
      </div>

      <div class="pomodoro-row">
        <label>Work Time:</label>
        <div class="pomodoro-presets">
          <button class="pomodoro-preset-btn ${ps.workDuration===15?'active-preset':''}" onclick="pomodoroSetPreset(event,'${id}',15)">15</button>
          <button class="pomodoro-preset-btn ${ps.workDuration===25?'active-preset':''}" onclick="pomodoroSetPreset(event,'${id}',25)">25</button>
          <button class="pomodoro-preset-btn ${ps.workDuration===45?'active-preset':''}" onclick="pomodoroSetPreset(event,'${id}',45)">45</button>
          <span>mins</span>
        </div>
      </div>

      <div class="pomodoro-row">
        <label>Break Time:</label>
        <div class="pomodoro-presets">
          <button class="pomodoro-preset-btn ${ps.breakDuration===3?'active-preset':''}" onclick="pomodoroSetBreak(event,'${id}',3)">3</button>
          <button class="pomodoro-preset-btn ${ps.breakDuration===5?'active-preset':''}" onclick="pomodoroSetBreak(event,'${id}',5)">5</button>
          <button class="pomodoro-preset-btn ${ps.breakDuration===10?'active-preset':''}" onclick="pomodoroSetBreak(event,'${id}',10)">10</button>
          <button class="pomodoro-preset-btn ${ps.breakDuration===15?'active-preset':''}" onclick="pomodoroSetBreak(event,'${id}',15)">15</button>
          <span>mins</span>
        </div>
      </div>

      <div class="pomodoro-row" style="margin-top: 8px;">
        <input type="checkbox" class="win95-checkbox" id="pom-auto-${id}" ${ps.autoStart?'checked':''} onchange="pomodoroToggleAuto(event,'${id}')">
        <label for="pom-auto-${id}">Auto-start next session</label>
      </div>
    </fieldset>
    
    <div style="font-size: 11px; margin-bottom: 2px;">Sessions completed: ${ps.sessionCount}</div>
    ${renderPomodoroLog()}
  `;
  // Update status bar
  const statusEl = el.querySelector('#pomodoro-status');
  if (statusEl) statusEl.textContent = ps.running ? (ps.isWork ? 'Working...' : 'Break time...') : 'Ready';
}
function pomodoroSetPreset(e, id, mins) {
  const ps = pomodoroState[id];
  if (!ps) return;
  if (ps.running) { clearInterval(ps.interval); ps.running = false; }
  ps.workDuration = mins;
  ps.isWork = true;
  ps.minutes = mins;
  ps.seconds = 0;
  ps.totalSeconds = mins * 60;
  renderPomodoro(findWinElById(id), id);
}
function pomodoroSetBreak(e, id, mins) {
  const ps = pomodoroState[id];
  if (!ps) return;
  ps.breakDuration = mins;
  renderPomodoro(findWinElById(id), id);
}
function pomodoroStart(e, id) {
  const ps = pomodoroState[id];
  if (!ps) return;
  if (ps.running) {
    clearInterval(ps.interval);
    ps.running = false;
  } else {
    ps.running = true;
    requestPomodoroPermission();
    shellEvents.emit('window:flash_stop', id);
    ps.totalSeconds = ps.minutes * 60 + ps.seconds;
    ps.interval = setInterval(() => pomodoroTick(id), 1000);
  }
  renderPomodoro(findWinElById(id), id);
  emitPomodoroUpdate();
}
function pomodoroReset(e, id) {
  const ps = pomodoroState[id];
  if (!ps) return;
  clearInterval(ps.interval);
  ps.running = false;
  ps.isWork = true;
  ps.minutes = ps.workDuration;
  ps.seconds = 0;
  ps.totalSeconds = ps.workDuration * 60;
  renderPomodoro(findWinElById(id), id);
  emitPomodoroUpdate();
}
function pomodoroToggleAuto(e, id) {
  const ps = pomodoroState[id];
  if (!ps) return;
  ps.autoStart = e.target.checked;
}

function renderPomodoroTaskOptions(selectedId) {
  const active = (todoStore.all()).filter(t => !t.completed);
  return active.map(t =>
    '<option value="' + t.id + '"' + (t.id === selectedId ? ' selected' : '') + '>' + escapeHtml(t.text.substring(0, 40)) + '</option>'
  ).join('');
}

function pomodoroLinkTask(e, id) {
  const ps = pomodoroState[id];
  if (!ps) return;
  ps.linkedTaskId = e.target.value || null;
}
function pomodoroTick(id) {
  const ps = pomodoroState[id];
  if (!ps || !ps.running) return;
  if (ps.seconds === 0) {
    if (ps.minutes === 0) {
      // Session complete
      clearInterval(ps.interval);
      ps.running = false;
      const wasWork = ps.isWork;
      if (ps.isWork) {
        ps.sessionCount++;
        // Auto-complete linked task
        if (ps.linkedTaskId) {
          const todo = (todoStore.all()).find(t => t.id === ps.linkedTaskId);
          if (todo && !todo.completed) {
            todo.completed = true;
            todo.completedAt = Date.now();
          }
        }
        // Log completed work session
        pomodoroStore.log({ date: Date.now(), duration: ps.workDuration, linkedTaskId: ps.linkedTaskId });
        ps.isWork = false;
        ps.minutes = ps.breakDuration;
      } else {
        ps.isWork = true;
        ps.minutes = ps.workDuration;
      }
      ps.seconds = 0;
      ps.totalSeconds = ps.minutes * 60;
      playPomodoroAlert(wasWork);
      // Flash taskbar button
      shellEvents.emit('window:flash_start', id);
      // Auto-start if enabled
      if (ps.autoStart) {
        setTimeout(() => {
          const freshPs = pomodoroState[id];
          if (freshPs && !freshPs.running) {
            freshPs.running = true;
            freshPs.totalSeconds = freshPs.minutes * 60 + freshPs.seconds;
            freshPs.interval = setInterval(() => pomodoroTick(id), 1000);
            const el = findWinElById(id);
            if (el) renderPomodoro(el, id);
          }
        }, 1200);
      }
    } else {
      ps.minutes--;
      ps.seconds = 59;
    }
  } else {
    ps.seconds--;
  }
  const el = findWinElById(id);
  if (el) renderPomodoro(el, id);
  emitPomodoroUpdate();
}
function playPomodoroAlert(isWorkComplete) {
  // Audio alert
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) { /* audio not available */ }
  // Browser notification
  if ('Notification' in window && Notification.permission === 'granted') {
    const title = isWorkComplete ? '🍅 Focus Session Complete!' : '☕ Break Over!';
    const body = isWorkComplete ? 'Great work! Time for a break.' : 'Break finished. Ready to focus?';
    try { new Notification(title, { body, tag: 'pomodoro' }); } catch(e) {}
  }
}
function requestPomodoroPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function renderPomodoroLog() {
  const sessions = pomodoroStore.recent(5);
  if (sessions.length === 0) return '';
  let html = '<div class="pomodoro-log">';
  html += '<div class="pomodoro-log-title">Recent sessions</div>';
  sessions.forEach(s => {
    const d = new Date(s.date);
    const h = d.getHours(), m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    const min = m < 10 ? '0' + m : m;
    html += '<div class="pomodoro-log-item">';
    html += '<span class="pom-log-dot">🍅</span>';
    html += '<span>' + s.duration + 'min</span>';
    html += '<span class="pom-log-time">' + hr + ':' + min + ' ' + ampm + '</span>';
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function emitPomodoroUpdate() {
  let activePs = null;
  for (const [id, ps] of Object.entries(pomodoroState)) {
    if (ps.running) { activePs = ps; break; }
  }
  shellEvents.emit('pomodoro:update', activePs ? {
    isWork: activePs.isWork,
    minutes: activePs.minutes,
    seconds: activePs.seconds
  } : null);
}
