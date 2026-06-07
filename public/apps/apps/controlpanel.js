// ===== CONTROL PANEL =====
function cpTab(tab) {
  const panelIds = ['cp-system-panel','cp-reset-panel','cp-pomodoro-panel','cp-display-panel','cp-mail-panel','cp-security-panel'];
  panelIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const target = document.getElementById('cp-'+tab+'-panel');
  if (target) target.style.display = 'block';
  if (tab === 'system') cpInit();
}

function cpInit() {
  const el = findWinEl('controlpanel');
  if (!el) return;
  // Browser info
  const ua = navigator.userAgent;
  el.querySelector('#cp-browser').textContent = ua.split(' ').pop() || '--';
  el.querySelector('#cp-useragent').textContent = ua;
  // localStorage usage
  let used = 0;
  for (let k in localStorage) { if (localStorage.hasOwnProperty(k)) used += localStorage[k].length; }
  el.querySelector('#cp-storage').textContent = (used / 1024).toFixed(2) + ' KB';
  // Load saved settings
  const cp = controlPanelStore.getAll();
  const workInput = el.querySelector('#cp-pomodoro-work');
  const breakInput = el.querySelector('#cp-pomodoro-break');
  if (workInput) workInput.value = cp.pomodoroWork || 25;
  if (breakInput) breakInput.value = cp.pomodoroBreak || 5;
  const clockFmt = el.querySelector('#cp-clock-format');
  if (clockFmt) clockFmt.value = cp.clockFormat || '12';
  const showClock = el.querySelector('#cp-show-clock');
  if (showClock) showClock.checked = cp.showClock !== false;
  const mailSender = el.querySelector('#cp-mail-sender');
  const mailSig = el.querySelector('#cp-mail-sig');
  if (mailSender) mailSender.value = cp.mailSender || '';
  if (mailSig) mailSig.value = cp.mailSig || '';
  const desktopTheme = el.querySelector('#cp-desktop-theme');
  if (desktopTheme) desktopTheme.value = cp.desktopTheme || 'teal';
  
  // Security PIN settings
  const securityEnablePin = el.querySelector('#cp-security-enable-pin');
  const securityPin = el.querySelector('#cp-security-pin');
  const securityPinConfirm = el.querySelector('#cp-security-pin-confirm');
  const securityPinInputs = el.querySelector('#cp-security-pin-inputs');
  if (securityEnablePin) {
    const pinEnabled = cp.lockPinEnabled || false;
    securityEnablePin.checked = pinEnabled;
    if (securityPinInputs) {
      securityPinInputs.style.display = pinEnabled ? 'flex' : 'none';
    }
  }
  if (securityPin) securityPin.value = cp.lockPin || '';
  if (securityPinConfirm) securityPinConfirm.value = cp.lockPin || '';
}

function cpResetAll() {
  if (!confirm('Reset ALL data? This cannot be undone.')) return;
  localStorage.clear();
  location.reload();
}

function cpResetApp(app) {
  if (!confirm('Reset ' + app + ' data? This cannot be undone.')) return;
  filesystem.resetDomain(app);
  const el = findWinEl('controlpanel');
  if (el) el.querySelector('#cp-status').textContent = app + ' reset complete';
}

function cpSavePomodoro() {
  const el = findWinEl('controlpanel');
  if (!el) return;
  const work = parseInt(el.querySelector('#cp-pomodoro-work').value) || 25;
  const brk = parseInt(el.querySelector('#cp-pomodoro-break').value) || 5;
  controlPanelStore.set('pomodoroWork', work);
  controlPanelStore.set('pomodoroBreak', brk);
  el.querySelector('#cp-status').textContent = 'Pomodoro defaults saved';
}

function cpSaveDisplay() {
  const el = findWinEl('controlpanel');
  if (!el) return;
  const fmt = el.querySelector('#cp-clock-format').value;
  const show = el.querySelector('#cp-show-clock').checked;
  const theme = el.querySelector('#cp-desktop-theme').value;
  controlPanelStore.set('clockFormat', fmt);
  controlPanelStore.set('showClock', show);
  controlPanelStore.set('desktopTheme', theme);
  updateClock(); // update clock immediately
  updateDesktopTheme(); // update theme immediately
  el.querySelector('#cp-status').textContent = 'Display settings saved';
}

function cpSaveMail() {
  const el = findWinEl('controlpanel');
  if (!el) return;
  const sender = el.querySelector('#cp-mail-sender').value;
  const sig = el.querySelector('#cp-mail-sig').value;
  controlPanelStore.set('mailSender', sender);
  controlPanelStore.set('mailSig', sig);
  el.querySelector('#cp-status').textContent = 'Outlook Express defaults saved';
}

function cpTogglePin(checkbox) {
  const el = findWinEl('controlpanel');
  if (!el) return;
  const pinInputs = el.querySelector('#cp-security-pin-inputs');
  if (pinInputs) {
    pinInputs.style.display = checkbox.checked ? 'flex' : 'none';
  }
}

function cpSaveSecurity() {
  const el = findWinEl('controlpanel');
  if (!el) return;
  const enablePin = el.querySelector('#cp-security-enable-pin').checked;
  const pin = el.querySelector('#cp-security-pin').value;
  const confirmPin = el.querySelector('#cp-security-pin-confirm').value;
  const statusEl = el.querySelector('#cp-status');
  
  if (enablePin) {
    if (!/^\d{4}$/.test(pin)) {
      if (statusEl) statusEl.textContent = 'Error: PIN must be exactly 4 digits.';
      return;
    }
    if (pin !== confirmPin) {
      if (statusEl) statusEl.textContent = 'Error: PIN codes do not match.';
      return;
    }
    controlPanelStore.setPin(pin);
  } else {
    controlPanelStore.clearPin();
  }
  if (statusEl) statusEl.textContent = 'Security settings saved';
}

function cpClearCache() {
  if (!confirm('Clear all cached Bible chapters and temporary data?')) return;
  bibleCache = {};
  try {
    localStorage.removeItem(BIBLE_CACHE_KEY);
  } catch (e) {}
  for (let k in localStorage) {
    if (k.startsWith('bible-')) localStorage.removeItem(k);
  }
  const el = findWinEl('controlpanel');
  if (el) el.querySelector('#cp-status').textContent = 'Cache cleared';
  cpInit();
}
