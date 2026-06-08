// ===== WINDOWS XP LOCK / WELCOME SCREEN =====
let lockTimer = null;
const LOCK_TIMEOUT = 180000;

function getLockAssetUrl(file) {
  const publicUrl =
    (typeof process !== 'undefined' &&
      process.env &&
      process.env.PUBLIC_URL) ||
    '';
  const appsBase = window.APPS_PUBLIC_BASE || publicUrl + '/apps/';
  const root = appsBase.replace(/\/apps\/?$/, '');
  return root + '/apps/images/' + file;
}

function initLockScreen() {
  resetLockTimer();
  document.addEventListener('mousemove', resetLockTimer);
  document.addEventListener('keydown', resetLockTimer);
  document.addEventListener('click', resetLockTimer);
  document.addEventListener('scroll', resetLockTimer);
}

function resetLockTimer() {
  if (lockTimer) clearTimeout(lockTimer);
  if (document.querySelector('.lockscreen-overlay')) return;
  lockTimer = setTimeout(showLockScreen, LOCK_TIMEOUT);
}

function showLockScreen() {
  if (document.querySelector('.lockscreen-overlay')) return;
  const tpl = document.getElementById('tpl-lockscreen');
  if (!tpl) return;

  const overlay = tpl.content.firstElementChild.cloneNode(true);
  document.body.appendChild(overlay);

  const userName = controlPanelStore.getUserName();
  const passwordEnabled = controlPanelStore.getPasswordEnabled();
  const hasPassword = passwordEnabled && controlPanelStore.getPassword();

  const iconUrl = getLockAssetUrl('user-account.png');
  const flagUrl = getLockAssetUrl('windows-flag.png');

  const flagEl = overlay.querySelector('#lockscreen-flag');
  const userIcon = overlay.querySelector('#lockscreen-user-icon');
  const unlockIcon = overlay.querySelector('#lockscreen-unlock-icon');
  const userNameEl = overlay.querySelector('#lockscreen-user-name');
  const unlockUserEl = overlay.querySelector('#lockscreen-unlock-username');
  const messageEl = overlay.querySelector('#lockscreen-message');

  if (flagEl) flagEl.src = flagUrl;
  if (userIcon) userIcon.src = iconUrl;
  if (unlockIcon) unlockIcon.src = iconUrl;
  if (userNameEl) userNameEl.textContent = userName;
  if (unlockUserEl) unlockUserEl.textContent = userName;

  if (messageEl) {
    messageEl.textContent = hasPassword
      ? 'This computer is in use and has been locked.'
      : 'To begin, click your user name';
  }

  updateLockScreenDateTime();
  const interval = setInterval(updateLockScreenDateTime, 10000);
  overlay.dataset.intervalId = interval;

  wireLockScreenEvents(overlay, hasPassword);
}

function wireLockScreenEvents(overlay, hasPassword) {
  const userTile = overlay.querySelector('#lockscreen-user-tile');
  const usersPanel = overlay.querySelector('#lockscreen-users');
  const unlockForm = overlay.querySelector('#lockscreen-unlock-form');
  const passwordInput = overlay.querySelector('#lockscreen-password');
  const submitBtn = overlay.querySelector('#lockscreen-submit');
  const errorEl = overlay.querySelector('#lockscreen-error');
  const turnOffBtn = overlay.querySelector('#lockscreen-turn-off');

  function showUnlockForm() {
    if (usersPanel) usersPanel.classList.add('hidden');
    if (unlockForm) unlockForm.classList.remove('hidden');
    if (errorEl) errorEl.textContent = '';
    if (passwordInput) {
      passwordInput.value = '';
      passwordInput.focus();
    }
  }

  function onUserSelected() {
    if (!hasPassword) {
      beginUnlock(overlay);
      return;
    }
    showUnlockForm();
  }

  function onSubmitPassword() {
    if (!hasPassword) {
      beginUnlock(overlay);
      return;
    }
    const entered = passwordInput ? passwordInput.value : '';
    const expected = controlPanelStore.getPassword();
    if (entered === expected) {
      beginUnlock(overlay);
    } else {
      if (errorEl) {
        errorEl.textContent =
          'The system could not log you on. Make sure your user name and password are correct.';
      }
      if (passwordInput) {
        passwordInput.value = '';
        passwordInput.focus();
      }
    }
  }

  if (userTile) {
    userTile.addEventListener('click', (e) => {
      e.stopPropagation();
      onUserSelected();
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onSubmitPassword();
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') onSubmitPassword();
      if (e.key === 'Escape' && usersPanel && unlockForm) {
        unlockForm.classList.add('hidden');
        usersPanel.classList.remove('hidden');
        if (errorEl) errorEl.textContent = '';
      }
    });
  }

  if (turnOffBtn) {
    turnOffBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      unlockScreen(overlay);
      if (typeof ShellAPI !== 'undefined') {
        ShellAPI.notify(ShellAPI.events.POWER_OFF, { mode: 'TURN_OFF' });
      }
    });
  }

  overlay.addEventListener('click', (e) => {
    if (e.target.closest('.xp-unlock-form')) return;
    if (e.target.closest('.xp-user-tile')) return;
    if (hasPassword && unlockForm && !unlockForm.classList.contains('hidden')) {
      unlockForm.classList.add('hidden');
      if (usersPanel) usersPanel.classList.remove('hidden');
      if (errorEl) errorEl.textContent = '';
    }
  });
}

function beginUnlock(overlay) {
  const unlockForm = overlay.querySelector('#lockscreen-unlock-form');
  const usersPanel = overlay.querySelector('#lockscreen-users');
  const progress = overlay.querySelector('#lockscreen-progress');
  const progressFill = overlay.querySelector('#lockscreen-progress-fill');
  const passwordInput = overlay.querySelector('#lockscreen-password');
  const submitBtn = overlay.querySelector('#lockscreen-submit');
  const userTile = overlay.querySelector('#lockscreen-user-tile');

  if (unlockForm) unlockForm.classList.add('hidden');
  if (usersPanel) usersPanel.classList.add('hidden');
  if (passwordInput) passwordInput.disabled = true;
  if (submitBtn) submitBtn.disabled = true;
  if (userTile) userTile.disabled = true;

  if (progress) progress.classList.remove('hidden');
  requestAnimationFrame(() => {
    if (progressFill) progressFill.style.width = '100%';
  });

  setTimeout(() => unlockScreen(overlay), 1500);
}

function updateLockScreenDateTime() {
  const el = document.querySelector('#lockscreen-datetime');
  if (!el) return;
  const now = new Date();
  let h = now.getHours();
  const m = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  el.textContent =
    DAYS_FULL[now.getDay()] +
    ', ' +
    MONTHS_FULL[now.getMonth()] +
    ' ' +
    now.getDate() +
    ', ' +
    now.getFullYear() +
    '  ' +
    h +
    ':' +
    String(m).padStart(2, '0') +
    ' ' +
    ampm;
}

function unlockScreen(overlay) {
  const interval = parseInt(overlay.dataset.intervalId);
  if (interval) clearInterval(interval);
  if (overlay) overlay.remove();
  resetLockTimer();
}

ShellAPI.registerEmbedded({ showLockScreen, initLockScreen });